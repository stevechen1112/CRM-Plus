import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { ImportPreviewService } from './import-preview.service';
import { ImportCommitResult, ImportValidationError } from '../dto/import.dto';

@Injectable()
export class ImportExecutionService {
  constructor(
    private prisma: PrismaService,
    private previewService: ImportPreviewService
  ) {}

  async commitImport(
    previewId: string,
    upsert: boolean = false,
    userId: string
  ): Promise<ImportCommitResult> {
    const startTime = Date.now();
    const previewData = this.previewService.getPreviewData(previewId);
    
    if (!previewData) {
      throw new BadRequestException('預覽資料不存在或已過期');
    }

    const { rawData, dataType, fileName, suggestedMappings } = previewData;
    
    let result: ImportCommitResult;
    
    try {
      if (dataType === 'customers') {
        result = await this.importCustomers(rawData, suggestedMappings, upsert, fileName);
      } else if (dataType === 'orders') {
        result = await this.importOrders(rawData, suggestedMappings, upsert, fileName);
      } else {
        throw new BadRequestException('不支援的資料類型');
      }

      // Log to audit
      await this.logImportAudit(
        dataType,
        fileName,
        result.successfulRows,
        result.errorRows,
        userId,
        `匯入完成: 成功 ${result.successfulRows} 筆, 錯誤 ${result.errorRows} 筆, 忽略 ${result.ignoredRows} 筆`
      );

      result.duration = Date.now() - startTime;
      
      // Clear preview data
      this.previewService.clearPreviewData(previewId);
      
      return result;
      
    } catch (error) {
      await this.logImportAudit(
        dataType,
        fileName,
        0,
        rawData.length,
        userId,
        `匯入失敗: ${error.message}`
      );
      throw error;
    }
  }

  private async importCustomers(
    rawData: any[],
    mappings: any[],
    upsert: boolean,
    fileName: string
  ): Promise<ImportCommitResult> {
    const errors: ImportValidationError[] = [];
    let successfulRows = 0;
    let errorRows = 0;
    let ignoredRows = 0;
    let duplicatesHandled = 0;

    // Use transaction for consistency
    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNumber = i + 2;
        
        try {
          // Map fields
          const customerData = this.mapRowToCustomer(row, mappings);
          
          if (!customerData.phone) {
            errors.push({
              row: rowNumber,
              field: 'phone',
              value: '',
              error: '手機號碼為必填欄位'
            });
            errorRows++;
            continue;
          }

          // Check if customer exists
          const existingCustomer = await tx.customer.findUnique({
            where: { phone: customerData.phone }
          });

          if (existingCustomer) {
            if (upsert) {
              // Update existing customer
              await tx.customer.update({
                where: { phone: customerData.phone },
                data: {
                  ...customerData,
                  updatedAt: new Date()
                }
              });
              duplicatesHandled++;
              successfulRows++;
            } else {
              // Skip duplicate
              ignoredRows++;
            }
          } else {
            // Create new customer
            await tx.customer.create({
              data: customerData
            });
            successfulRows++;
          }

        } catch (error) {
          errors.push({
            row: rowNumber,
            field: 'general',
            value: JSON.stringify(row),
            error: error.message
          });
          errorRows++;
        }
      }
    });

    return {
      success: errorRows === 0,
      fileName,
      totalRows: rawData.length,
      successfulRows,
      ignoredRows,
      errorRows,
      errors,
      duplicatesHandled,
      duration: 0 // Will be set by caller
    };
  }

  private async importOrders(
    rawData: any[],
    mappings: any[],
    upsert: boolean,
    fileName: string
  ): Promise<ImportCommitResult> {
    const errors: ImportValidationError[] = [];
    let successfulRows = 0;
    let errorRows = 0;
    let ignoredRows = 0;
    let duplicatesHandled = 0;

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNumber = i + 2;
        
        try {
          // Map fields
          const orderData = this.mapRowToOrder(row, mappings);
          
          if (!orderData.orderNo || !orderData.customerPhone) {
            errors.push({
              row: rowNumber,
              field: 'required',
              value: '',
              error: '訂單編號和客戶手機號碼為必填欄位'
            });
            errorRows++;
            continue;
          }

          // Check if customer exists
          const customer = await tx.customer.findUnique({
            where: { phone: orderData.customerPhone }
          });

          if (!customer) {
            errors.push({
              row: rowNumber,
              field: 'customer_phone',
              value: orderData.customerPhone,
              error: '客戶不存在'
            });
            errorRows++;
            continue;
          }

          // Check if order exists
          const existingOrder = await tx.order.findUnique({
            where: { orderNo: orderData.orderNo }
          });

          if (existingOrder) {
            if (upsert) {
              // Update existing order
              await tx.order.update({
                where: { orderNo: orderData.orderNo },
                data: {
                  ...orderData,
                  updatedAt: new Date()
                }
              });
              duplicatesHandled++;
              successfulRows++;
            } else {
              // Skip duplicate
              ignoredRows++;
            }
          } else {
            // Create new order
            await tx.order.create({
              data: orderData
            });
            successfulRows++;
          }

        } catch (error) {
          errors.push({
            row: rowNumber,
            field: 'general',
            value: JSON.stringify(row),
            error: error.message
          });
          errorRows++;
        }
      }
    });

    return {
      success: errorRows === 0,
      fileName,
      totalRows: rawData.length,
      successfulRows,
      ignoredRows,
      errorRows,
      errors,
      duplicatesHandled,
      duration: 0
    };
  }

  private mapRowToCustomer(row: any, mappings: any[]): any {
    const customerData: any = {};
    
    for (const mapping of mappings) {
      const value = row[mapping.sourceField];
      if (!value || value.toString().trim() === '') continue;
      
      const strValue = value.toString().trim();
      
      switch (mapping.targetField) {
        case 'name':
          customerData.name = strValue;
          break;
        case 'phone':
          customerData.phone = strValue;
          break;
        case 'email':
          customerData.email = strValue;
          break;
        case 'line_id':
          customerData.lineId = strValue;
          break;
        case 'facebook_url':
          customerData.facebookUrl = strValue;
          break;
        case 'source':
          customerData.source = strValue;
          break;
        case 'tags':
          customerData.tags = strValue.split(';').map(tag => tag.trim()).filter(tag => tag);
          break;
        case 'city':
          customerData.city = strValue;
          break;
        case 'birthday':
          customerData.birthday = new Date(strValue);
          break;
        case 'preference_category':
          customerData.preferenceCategory = strValue;
          break;
        case 'payment_preference':
          customerData.paymentPreference = strValue;
          break;
        case 'marketing_consent':
          customerData.marketingConsent = ['Y', 'y', 'yes', 'true', '1'].includes(strValue);
          break;
        case 'marketing_consent_at':
          customerData.marketingConsentAt = new Date(strValue);
          break;
        case 'note':
          customerData.note = strValue;
          break;
      }
    }
    
    return customerData;
  }

  private mapRowToOrder(row: any, mappings: any[]): any {
    const orderData: any = {};
    
    for (const mapping of mappings) {
      const value = row[mapping.sourceField];
      if (!value || value.toString().trim() === '') continue;
      
      const strValue = value.toString().trim();
      
      switch (mapping.targetField) {
        case 'order_no':
          orderData.orderNo = strValue;
          break;
        case 'customer_phone':
          orderData.customerPhone = strValue;
          break;
        case 'created_at':
          orderData.createdAt = new Date(strValue);
          break;
        case 'completed_at':
          orderData.completedAt = new Date(strValue);
          break;
        case 'payment_method':
          orderData.paymentMethod = strValue;
          break;
        case 'payment_status':
          orderData.paymentStatus = strValue;
          break;
        case 'fulfillment_method':
          orderData.fulfillmentMethod = strValue;
          break;
        case 'order_status':
          orderData.orderStatus = strValue;
          break;
        case 'items':
          try {
            orderData.items = JSON.parse(strValue);
          } catch {
            orderData.items = [];
          }
          break;
        case 'note':
          orderData.note = strValue;
          break;
      }
    }
    
    return orderData;
  }

  private async logImportAudit(
    dataType: string,
    fileName: string,
    successRows: number,
    errorRows: number,
    userId: string,
    summary: string
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: 'import',
        entity: dataType,
        entityId: fileName,
        changes: {
          fileName,
          successRows,
          errorRows,
          summary
        },
        userId,
        userRole: 'STAFF',
        userIp: '',
        requestId: `import_${Date.now()}`,
        status: 'SUCCESS',
        latencyMs: 0,
        // ipAddress field doesn't exist in AuditLog model
        // userAgent field doesn't exist in AuditLog model
      }
    });
  }
}
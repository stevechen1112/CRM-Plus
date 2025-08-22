import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as csv from 'csv-parser';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import {
  ImportPreviewResult,
  ImportValidationError,
  FieldMappingDto,
} from '../dto/import.dto';

interface ParsedData {
  data: any[];
  columns: string[];
  totalRows: number;
}

@Injectable()
export class ImportPreviewService {
  private previewCache = new Map<string, any>();

  constructor(private configService: ConfigService) {}

  async parseFile(
    file: Express.Multer.File,
    dataType: 'customers' | 'orders'
  ): Promise<ImportPreviewResult> {
    const maxFileSize = this.configService.get('FILE_MAX_MB', 20) * 1024 * 1024;
    if (file.size > maxFileSize) {
      throw new BadRequestException(`檔案大小不能超過 ${this.configService.get('FILE_MAX_MB', 20)}MB`);
    }

    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('不支援的檔案格式');
    }

    let parsedData: ParsedData;
    
    try {
      if (file.mimetype.includes('sheet') || file.originalname.endsWith('.xlsx')) {
        parsedData = await this.parseExcel(file.buffer);
      } else {
        parsedData = await this.parseCSV(file.buffer);
      }
    } catch (error) {
      throw new BadRequestException(`檔案解析失敗: ${error.message}`);
    }

    const previewId = uuidv4();
    const result = await this.validateAndPreview(parsedData, dataType, file.originalname);
    
    // Store in cache for later commit
    this.previewCache.set(previewId, {
      ...result,
      rawData: parsedData.data,
      dataType,
      timestamp: new Date()
    });

    return {
      ...result,
      previewId
    };
  }

  private async parseCSV(buffer: Buffer): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
      const data: any[] = [];
      const readable = Readable.from(buffer);
      let columns: string[] = [];

      readable
        .pipe(csv())
        .on('headers', (headers) => {
          columns = headers;
        })
        .on('data', (row) => {
          data.push(row);
        })
        .on('end', () => {
          resolve({
            data,
            columns,
            totalRows: data.length
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  private async parseExcel(buffer: Buffer): Promise<ParsedData> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) {
      throw new Error('Excel 檔案為空或無法讀取');
    }

    const columns = jsonData[0] as string[];
    const data = jsonData.slice(1).map(row => {
      const obj: any = {};
      columns.forEach((col, index) => {
        obj[col] = row[index] || '';
      });
      return obj;
    });

    return {
      data,
      columns,
      totalRows: data.length
    };
  }

  private async validateAndPreview(
    parsedData: ParsedData,
    dataType: 'customers' | 'orders',
    fileName: string
  ): Promise<Omit<ImportPreviewResult, 'previewId'>> {
    const targetFields = this.getTargetFields(dataType);
    const suggestedMappings = this.suggestFieldMappings(parsedData.columns, targetFields);
    
    const validationResult = this.validateData(parsedData.data, dataType, suggestedMappings);
    
    return {
      fileName,
      totalRows: parsedData.totalRows,
      validRows: validationResult.validCount,
      invalidRows: validationResult.invalidCount,
      duplicateRows: validationResult.duplicateCount,
      errors: validationResult.errors.slice(0, 100), // Limit to first 100 errors
      sampleValidData: validationResult.validSamples,
      sampleInvalidData: validationResult.invalidSamples,
      detectedColumns: parsedData.columns,
      suggestedMappings
    };
  }

  private getTargetFields(dataType: 'customers' | 'orders'): Array<{field: string, required: boolean}> {
    if (dataType === 'customers') {
      return [
        { field: 'name', required: true },
        { field: 'phone', required: true },
        { field: 'email', required: false },
        { field: 'line_id', required: false },
        { field: 'facebook_url', required: false },
        { field: 'source', required: false },
        { field: 'tags', required: false },
        { field: 'city', required: false },
        { field: 'birthday', required: false },
        { field: 'preference_category', required: false },
        { field: 'payment_preference', required: false },
        { field: 'marketing_consent', required: false },
        { field: 'marketing_consent_at', required: false },
        { field: 'note', required: false }
      ];
    } else {
      return [
        { field: 'order_no', required: true },
        { field: 'customer_phone', required: true },
        { field: 'created_at', required: false },
        { field: 'completed_at', required: false },
        { field: 'payment_method', required: false },
        { field: 'payment_status', required: false },
        { field: 'fulfillment_method', required: false },
        { field: 'order_status', required: false },
        { field: 'items', required: false },
        { field: 'note', required: false }
      ];
    }
  }

  private suggestFieldMappings(sourceColumns: string[], targetFields: Array<{field: string, required: boolean}>): FieldMappingDto[] {
    const mappings: FieldMappingDto[] = [];
    
    for (const target of targetFields) {
      // Find best match in source columns
      const bestMatch = sourceColumns.find(col => 
        col.toLowerCase().includes(target.field.toLowerCase()) ||
        target.field.toLowerCase().includes(col.toLowerCase())
      );
      
      if (bestMatch) {
        mappings.push({
          targetField: target.field,
          sourceField: bestMatch,
          required: target.required
        });
      }
    }
    
    return mappings;
  }

  private validateData(
    data: any[], 
    dataType: 'customers' | 'orders',
    mappings: FieldMappingDto[]
  ): {
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
    errors: ImportValidationError[];
    validSamples: any[];
    invalidSamples: any[];
  } {
    const errors: ImportValidationError[] = [];
    const validSamples: any[] = [];
    const invalidSamples: any[] = [];
    const seenKeys = new Set<string>();
    
    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;

    data.forEach((row, index) => {
      const rowNumber = index + 2; // Excel row number (header is row 1)
      let isRowValid = true;
      const mappedRow: any = {};

      // Apply field mappings and validate
      for (const mapping of mappings) {
        const sourceValue = row[mapping.sourceField];
        
        if (mapping.required && (!sourceValue || sourceValue.toString().trim() === '')) {
          errors.push({
            row: rowNumber,
            field: mapping.targetField,
            value: sourceValue,
            error: '必填欄位不能為空'
          });
          isRowValid = false;
          continue;
        }

        // Field-specific validation
        const validationError = this.validateField(mapping.targetField, sourceValue, dataType);
        if (validationError) {
          errors.push({
            row: rowNumber,
            field: mapping.targetField,
            value: sourceValue,
            error: validationError
          });
          isRowValid = false;
        }

        mappedRow[mapping.targetField] = sourceValue;
      }

      // Check for duplicates
      const keyField = dataType === 'customers' ? 'phone' : 'order_no';
      const keyValue = mappedRow[keyField];
      if (keyValue && seenKeys.has(keyValue.toString())) {
        duplicateCount++;
        errors.push({
          row: rowNumber,
          field: keyField,
          value: keyValue,
          error: '重複的主鍵值'
        });
        isRowValid = false;
      } else if (keyValue) {
        seenKeys.add(keyValue.toString());
      }

      if (isRowValid) {
        validCount++;
        if (validSamples.length < 5) {
          validSamples.push(mappedRow);
        }
      } else {
        invalidCount++;
        if (invalidSamples.length < 5) {
          invalidSamples.push({ ...mappedRow, _errors: errors.filter(e => e.row === rowNumber) });
        }
      }
    });

    return {
      validCount,
      invalidCount,
      duplicateCount,
      errors,
      validSamples,
      invalidSamples
    };
  }

  private validateField(field: string, value: any, dataType: string): string | null {
    if (!value || value.toString().trim() === '') {
      return null; // Empty values are handled by required check
    }

    const strValue = value.toString().trim();

    switch (field) {
      case 'phone':
        if (!/^[0-9+\-\s()]{8,}$/.test(strValue)) {
          return '手機號碼格式錯誤';
        }
        break;
      
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
          return 'Email 格式錯誤';
        }
        break;
      
      case 'birthday':
      case 'marketing_consent_at':
      case 'created_at':
      case 'completed_at':
        if (!this.isValidDate(strValue)) {
          return '日期格式錯誤 (請使用 YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss)';
        }
        break;
      
      case 'marketing_consent':
        if (!['Y', 'N', 'y', 'n', 'yes', 'no', 'true', 'false', '1', '0'].includes(strValue.toLowerCase())) {
          return '行銷同意書格式錯誤 (請使用 Y/N)';
        }
        break;
      
      case 'items':
        if (dataType === 'orders') {
          try {
            JSON.parse(strValue);
          } catch {
            return '商品資料必須是有效的 JSON 格式';
          }
        }
        break;
    }

    return null;
  }

  private isValidDate(dateString: string): boolean {
    // Check YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date.getTime());
    }
    
    // Check YYYY-MM-DD HH:mm:ss format
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date.getTime());
    }
    
    return false;
  }

  getPreviewData(previewId: string): any {
    const data = this.previewCache.get(previewId);
    if (!data) {
      throw new BadRequestException('預覽資料已過期或不存在');
    }
    
    // Clean up old entries (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (data.timestamp < oneHourAgo) {
      this.previewCache.delete(previewId);
      throw new BadRequestException('預覽資料已過期');
    }
    
    return data;
  }

  clearPreviewData(previewId: string): void {
    this.previewCache.delete(previewId);
  }
}
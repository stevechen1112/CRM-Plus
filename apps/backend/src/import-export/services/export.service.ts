import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { ExportQuery } from '../dto/import.dto';
import { Readable } from 'stream';
import { createObjectCsvStringifier } from 'csv-writer';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportCustomersCSV(query: ExportQuery = {}, userId: string): Promise<Readable> {
    const where: any = {};
    
    // Apply filters
    if (query.source) where.source = query.source;
    // city field doesn't exist in current Customer model
    if (query.hasOrders !== undefined) {
      where.orders = query.hasOrders ? { some: {} } : { none: {} };
    }
    if (query.hasInteractions !== undefined) {
      where.interactions = query.hasInteractions ? { some: {} } : { none: {} };
    }

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: {
            orders: true,
            interactions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Log export action
    await this.logExportAudit('customers', customers.length, userId);

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'name', title: 'name' },
        { id: 'phone', title: 'phone' },
        { id: 'email', title: 'email' },
        { id: 'lineId', title: 'line_id' },
        { id: 'facebookUrl', title: 'facebook_url' },
        { id: 'source', title: 'source' },
        { id: 'tags', title: 'tags' },
        // Removed non-existent fields: city, birthday, preferenceCategory, paymentPreference
        { id: 'marketingConsent', title: 'marketing_consent' },
        // Removed non-existent fields: marketingConsentAt, note
        { id: 'orderCount', title: 'order_count' },
        { id: 'interactionCount', title: 'interaction_count' },
        { id: 'createdAt', title: 'created_at' }
      ]
    });

    const records = customers.map(customer => ({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      lineId: customer.lineId || '',
      facebookUrl: customer.facebookUrl || '',
      source: customer.source || '',
      tags: (customer.tags || []).join(';'),
      // Removed non-existent fields: city, birthday, preferenceCategory, paymentPreference
      marketingConsent: customer.marketingConsent ? 'Y' : 'N',
      // Removed non-existent fields: marketingConsentAt, note
      orderCount: customer._count.orders,
      interactionCount: customer._count.interactions,
      createdAt: customer.createdAt.toISOString().replace('T', ' ').split('.')[0]
    }));

    // Add UTF-8 BOM for proper encoding
    const header = '\uFEFF' + csvStringifier.getHeaderString();
    const csvData = header + csvStringifier.stringifyRecords(records);
    
    return Readable.from(csvData);
  }

  async exportOrdersCSV(query: ExportQuery = {}, userId: string): Promise<Readable> {
    const where: any = {};
    
    // Apply filters
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.orderStatus) where.orderStatus = query.orderStatus;
    if (query.paymentMethod) where.paymentMethod = query.paymentMethod;
    
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            name: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Log export action
    await this.logExportAudit('orders', orders.length, userId);

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'orderNo', title: 'order_no' },
        { id: 'customerPhone', title: 'customer_phone' },
        { id: 'customerName', title: 'customer_name' },
        { id: 'createdAt', title: 'created_at' },
        // Removed non-existent field: completedAt
        { id: 'paymentMethod', title: 'payment_method' },
        { id: 'paymentStatus', title: 'payment_status' },
        // Removed non-existent field: fulfillmentMethod
        { id: 'orderStatus', title: 'order_status' },
        { id: 'totalAmount', title: 'total_amount' },
        // Removed non-existent fields: items, note
      ]
    });

    const records = orders.map(order => ({
      orderNo: order.orderNo,
      customerPhone: order.customerPhone,
      customerName: order.customer?.name || '',
      createdAt: order.createdAt.toISOString().replace('T', ' ').split('.')[0],
      // Removed non-existent field: completedAt
      paymentMethod: order.paymentMethod || '',
      paymentStatus: order.paymentStatus || '',
      // Removed non-existent field: fulfillmentMethod
      orderStatus: order.orderStatus || '',
      totalAmount: order.totalAmount || 0,
      // Removed non-existent fields: items, note
    }));

    const header = '\uFEFF' + csvStringifier.getHeaderString();
    const csvData = header + csvStringifier.stringifyRecords(records);
    
    return Readable.from(csvData);
  }

  async exportInteractionsCSV(query: ExportQuery = {}, userId: string): Promise<Readable> {
    const where: any = {};
    
    // Apply filters
    if (query.channel) where.channel = query.channel;
    if (query.userId) where.userId = query.userId;
    
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const interactions = await this.prisma.interaction.findMany({
      where,
      include: {
        customer: {
          select: {
            name: true,
            phone: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Log export action
    await this.logExportAudit('interactions', interactions.length, userId);

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'customerPhone', title: 'customer_phone' },
        { id: 'customerName', title: 'customer_name' },
        { id: 'channel', title: 'channel' },
        { id: 'summary', title: 'summary' },
        { id: 'notes', title: 'notes' },
        { id: 'createdAt', title: 'created_at' },
        { id: 'userId', title: 'user_id' },
        { id: 'userName', title: 'user_name' }
      ]
    });

    const records = interactions.map(interaction => ({
      customerPhone: interaction.customerPhone,
      customerName: interaction.customer?.name || '',
      channel: interaction.channel,
      summary: interaction.summary,
      notes: interaction.notes || '',
      createdAt: interaction.createdAt.toISOString().replace('T', ' ').split('.')[0],
      userId: interaction.userId,
      userName: interaction.user?.name || ''
    }));

    const header = '\uFEFF' + csvStringifier.getHeaderString();
    const csvData = header + csvStringifier.stringifyRecords(records);
    
    return Readable.from(csvData);
  }

  private async logExportAudit(entityType: string, recordCount: number, userId: string): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: 'export',
        // entityType field doesn't exist in AuditLog model
        entityId: `export_${Date.now()}`,
        changes: {
          recordCount,
          format: 'csv',
          summary: `匯出 ${recordCount} 筆 ${entityType} 資料`
        },
        userId,
        userIp: '', // Will be set by controller
        userRole: 'STAFF',
        requestId: `export_${Date.now()}`,
        entity: entityType,
        status: 'SUCCESS',
        latencyMs: 0
      }
    });
  }
}
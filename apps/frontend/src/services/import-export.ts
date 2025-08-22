import { apiClient } from './api';

export interface FieldMapping {
  targetField: string;
  sourceField: string;
  required: boolean;
}

export interface ImportPreviewResult {
  previewId: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  errors: ImportValidationError[];
  sampleValidData: any[];
  sampleInvalidData: any[];
  detectedColumns: string[];
  suggestedMappings: FieldMapping[];
}

export interface ImportValidationError {
  row: number;
  field: string;
  value: any;
  error: string;
}

export interface ImportCommitResult {
  success: boolean;
  fileName: string;
  totalRows: number;
  successfulRows: number;
  ignoredRows: number;
  errorRows: number;
  errors: ImportValidationError[];
  duplicatesHandled: number;
  duration: number;
}

export interface ExportQuery {
  format?: 'csv';
  // Customer filters
  source?: string;
  city?: string;
  hasOrders?: boolean;
  hasInteractions?: boolean;
  // Order filters
  paymentStatus?: string;
  orderStatus?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  // Interaction filters
  channel?: string;
  userId?: string;
}

export const importExportService = {
  // Import Preview
  async previewCustomersImport(file: File): Promise<ImportPreviewResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/api/v1/import/customers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  async previewOrdersImport(file: File): Promise<ImportPreviewResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/api/v1/import/orders', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Import Commit
  async commitImport(previewId: string, upsert: boolean = false): Promise<ImportCommitResult> {
    const response = await apiClient.post('/api/v1/import/commit', {
      previewId,
      upsert
    });
    
    return response.data;
  },

  // Export
  async exportCustomers(query: ExportQuery = {}): Promise<void> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get('/api/v1/export/customers', {
      params,
      responseType: 'blob'
    });

    this.downloadFile(response.data, `customers_${new Date().toISOString().slice(0, 10)}.csv`);
  },

  async exportOrders(query: ExportQuery = {}): Promise<void> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get('/api/v1/export/orders', {
      params,
      responseType: 'blob'
    });

    this.downloadFile(response.data, `orders_${new Date().toISOString().slice(0, 10)}.csv`);
  },

  async exportInteractions(query: ExportQuery = {}): Promise<void> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get('/api/v1/export/interactions', {
      params,
      responseType: 'blob'
    });

    this.downloadFile(response.data, `interactions_${new Date().toISOString().slice(0, 10)}.csv`);
  },

  // Helper method to trigger file download
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Generate error report CSV
  generateErrorReportCSV(errors: ImportValidationError[], fileName: string): void {
    const csvContent = this.convertErrorsToCsv(errors);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, `errors_${fileName}_${Date.now()}.csv`);
  },

  convertErrorsToCsv(errors: ImportValidationError[]): string {
    const headers = ['行號', '欄位', '值', '錯誤原因'];
    const rows = errors.map(error => [
      error.row.toString(),
      error.field,
      error.value?.toString() || '',
      error.error
    ]);
    
    const csvRows = [headers, ...rows];
    return csvRows.map(row => 
      row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }
};
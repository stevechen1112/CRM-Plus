import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { importExportService, ImportCommitResult, ExportQuery } from '@/services/import-export';

// Import hooks
export const useCustomerImportPreview = () => {
  return useMutation({
    mutationFn: (file: File) => importExportService.previewCustomersImport(file),
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '檔案預覽失敗');
    },
  });
};

export const useOrderImportPreview = () => {
  return useMutation({
    mutationFn: (file: File) => importExportService.previewOrdersImport(file),
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '檔案預覽失敗');
    },
  });
};

export const useImportCommit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ previewId, upsert }: { previewId: string; upsert: boolean }) =>
      importExportService.commitImport(previewId, upsert),
    onSuccess: (result: ImportCommitResult) => {
      if (result.success) {
        toast.success(
          `匯入成功！成功 ${result.successfulRows} 筆，忽略 ${result.ignoredRows} 筆${
            result.duplicatesHandled > 0 ? `，更新 ${result.duplicatesHandled} 筆重複資料` : ''
          }`
        );
      } else {
        toast.error(`匯入完成但有錯誤：成功 ${result.successfulRows} 筆，失敗 ${result.errorRows} 筆`);
      }
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '匯入失敗');
    },
  });
};

// Export hooks
export const useCustomerExport = () => {
  return useMutation({
    mutationFn: (query: ExportQuery) => importExportService.exportCustomers(query),
    onSuccess: () => {
      toast.success('客戶資料匯出成功');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '匯出失敗');
    },
  });
};

export const useOrderExport = () => {
  return useMutation({
    mutationFn: (query: ExportQuery) => importExportService.exportOrders(query),
    onSuccess: () => {
      toast.success('訂單資料匯出成功');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '匯出失敗');
    },
  });
};

export const useInteractionExport = () => {
  return useMutation({
    mutationFn: (query: ExportQuery) => importExportService.exportInteractions(query),
    onSuccess: () => {
      toast.success('交流紀錄匯出成功');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '匯出失敗');
    },
  });
};

// Utility hook for generating error reports
export const useErrorReportDownload = () => {
  return (errors: any[], fileName: string) => {
    try {
      importExportService.generateErrorReportCSV(errors, fileName);
      toast.success('錯誤報告已下載');
    } catch (error) {
      toast.error('錯誤報告產生失敗');
    }
  };
};
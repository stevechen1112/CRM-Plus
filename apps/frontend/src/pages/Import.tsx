import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  Download,
  RefreshCw,
  Settings
} from 'lucide-react';
import { 
  useCustomerImportPreview, 
  useOrderImportPreview, 
  useImportCommit,
  useErrorReportDownload 
} from '@/hooks/useImportExport';
import type { ImportPreviewResult, FieldMapping } from '@/services/import-export';

type DataType = 'customers' | 'orders';
type Step = 1 | 2 | 3 | 4;

const Import: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [dataType, setDataType] = useState<DataType>('customers');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [upsertMode, setUpsertMode] = useState(false);
  const [commitResult, setCommitResult] = useState<any>(null);

  const customerPreviewMutation = useCustomerImportPreview();
  const orderPreviewMutation = useOrderImportPreview();
  const commitMutation = useImportCommit();
  const downloadErrorReport = useErrorReportDownload();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024 // 20MB
  });

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      const result = dataType === 'customers' 
        ? await customerPreviewMutation.mutateAsync(selectedFile)
        : await orderPreviewMutation.mutateAsync(selectedFile);
      
      setPreviewResult(result);
      setFieldMappings(result.suggestedMappings);
      setCurrentStep(2);
    } catch (error) {
      // Error already handled by the mutation
    }
  };

  const handleFieldMappingChange = (index: number, sourceField: string) => {
    const updatedMappings = [...fieldMappings];
    updatedMappings[index].sourceField = sourceField;
    setFieldMappings(updatedMappings);
  };

  const handlePreview = () => {
    // In a real implementation, you might want to re-validate with new mappings
    setCurrentStep(3);
  };

  const handleCommit = async () => {
    if (!previewResult) return;

    try {
      const result = await commitMutation.mutateAsync({
        previewId: previewResult.previewId,
        upsert: upsertMode
      });
      setCommitResult(result);
      setCurrentStep(4);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setPreviewResult(null);
    setFieldMappings([]);
    setCommitResult(null);
    setUpsertMode(false);
  };

  const getStepperClass = (step: Step) => {
    if (step < currentStep) return 'bg-success-500 text-white';
    if (step === currentStep) return 'bg-primary-500 text-white';
    return 'bg-gray-300 text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">資料匯入</h1>
        <p className="text-gray-600">支援 CSV 和 Excel 檔案格式</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow">
        {([1, 2, 3, 4] as const).map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getStepperClass(step)}`}
              >
                {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">
                {step === 1 && '上傳檔案'}
                {step === 2 && '欄位對應'}
                {step === 3 && '預檢結果'}
                {step === 4 && '完成匯入'}
              </span>
            </div>
            {index < 3 && (
              <ArrowRight className="w-5 h-5 text-gray-400" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Data Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇資料類型
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="customers"
                    checked={dataType === 'customers'}
                    onChange={(e) => setDataType(e.target.value as DataType)}
                    className="form-radio text-primary-600"
                  />
                  <span className="ml-2">客戶資料</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="orders"
                    checked={dataType === 'orders'}
                    onChange={(e) => setDataType(e.target.value as DataType)}
                    className="form-radio text-primary-600"
                  />
                  <span className="ml-2">訂單資料</span>
                </label>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                上傳檔案
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600">
                      拖拉檔案到此處，或點擊選擇檔案
                    </p>
                    <p className="text-xs text-gray-500">
                      支援 CSV, XLS, XLSX 格式，檔案大小限制 20MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleFileUpload}
                disabled={!selectedFile || customerPreviewMutation.isLoading || orderPreviewMutation.isLoading}
                className="btn btn-primary"
              >
                {(customerPreviewMutation.isLoading || orderPreviewMutation.isLoading) ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    解析中...
                  </>
                ) : (
                  '下一步'
                )}
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && previewResult && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">檔案資訊</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>檔案名稱: {previewResult.fileName}</div>
                <div>總行數: {previewResult.totalRows}</div>
                <div>偵測到的欄位: {previewResult.detectedColumns.length} 個</div>
              </div>
            </div>

            {/* Field Mappings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                欄位對應設定
              </h3>
              <div className="space-y-4">
                {fieldMappings.map((mapping, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 items-center p-4 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        目標欄位 {mapping.required && <span className="text-red-500">*</span>}
                      </label>
                      <div className="text-sm text-gray-900">{mapping.targetField}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">來源欄位</label>
                      <select
                        value={mapping.sourceField}
                        onChange={(e) => handleFieldMappingChange(index, e.target.value)}
                        className="form-select w-full"
                      >
                        <option value="">-- 選擇欄位 --</option>
                        {previewResult.detectedColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-xs text-gray-500">
                      {mapping.required ? '必填欄位' : '選填欄位'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="btn btn-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                上一步
              </button>
              <button
                onClick={handlePreview}
                className="btn btn-primary"
              >
                預檢資料
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && previewResult && (
          <div className="space-y-6">
            {/* Preview Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-success-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-success-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-success-900">{previewResult.validRows}</div>
                    <div className="text-sm text-success-700">可匯入</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-warning-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-8 h-8 text-warning-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-warning-900">{previewResult.duplicateRows}</div>
                    <div className="text-sm text-warning-700">重複資料</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-error-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-8 h-8 text-error-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-error-900">{previewResult.invalidRows}</div>
                    <div className="text-sm text-error-700">錯誤資料</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={upsertMode}
                  onChange={(e) => setUpsertMode(e.target.checked)}
                  className="form-checkbox text-primary-600"
                />
                <span className="ml-2 text-sm text-gray-700">
                  更新重複資料 (upsert mode) - 如果資料已存在，則更新而非忽略
                </span>
              </label>
            </div>

            {/* Errors */}
            {previewResult.errors.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">錯誤列表</h3>
                  <button
                    onClick={() => downloadErrorReport(previewResult.errors, previewResult.fileName)}
                    className="btn btn-sm btn-secondary"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下載錯誤報告
                  </button>
                </div>
                <div className="bg-white border rounded-lg max-h-60 overflow-y-auto">
                  <div className="divide-y divide-gray-200">
                    {previewResult.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="p-4">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            第 {error.row} 行 - {error.field}
                          </span>
                          <span className="text-xs text-gray-500">{error.value}</span>
                        </div>
                        <p className="text-sm text-error-600 mt-1">{error.error}</p>
                      </div>
                    ))}
                    {previewResult.errors.length > 10 && (
                      <div className="p-4 text-center text-sm text-gray-500">
                        還有 {previewResult.errors.length - 10} 個錯誤...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="btn btn-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                上一步
              </button>
              <button
                onClick={handleCommit}
                disabled={commitMutation.isLoading}
                className="btn btn-primary"
              >
                {commitMutation.isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    匯入中...
                  </>
                ) : (
                  '確認匯入'
                )}
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && commitResult && (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-success-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">匯入完成！</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>檔案: {commitResult.fileName}</p>
                <p>總計: {commitResult.totalRows} 筆</p>
                <p>成功: {commitResult.successfulRows} 筆</p>
                <p>忽略: {commitResult.ignoredRows} 筆</p>
                {commitResult.errorRows > 0 && (
                  <p className="text-error-600">失敗: {commitResult.errorRows} 筆</p>
                )}
                {commitResult.duplicatesHandled > 0 && (
                  <p>更新重複資料: {commitResult.duplicatesHandled} 筆</p>
                )}
                <p>處理時間: {(commitResult.duration / 1000).toFixed(2)} 秒</p>
              </div>
            </div>

            {commitResult.errors?.length > 0 && (
              <button
                onClick={() => downloadErrorReport(commitResult.errors, commitResult.fileName)}
                className="btn btn-secondary"
              >
                <Download className="w-4 h-4 mr-2" />
                下載錯誤報告
              </button>
            )}

            <button
              onClick={handleReset}
              className="btn btn-primary"
            >
              再次匯入
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Import;
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Users, 
  Calendar,
  Plus,
  Trash2,
  FileText,
  Download,
} from 'lucide-react';
import { useCustomerInteractions, useCreateInteraction, useDeleteInteraction } from '@/hooks/useInteractions';
import { useInteractionExport } from '@/hooks/useImportExport';
import type { Interaction } from '@crm/shared';

// Channel icons mapping
const channelIcons = {
  PHONE: <Phone className="w-4 h-4" />,
  EMAIL: <Mail className="w-4 h-4" />,
  LINE: <MessageCircle className="w-4 h-4" />,
  FACEBOOK: <Users className="w-4 h-4" />,
  MEETING: <Calendar className="w-4 h-4" />,
  OTHER: <FileText className="w-4 h-4" />,
};

// Channel labels
const channelLabels = {
  PHONE: '電話',
  EMAIL: '電子郵件',
  LINE: 'LINE',
  FACEBOOK: 'Facebook',
  MEETING: '會議',
  OTHER: '其他',
};

// Form validation schema
const createInteractionSchema = z.object({
  channel: z.enum(['PHONE', 'EMAIL', 'LINE', 'FACEBOOK', 'MEETING', 'OTHER']),
  summary: z.string().min(1, '摘要為必填項').max(500, '摘要不能超過 500 字'),
  note: z.string().optional(),
});

type CreateInteractionFormData = z.infer<typeof createInteractionSchema>;

interface CustomerInteractionsProps {
  customerPhone: string;
}

export const CustomerInteractions: React.FC<CustomerInteractionsProps> = ({ 
  customerPhone 
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const { data: interactions, isLoading } = useCustomerInteractions(customerPhone);
  const createInteractionMutation = useCreateInteraction();
  const deleteInteractionMutation = useDeleteInteraction();
  const exportMutation = useInteractionExport();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInteractionFormData>({
    resolver: zodResolver(createInteractionSchema),
  });

  const onSubmit = async (data: CreateInteractionFormData) => {
    try {
      await createInteractionMutation.mutateAsync({
        customerPhone,
        ...data,
      });
      reset();
      setShowCreateForm(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('確定要刪除這筆交流紀錄嗎？')) {
      await deleteInteractionMutation.mutateAsync(id);
    }
  };

  const handleExport = () => {
    exportMutation.mutate({});
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="spinner w-6 h-6"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">交流紀錄</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleExport}
            disabled={exportMutation.isLoading}
            className="btn btn-secondary btn-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {exportMutation.isLoading ? '匯出中...' : '匯出'}
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增紀錄
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="card">
          <div className="card-header">
            <h4 className="text-md font-medium text-gray-900">新增交流紀錄</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    溝通管道 *
                  </label>
                  <select
                    {...register('channel')}
                    className="form-select"
                  >
                    <option value="">請選擇管道</option>
                    {Object.entries(channelLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {errors.channel && (
                    <p className="form-error">{errors.channel.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  摘要 *
                </label>
                <input
                  type="text"
                  {...register('summary')}
                  className="form-input"
                  placeholder="請輸入交流內容摘要"
                />
                {errors.summary && (
                  <p className="form-error">{errors.summary.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  詳細備註
                </label>
                <textarea
                  {...register('note')}
                  rows={3}
                  className="form-textarea"
                  placeholder="其他詳細說明..."
                />
                {errors.note && (
                  <p className="form-error">{errors.note.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    reset();
                  }}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? '新增中...' : '新增紀錄'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactions List */}
      <div className="space-y-4">
        {!interactions || interactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>尚無交流紀錄</p>
          </div>
        ) : (
          interactions.map((interaction: Interaction) => (
            <div key={interaction.id} className="card">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 bg-primary-100 text-primary-600 rounded-lg">
                          {channelIcons[interaction.channel as keyof typeof channelIcons]}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {channelLabels[interaction.channel as keyof typeof channelLabels]}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(interaction.createdAt), 'yyyy/MM/dd HH:mm')}
                      </span>
                      {(interaction as any).user && (
                        <span className="text-sm text-gray-500">
                          by {(interaction as any).user.name}
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-base font-medium text-gray-900 mb-1">
                      {interaction.summary}
                    </h4>
                    
                    {interaction.notes && (
                      <p className="text-sm text-gray-600 mb-2">
                        {interaction.notes}
                      </p>
                    )}
                    
                    {interaction.attachments && interaction.attachments.length > 0 && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <FileText className="w-4 h-4" />
                        <span>{interaction.attachments.length} 個附件</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleDelete(interaction.id)}
                      disabled={deleteInteractionMutation.isLoading}
                      className="p-2 text-gray-400 hover:text-error-600 transition-colors"
                      title="刪除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
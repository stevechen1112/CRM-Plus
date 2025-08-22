import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Calendar,
  User,
  CheckCircle,
  PlayCircle,
} from 'lucide-react';
import {
  useTasks,
  // useCreateTask,
  useCompleteTask,
  useDelayTask,
  useTaskStats,
  useTriggerAutomation,
} from '@/hooks/useTasks';
import type { TaskQueryParams } from '@/services/tasks';
import { usePermissions } from '@/hooks/usePermissions';

// Task type and priority labels
const taskTypeLabels = {
  FOLLOW_UP: '跟進',
  CARE_CALL: '關懷',
  REPURCHASE: '回購',
  BIRTHDAY: '生日',
  ANNIVERSARY: '周年',
  PAYMENT_REMINDER: '付款提醒',
  REFUND_PROCESS: '退款處理',
  OTHER: '其他',
};

const taskPriorityLabels = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '緊急',
};

const taskStatusLabels = {
  PENDING: '待處理',
  IN_PROGRESS: '進行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  OVERDUE: '已逾期',
};

// Form validation schema for delay task
const delayTaskSchema = z.object({
  newDueAt: z.string().min(1, '請選擇新的到期時間'),
  reason: z.string().optional(),
});

type DelayTaskFormData = z.infer<typeof delayTaskSchema>;

const Tasks: React.FC = () => {
  const [filters, setFilters] = useState<TaskQueryParams>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [delayingTask, setDelayingTask] = useState<string | null>(null);
  const { can } = usePermissions();

  const { data: tasksData, isLoading } = useTasks(filters);
  const { data: stats } = useTaskStats();
  // const createTaskMutation = useCreateTask();
  const completeTaskMutation = useCompleteTask();
  const delayTaskMutation = useDelayTask();
  const triggerAutomationMutation = useTriggerAutomation();

  const {
    register: registerDelay,
    handleSubmit: handleDelaySubmit,
    reset: resetDelay,
  } = useForm<DelayTaskFormData>({
    resolver: zodResolver(delayTaskSchema),
  });

  const handleCompleteTask = async (taskId: string) => {
    if (window.confirm('確定要完成這個任務嗎？')) {
      await completeTaskMutation.mutateAsync({ id: taskId });
    }
  };

  const handleDelayTask = async (data: DelayTaskFormData) => {
    if (delayingTask) {
      await delayTaskMutation.mutateAsync({
        id: delayingTask,
        newDueAt: data.newDueAt,
        reason: data.reason,
      });
      setDelayingTask(null);
      resetDelay();
    }
  };

  const handleTriggerAutomation = async () => {
    if (window.confirm('確定要手動觸發自動化規則嗎？這會檢查並建立符合條件的任務。')) {
      await triggerAutomationMutation.mutateAsync();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-error-600 bg-error-100';
      case 'HIGH':
        return 'text-warning-600 bg-warning-100';
      case 'MEDIUM':
        return 'text-primary-600 bg-primary-100';
      case 'LOW':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-success-600 bg-success-100';
      case 'IN_PROGRESS':
        return 'text-primary-600 bg-primary-100';
      case 'OVERDUE':
        return 'text-error-600 bg-error-100';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-warning-600 bg-warning-100';
    }
  };

  const isOverdue = (dueAt: string, status: string) => {
    return new Date(dueAt) < new Date() && !['COMPLETED', 'CANCELLED'].includes(status);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">任務中心</h1>
          <p className="text-gray-600">管理客戶跟進任務和自動化流程</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleTriggerAutomation}
            disabled={triggerAutomationMutation.isLoading}
            className="btn btn-secondary"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            {triggerAutomationMutation.isLoading ? '觸發中...' : '觸發自動化'}
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增任務
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">總任務數</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-2 bg-error-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-error-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">已逾期</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <Clock className="w-6 h-6 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">即將到期</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.dueSoon}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-2 bg-success-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">已完成</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.byStatus.COMPLETED || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                狀態
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: (e.target.value as any) || undefined })}
                className="form-select"
              >
                <option value="">所有狀態</option>
                {Object.entries(taskStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                優先級
              </label>
              <select
                value={filters.priority || ''}
                onChange={(e) => setFilters({ ...filters, priority: (e.target.value as any) || undefined })}
                className="form-select"
              >
                <option value="">所有優先級</option>
                {Object.entries(taskPriorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                類型
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => setFilters({ ...filters, type: (e.target.value as any) || undefined })}
                className="form-select"
              >
                <option value="">所有類型</option>
                {Object.entries(taskTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                搜尋
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
                  placeholder="搜尋任務標題或描述..."
                  className="pl-10 form-input"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900">任務列表</h2>
        </div>
        <div className="card-body p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="spinner w-6 h-6"></div>
            </div>
          ) : !tasksData?.data || tasksData.data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>暫無任務</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tasksData.data.map((task) => (
                <div key={task?.id || Math.random()} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {task?.title || '未知任務'}
                        </h3>
                        <span className={`badge ${getPriorityColor(task?.priority || 'LOW')}`}>
                          {taskPriorityLabels[(task?.priority || 'LOW') as keyof typeof taskPriorityLabels]}
                        </span>
                        <span className={`badge ${getStatusColor(task?.status || 'PENDING')}`}>
                          {taskStatusLabels[(task?.status || 'PENDING') as keyof typeof taskStatusLabels]}
                        </span>
                        <span className="badge badge-gray">
                          {taskTypeLabels[(task.type || "GENERAL") as keyof typeof taskTypeLabels]}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>客戶：{(task as any).customer?.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span
                            className={
                              isOverdue(typeof (task.dueAt || task.createdAt) === 'string' ? (task.dueAt || task.createdAt) : (task.dueAt || task.createdAt).toISOString(), task.status)
                                ? 'text-error-600 font-medium'
                                : ''
                            }
                          >
                            到期：{format((task.dueAt || task.createdAt) instanceof Date ? (task.dueAt || task.createdAt) : new Date((task.dueAt || task.createdAt)), 'MM/dd HH:mm')}
                          </span>
                        </div>
                        {(task as any).assigneeUser && (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>負責人：{(task as any).assigneeUser.name}</span>
                          </div>
                        )}
                      </div>

                      {task?.description && (
                        <p className="text-sm text-gray-600 mt-2">{task?.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {['PENDING', 'IN_PROGRESS', 'OVERDUE'].includes(task?.status || 'PENDING') && (
                        <>
                          {can('tasks.complete') && (
                            <button
                              onClick={() => handleCompleteTask(task?.id || '')}
                              disabled={completeTaskMutation.isLoading}
                              className="btn btn-sm btn-success"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              完成
                            </button>
                          )}
                          {can('tasks.defer') && (
                            <button
                              onClick={() => setDelayingTask(task?.id || '')}
                              className="btn btn-sm btn-secondary"
                            >
                              <Clock className="w-4 h-4 mr-1" />
                              延後
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delay Task Modal */}
      {delayingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">延後任務</h3>
            <form onSubmit={handleDelaySubmit(handleDelayTask)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新的到期時間 *
                </label>
                <input
                  type="datetime-local"
                  {...registerDelay('newDueAt')}
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  延後原因
                </label>
                <textarea
                  {...registerDelay('reason')}
                  rows={3}
                  className="form-textarea"
                  placeholder="請說明延後的原因（可選）"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setDelayingTask(null);
                    resetDelay();
                  }}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={delayTaskMutation.isLoading}
                  className="btn btn-primary"
                >
                  {delayTaskMutation.isLoading ? '延後中...' : '確認延後'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pagination */}
      {tasksData && tasksData.pagination?.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            顯示 {((tasksData.pagination?.page || 1) - 1) * (tasksData.pagination?.limit || 10) + 1} 到{' '}
            {Math.min(
              (tasksData.pagination?.page || 1) * (tasksData.pagination?.limit || 10),
              tasksData.pagination?.total || 0
            )}{' '}
            筆，共 {tasksData.pagination?.total || 0} 筆任務
          </p>
          <div className="flex space-x-2">
            <button
              disabled={!tasksData.pagination?.hasPrev}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
              className="btn btn-secondary btn-sm"
            >
              上一頁
            </button>
            <button
              disabled={!tasksData.pagination?.hasNext}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
              className="btn btn-secondary btn-sm"
            >
              下一頁
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
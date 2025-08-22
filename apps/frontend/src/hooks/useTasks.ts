import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  tasksService,
  type CreateTaskData,
  type UpdateTaskData,
  type TaskQueryParams,
} from '@/services/tasks';

// Get all tasks
export const useTasks = (params?: TaskQueryParams) => {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => tasksService.getTasks(params),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get current user's tasks
export const useMyTasks = (limit?: number) => {
  return useQuery({
    queryKey: ['myTasks', limit],
    queryFn: () => tasksService.getMyTasks(limit),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Get single task
export const useTask = (id: string) => {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksService.getTask(id),
    enabled: !!id,
  });
};

// Get task stats
export const useTaskStats = () => {
  return useQuery({
    queryKey: ['taskStats'],
    queryFn: () => tasksService.getTaskStats(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Create task mutation
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskData) => tasksService.createTask(data),
    onSuccess: () => {
      toast.success('任務建立成功');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
    },
    onError: () => {
      toast.error('建立任務失敗');
    },
  });
};

// Update task mutation
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskData }) =>
      tasksService.updateTask(id, data),
    onSuccess: (data) => {
      toast.success('任務更新成功');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
    },
    onError: () => {
      toast.error('更新任務失敗');
    },
  });
};

// Complete task mutation
export const useCompleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      tasksService.completeTask(id, notes),
    onSuccess: () => {
      toast.success('任務完成');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
    },
    onError: () => {
      toast.error('完成任務失敗');
    },
  });
};

// Delay task mutation
export const useDelayTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newDueAt, reason }: { id: string; newDueAt: string; reason?: string }) =>
      tasksService.delayTask(id, newDueAt, reason),
    onSuccess: () => {
      toast.success('任務延後成功');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
    },
    onError: () => {
      toast.error('延後任務失敗');
    },
  });
};

// Delete task mutation
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksService.deleteTask(id),
    onSuccess: () => {
      toast.success('任務刪除成功');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
    },
    onError: () => {
      toast.error('刪除任務失敗');
    },
  });
};

// Trigger automation
export const useTriggerAutomation = () => {
  return useMutation({
    mutationFn: () => tasksService.triggerAutomation(),
    onSuccess: () => {
      toast.success('自動化規則已觸發');
    },
    onError: () => {
      toast.error('觸發自動化失敗');
    },
  });
};
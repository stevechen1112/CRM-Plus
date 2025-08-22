import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  interactionsService,
  type CreateInteractionData,
  type UpdateInteractionData,
  type InteractionQueryParams,
} from '@/services/interactions';

// Get all interactions
export const useInteractions = (params?: InteractionQueryParams) => {
  return useQuery({
    queryKey: ['interactions', params],
    queryFn: () => interactionsService.getInteractions(params),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get single interaction
export const useInteraction = (id: string) => {
  return useQuery({
    queryKey: ['interaction', id],
    queryFn: () => interactionsService.getInteraction(id),
    enabled: !!id,
  });
};

// Get customer interactions
export const useCustomerInteractions = (customerPhone: string, limit?: number) => {
  return useQuery({
    queryKey: ['customerInteractions', customerPhone, limit],
    queryFn: () => interactionsService.getCustomerInteractions(customerPhone, limit),
    enabled: !!customerPhone,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Create interaction mutation
export const useCreateInteraction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInteractionData) => interactionsService.createInteraction(data),
    onSuccess: (data) => {
      toast.success('交流紀錄新增成功');
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['customerInteractions', data.customerPhone] });
    },
    onError: () => {
      toast.error('新增交流紀錄失敗');
    },
  });
};

// Update interaction mutation
export const useUpdateInteraction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInteractionData }) =>
      interactionsService.updateInteraction(id, data),
    onSuccess: (data) => {
      toast.success('交流紀錄更新成功');
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['interaction', data.id] });
      queryClient.invalidateQueries({ queryKey: ['customerInteractions', data.customerPhone] });
    },
    onError: () => {
      toast.error('更新交流紀錄失敗');
    },
  });
};

// Delete interaction mutation
export const useDeleteInteraction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => interactionsService.deleteInteraction(id),
    onSuccess: () => {
      toast.success('交流紀錄刪除成功');
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['customerInteractions'] });
    },
    onError: () => {
      toast.error('刪除交流紀錄失敗');
    },
  });
};

// Get interaction stats
export const useInteractionStats = () => {
  return useQuery({
    queryKey: ['interactionStats'],
    queryFn: () => interactionsService.getInteractionStats(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
import { useQuery } from '@tanstack/react-query';
import { statsService } from '@/services/statsService';
import type { DateRange } from '@/types/stats';

export const useCustomerStats = (dateRange?: DateRange) => {
  return useQuery({
    queryKey: ['customerStats', dateRange?.from, dateRange?.to],
    queryFn: () => statsService.getCustomerStats(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useOrderStats = (dateRange?: DateRange) => {
  return useQuery({
    queryKey: ['orderStats', dateRange?.from, dateRange?.to],
    queryFn: () => statsService.getOrderStats(dateRange),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useInteractionStats = (dateRange?: DateRange) => {
  return useQuery({
    queryKey: ['interactionStats', dateRange?.from, dateRange?.to],
    queryFn: () => statsService.getInteractionStats(dateRange),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useTaskStats = (dateRange?: DateRange) => {
  return useQuery({
    queryKey: ['taskStats', dateRange?.from, dateRange?.to],
    queryFn: () => statsService.getTaskStats(dateRange),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
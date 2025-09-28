import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { centersService, CreateCenterRequest, UpdateCenterRequest, CentersFilters, SearchCentersRequest, UpdateAvailabilityRequest } from '@/services/centers';
import { toast } from 'sonner';

// Query Keys
export const CENTERS_QUERY_KEYS = {
  all: ['centers'] as const,
  lists: () => [...CENTERS_QUERY_KEYS.all, 'list'] as const,
  list: (filters: CentersFilters) => [...CENTERS_QUERY_KEYS.lists(), filters] as const,
  details: () => [...CENTERS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CENTERS_QUERY_KEYS.details(), id] as const,
  search: () => [...CENTERS_QUERY_KEYS.all, 'search'] as const,
  searchByLocation: (params: SearchCentersRequest) => [...CENTERS_QUERY_KEYS.search(), params] as const,
};

// Hooks
export function useCenters(filters?: CentersFilters) {
  return useQuery({
    queryKey: CENTERS_QUERY_KEYS.list(filters || {}),
    queryFn: () => centersService.getCenters(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCenter(id: string) {
  return useQuery({
    queryKey: CENTERS_QUERY_KEYS.detail(id),
    queryFn: () => centersService.getCenter(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSearchCentersByLocation(searchParams: SearchCentersRequest) {
  return useQuery({
    queryKey: CENTERS_QUERY_KEYS.searchByLocation(searchParams),
    queryFn: () => centersService.searchCentersByLocation(searchParams),
    enabled: !!(searchParams.city || searchParams.hotDesks || searchParams.dedicatedDesks || searchParams.privateCabins || searchParams.meetingRooms),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (centerData: CreateCenterRequest) => centersService.createCenter(centerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CENTERS_QUERY_KEYS.lists() });
      toast.success('Center created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create center');
    },
  });
}

export function useUpdateCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCenterRequest }) =>
      centersService.updateCenter(id, data),
    onSuccess: (updatedCenter) => {
      queryClient.invalidateQueries({ queryKey: CENTERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CENTERS_QUERY_KEYS.detail(updatedCenter._id) });
      toast.success('Center updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update center');
    },
  });
}

export function useDeleteCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => centersService.deleteCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CENTERS_QUERY_KEYS.lists() });
      toast.success('Center deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete center');
    },
  });
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAvailabilityRequest }) =>
      centersService.updateAvailability(id, data),
    onSuccess: (updatedCenter) => {
      queryClient.invalidateQueries({ queryKey: CENTERS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CENTERS_QUERY_KEYS.detail(updatedCenter._id) });
      toast.success('Center availability updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update availability');
    },
  });
}
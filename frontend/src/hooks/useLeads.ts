import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsService, Lead, CreateLeadRequest, UpdateLeadRequest, LeadsFilters, AddNoteRequest } from '@/services/leads';
import { toast } from 'sonner';

// Query Keys
export const LEADS_QUERY_KEYS = {
  all: ['leads'] as const,
  lists: () => [...LEADS_QUERY_KEYS.all, 'list'] as const,
  list: (filters: LeadsFilters) => [...LEADS_QUERY_KEYS.lists(), filters] as const,
  details: () => [...LEADS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...LEADS_QUERY_KEYS.details(), id] as const,
  stats: () => [...LEADS_QUERY_KEYS.all, 'stats'] as const,
};

// Hooks
export function useLeads(filters?: LeadsFilters) {
  return useQuery({
    queryKey: LEADS_QUERY_KEYS.list(filters || {}),
    queryFn: () => leadsService.getLeads(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: LEADS_QUERY_KEYS.detail(id),
    queryFn: () => leadsService.getLead(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLeadStats() {
  return useQuery({
    queryKey: LEADS_QUERY_KEYS.stats(),
    queryFn: () => leadsService.getLeadStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leadData: CreateLeadRequest) => leadsService.createLead(leadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEYS.stats() });
      toast.success('Lead created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create lead');
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadRequest }) => 
      leadsService.updateLead(id, data),
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEYS.detail(updatedLead._id) });
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEYS.stats() });
      toast.success('Lead updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update lead');
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => leadsService.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEYS.stats() });
      toast.success('Lead deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete lead');
    },
  });
}

export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddNoteRequest }) => 
      leadsService.addNote(id, data),
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEYS.detail(updatedLead._id) });
      toast.success('Note added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add note');
    },
  });
}
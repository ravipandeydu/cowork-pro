import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  proposalsService,
  CreateProposalRequest,
  UpdateProposalRequest,
  ProposalsFilters,
  SendProposalRequest
} from '@/services/proposals';

// Query Keys
export const proposalKeys = {
  all: ['proposals'] as const,
  lists: () => [...proposalKeys.all, 'list'] as const,
  list: (filters?: ProposalsFilters) => [...proposalKeys.lists(), filters] as const,
  details: () => [...proposalKeys.all, 'detail'] as const,
  detail: (id: string) => [...proposalKeys.details(), id] as const,
  stats: () => [...proposalKeys.all, 'stats'] as const,
};

// Hooks
export const useProposals = (filters?: ProposalsFilters) => {
  return useQuery({
    queryKey: proposalKeys.list(filters),
    queryFn: () => proposalsService.getProposals(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProposal = (id: string) => {
  return useQuery({
    queryKey: proposalKeys.detail(id),
    queryFn: () => proposalsService.getProposal(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProposalStats = () => {
  return useQuery({
    queryKey: proposalKeys.stats(),
    queryFn: () => proposalsService.getProposalStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutations
export const useCreateProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (proposalData: CreateProposalRequest) =>
      proposalsService.createProposal(proposalData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: proposalKeys.stats() });
      toast.success('Proposal created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create proposal');
    },
  });
};

export const useUpdateProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProposalRequest }) =>
      proposalsService.updateProposal(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: proposalKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: proposalKeys.stats() });
      toast.success('Proposal updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update proposal');
    },
  });
};

export const useDeleteProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => proposalsService.deleteProposal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: proposalKeys.stats() });
      toast.success('Proposal deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete proposal');
    },
  });
};

export const useSendProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: SendProposalRequest }) =>
      proposalsService.sendProposal(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: proposalKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: proposalKeys.stats() });
      toast.success('Proposal sent successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send proposal');
    },
  });
};

export const useGenerateProposalPDF = () => {
  return useMutation({
    mutationFn: (id: string) => proposalsService.generatePDF(id),
    onSuccess: (blob, id) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proposal-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF generated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate PDF');
    },
  });
};
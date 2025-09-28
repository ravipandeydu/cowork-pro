import { apiClient, ApiResponse, ListResponse, handleApiError } from '@/lib/api';

// Proposal Types
export interface Proposal {
  _id: string;
  title: string;
  leadId: {
    _id: string;
    name: string;
    email: string;
    company: string;
    phone: string;
    businessType: string;
    businessSize: string;
    seatingRequirements: {
      hotDesks: number;
      dedicatedDesks: number;
      privateCabins: number;
      meetingRooms: number;
    };
  };
  centerId: {
    _id: string;
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    capacity: any;
    amenities: string[];
    pricing: any;
  };
  selectedSeating: {
    hotDesks: number;
    dedicatedDesks: number;
    privateCabins: number;
    meetingRooms: number;
  };
  pricing: {
    baseAmount: number;
    discountPercentage: number;
    discountAmount: number;
    taxPercentage: number;
    taxAmount: number;
    totalAmount: number;
    breakdown: {
      hotDesks: { quantity: number; rate: number; amount: number };
      dedicatedDesks: { quantity: number; rate: number; amount: number };
      privateCabins: { quantity: number; rate: number; amount: number };
      meetingRooms: { quantity: number; rate: number; amount: number };
    };
  };
  terms: {
    duration: string;
    startDate: string;
    endDate: string;
    paymentTerms: string;
    cancellationPolicy: string;
  };
  status: 'draft' | 'sent' | 'viewed' | 'under_review' | 'approved' | 'rejected' | 'expired';
  validUntil: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProposalRequest {
  leadId: string;
  centerId: string;
  title: string;
  selectedSeating: {
    hotDesks: number;
    dedicatedDesks: number;
    privateCabins: number;
    meetingRooms: number;
  };
  pricing: {
    baseAmount: number;
    discountPercentage?: number;
    taxPercentage?: number;
    breakdown: {
      hotDesks: { quantity: number; rate: number; amount: number };
      dedicatedDesks: { quantity: number; rate: number; amount: number };
      privateCabins: { quantity: number; rate: number; amount: number };
      meetingRooms: { quantity: number; rate: number; amount: number };
    };
  };
  terms: {
    duration: string;
    startDate: string;
    endDate: string;
    paymentTerms: string;
    cancellationPolicy: string;
  };
  validUntil: string;
  notes?: string;
}

export interface UpdateProposalRequest extends Partial<CreateProposalRequest> {
  status?: 'draft' | 'sent' | 'viewed' | 'under_review' | 'approved' | 'rejected' | 'expired';
}

export interface ProposalsFilters {
  status?: string;
  leadId?: string;
  centerId?: string;
}

export interface SendProposalRequest {
  emailSubject?: string;
  emailMessage?: string;
}

// Proposals Service
export class ProposalsService {
  async getProposals(filters?: ProposalsFilters): Promise<ListResponse<Proposal>> {
    try {
      const response = await apiClient.get<ListResponse<Proposal>>('/proposals', filters);
      return response;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getProposal(id: string): Promise<Proposal> {
    try {
      const response = await apiClient.get<ApiResponse<{ proposal: Proposal }>>(`/proposals/${id}`);
      return response.data!.proposal;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async createProposal(proposalData: CreateProposalRequest): Promise<Proposal> {
    try {
      const response = await apiClient.post<ApiResponse<{ proposal: Proposal }>>('/proposals', proposalData);
      return response.data!.proposal;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async updateProposal(id: string, proposalData: UpdateProposalRequest): Promise<Proposal> {
    try {
      const response = await apiClient.put<ApiResponse<{ proposal: Proposal }>>(`/proposals/${id}`, proposalData);
      return response.data!.proposal;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async deleteProposal(id: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse>(`/proposals/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async sendProposal(id: string, sendData?: SendProposalRequest): Promise<Proposal> {
    try {
      const response = await apiClient.post<ApiResponse<{ proposal: Proposal }>>(`/proposals/${id}/send`, sendData);
      return response.data!.proposal;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async generatePDF(id: string): Promise<Blob> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/proposals/${id}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      return await response.blob();
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getProposalStats(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse>('/proposals/stats');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const authStore = localStorage.getItem('auth-storage');
      if (authStore) {
        const parsed = JSON.parse(authStore);
        return parsed.state?.token || null;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return null;
  }
}

// Export singleton instance
export const proposalsService = new ProposalsService();
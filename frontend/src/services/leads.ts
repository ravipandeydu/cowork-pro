import { apiClient, ApiResponse, ListResponse, handleApiError } from '@/lib/api';

// Lead Types
export interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  businessType: string;
  businessSize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  budgetRange: {
    min: number;
    max: number;
  };
  timeline: string;
  source: 'website' | 'referral' | 'cold_call' | 'social_media' | 'other';
  status: 'new' | 'contacted' | 'proposal_sent' | 'follow_up' | 'converted' | 'lost';
  assignedTo: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  seatingRequirements: {
    hotDesks: number;
    dedicatedDesks: number;
    privateCabins: number;
    meetingRooms: number;
  };
  notes: Array<{
    content: string;
    addedBy: string;
    addedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  phone: string;
  company: string;
  businessType: string;
  businessSize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  budgetRange: {
    min: number;
    max: number;
  };
  timeline: string;
  source: 'website' | 'referral' | 'cold_call' | 'social_media' | 'other';
  seatingRequirements: {
    hotDesks: number;
    dedicatedDesks: number;
    privateCabins: number;
    meetingRooms: number;
  };
  assignedTo?: string;
}

export interface UpdateLeadRequest extends Partial<CreateLeadRequest> {
  status?: 'new' | 'contacted' | 'proposal_sent' | 'follow_up' | 'converted' | 'lost';
}

export interface LeadsFilters {
  status?: string;
  businessSize?: string;
  assignedTo?: string;
  search?: string;
}

export interface AddNoteRequest {
  content: string;
}

// Leads Service
export class LeadsService {
  async getLeads(filters?: LeadsFilters): Promise<ListResponse<Lead>> {
    try {
      const response = await apiClient.get<ListResponse<Lead>>('/leads', filters);
      return response;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getLead(id: string): Promise<Lead> {
    try {
      const response = await apiClient.get<ApiResponse<{ lead: Lead }>>(`/leads/${id}`);
      return response.data!.lead;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async createLead(leadData: CreateLeadRequest): Promise<Lead> {
    try {
      const response = await apiClient.post<ApiResponse<{ lead: Lead }>>('/leads', leadData);
      return response.data!.lead;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async updateLead(id: string, leadData: UpdateLeadRequest): Promise<Lead> {
    try {
      const response = await apiClient.put<ApiResponse<{ lead: Lead }>>(`/leads/${id}`, leadData);
      return response.data!.lead;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async deleteLead(id: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse>(`/leads/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async addNote(id: string, noteData: AddNoteRequest): Promise<Lead> {
    try {
      const response = await apiClient.post<ApiResponse<{ lead: Lead }>>(`/leads/${id}/notes`, noteData);
      return response.data!.lead;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getLeadStats(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse>('/leads/stats');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// Export singleton instance
export const leadsService = new LeadsService();
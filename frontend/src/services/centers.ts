import { apiClient, ApiResponse, ListResponse, handleApiError } from '@/lib/api';

// Center Types
export interface Center {
  _id: string;
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  capacity: {
    hotDesks: {
      total: number;
      available: number;
    };
    dedicatedDesks: {
      total: number;
      available: number;
    };
    privateCabins: {
      total: number;
      available: number;
    };
    meetingRooms: {
      total: number;
      available: number;
    };
    totalSeats: number;
    availableSeats: number;
  };
  amenities: string[];
  pricing: {
    hotDesk: {
      daily: number;
      monthly: number;
    };
    dedicatedDesk: {
      monthly: number;
    };
    privateCabin: {
      monthly: number;
    };
    meetingRoom: {
      hourly: number;
    };
  };
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCenterRequest {
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  location: {
    coordinates: [number, number];
  };
  capacity: {
    hotDesks: {
      total: number;
      available: number;
    };
    dedicatedDesks: {
      total: number;
      available: number;
    };
    privateCabins: {
      total: number;
      available: number;
    };
    meetingRooms: {
      total: number;
      available: number;
    };
  };
  amenities: string[];
  pricing: {
    hotDesk: {
      daily: number;
      monthly: number;
    };
    dedicatedDesk: {
      monthly: number;
    };
    privateCabin: {
      monthly: number;
    };
    meetingRoom: {
      hourly: number;
    };
  };
  images?: string[];
}

export interface UpdateCenterRequest extends Partial<CreateCenterRequest> {
  isActive?: boolean;
}

export interface CentersFilters {
  city?: string;
  isActive?: boolean;
  search?: string;
}

export interface SearchCentersRequest {
  city?: string;
  hotDesks?: number;
  dedicatedDesks?: number;
  privateCabins?: number;
  meetingRooms?: number;
}

export interface UpdateAvailabilityRequest {
  hotDesks?: number;
  dedicatedDesks?: number;
  privateCabins?: number;
  meetingRooms?: number;
}

// Centers Service
export class CentersService {
  async getCenters(filters?: CentersFilters): Promise<ListResponse<Center>> {
    try {
      const response = await apiClient.get<ListResponse<Center>>('/centers', filters);
      return response;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getCenter(id: string): Promise<Center> {
    try {
      const response = await apiClient.get<ApiResponse<{ center: Center }>>(`/centers/${id}`);
      return response.data!.center;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async createCenter(centerData: CreateCenterRequest): Promise<Center> {
    try {
      const response = await apiClient.post<ApiResponse<{ center: Center }>>('/centers', centerData);
      return response.data!.center;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async updateCenter(id: string, centerData: UpdateCenterRequest): Promise<Center> {
    try {
      const response = await apiClient.put<ApiResponse<{ center: Center }>>(`/centers/${id}`, centerData);
      return response.data!.center;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async deleteCenter(id: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse>(`/centers/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async updateAvailability(id: string, availabilityData: UpdateAvailabilityRequest): Promise<Center> {
    try {
      const response = await apiClient.put<ApiResponse<{ center: Center }>>(`/centers/${id}/availability`, availabilityData);
      return response.data!.center;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async searchCentersByLocation(searchParams: SearchCentersRequest): Promise<{ centers: Center[]; count: number }> {
    try {
      const response = await apiClient.get<ApiResponse<{ centers: Center[]; count: number }>>('/centers/search/by-location', searchParams);
      return response.data!;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// Export singleton instance
export const centersService = new CentersService();
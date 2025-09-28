import { apiClient, ApiResponse, handleApiError } from '@/lib/api';

// Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales_executive' | 'sales_manager';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'sales_executive' | 'sales_manager';
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Auth Service
export class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      return response.data!;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', userData);
      return response.data!;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, we should clear local storage
      console.error('Logout error:', error);
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
      return response.data!.user;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh');
      return response.data!;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
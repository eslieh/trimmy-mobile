import { apiClient } from './client';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from './types';

export const authApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async verifyEmail(otp: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      '/auth/verify-email',
      null,
      { params: { otp } },
    );
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};

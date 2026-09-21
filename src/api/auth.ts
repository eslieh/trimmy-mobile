import { apiClient } from './client';
import { mockDelay } from './mock/delay';
import { USE_MOCK_API } from '../config/env';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from './types';

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ResendOtpResponse {
  message: string;
}

// Remembered across calls within a session so a mock login/register followed
// by getMe() returns a consistent user, without needing a real backend.
let mockUser: User | null = null;

function mockAuthResponse(overrides: Partial<User>): AuthResponse {
  mockUser = {
    id: mockUser?.id ?? 'user_mock_1',
    email: overrides.email ?? mockUser?.email ?? null,
    first_name: overrides.first_name ?? mockUser?.first_name ?? null,
    last_name: overrides.last_name ?? mockUser?.last_name ?? null,
    phone: overrides.phone ?? mockUser?.phone ?? null,
    auth_type: 'email',
    verified: overrides.verified ?? mockUser?.verified ?? true,
    created_at: mockUser?.created_at ?? new Date().toISOString(),
  };

  return {
    user: mockUser,
    tokens: {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      token_type: 'bearer',
    },
  };
}

export const authApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    if (USE_MOCK_API) {
      return mockDelay(
        mockAuthResponse({
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone ?? null,
        }),
      );
    }
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    if (USE_MOCK_API) {
      return mockDelay(mockAuthResponse({ email: data.email }));
    }
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async verifyEmail(otp: string): Promise<AuthResponse> {
    if (USE_MOCK_API) {
      return mockDelay(mockAuthResponse({ verified: true }));
    }
    const response = await apiClient.post<AuthResponse>(
      '/auth/verify-email',
      null,
      { params: { otp } },
    );
    return response.data;
  },

  async getMe(): Promise<User> {
    if (USE_MOCK_API) {
      return mockDelay(mockUser ?? mockAuthResponse({}).user);
    }
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    if (USE_MOCK_API) {
      return mockDelay({ message: 'If an account exists, a reset code has been sent.' });
    }
    const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(otp: string, newPassword: string): Promise<ResetPasswordResponse> {
    if (USE_MOCK_API) {
      return mockDelay({ message: 'Password updated successfully' });
    }
    const response = await apiClient.post<ResetPasswordResponse>('/auth/reset-password', {
      otp,
      new_password: newPassword,
    });
    return response.data;
  },

  async resendOtp(email: string, purpose: 'verification' | 'password_reset'): Promise<ResendOtpResponse> {
    if (USE_MOCK_API) {
      return mockDelay({ message: 'If an account exists, a new code has been sent.' });
    }
    const response = await apiClient.post<ResendOtpResponse>('/auth/resend-otp', { email, purpose });
    return response.data;
  },
};

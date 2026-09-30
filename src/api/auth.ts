import { apiClient } from './client';
import { mockDelay } from './mock/delay';
import { USE_MOCK_API } from '../config/env';
import {
  AuthResponse,
  ChangePasswordResponse,
  LoginRequest,
  MessageResponse,
  MyBusiness,
  RegisterRequest,
  Tokens,
  UpdateMeRequest,
  User,
} from './types';

// See reference/api/auth.json for the contracts these implement.

// Remembered across calls within a session so a mock login/register followed
// by getMe() returns a consistent user, without needing a real backend.
let mockUser: User | null = null;

const MOCK_TOKENS: Tokens = {
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  token_type: 'bearer',
};

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

  return { user: mockUser, tokens: MOCK_TOKENS };
}

export type OtpPurpose = 'verification' | 'password_reset';

export const authApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    if (USE_MOCK_API) {
      return mockDelay(
        mockAuthResponse({
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone ?? null,
          verified: false,
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

  // Revokes the refresh token server-side. Needs the access token too
  // (apiClient attaches it), so call this before clearing local tokens.
  async logout(refreshToken: string): Promise<void> {
    if (USE_MOCK_API) {
      return mockDelay(undefined);
    }
    await apiClient.post('/auth/logout', { refresh_token: refreshToken });
  },

  async checkEmail(email: string): Promise<{ exists: boolean }> {
    if (USE_MOCK_API) {
      return mockDelay({ exists: mockUser?.email === email });
    }
    const response = await apiClient.post<{ exists: boolean }>('/auth/check-email', { email });
    return response.data;
  },

  async verifyEmail(email: string, otp: string): Promise<AuthResponse> {
    if (USE_MOCK_API) {
      return mockDelay(mockAuthResponse({ email, verified: true }));
    }
    const response = await apiClient.post<AuthResponse>('/auth/verify-email', { email, otp });
    return response.data;
  },

  async getMe(): Promise<User> {
    if (USE_MOCK_API) {
      return mockDelay(mockUser ?? mockAuthResponse({}).user);
    }
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  async updateMe(data: UpdateMeRequest): Promise<User> {
    if (USE_MOCK_API) {
      return mockDelay(mockAuthResponse(data).user);
    }
    const response = await apiClient.patch<User>('/auth/me', data);
    return response.data;
  },

  async deleteMe(password: string): Promise<void> {
    if (USE_MOCK_API) {
      mockUser = null;
      return mockDelay(undefined);
    }
    await apiClient.delete('/auth/me', { data: { password } });
  },

  // Returns a fresh token pair — the server revokes the old refresh tokens.
  async changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
    if (USE_MOCK_API) {
      return mockDelay({ message: 'Password updated', tokens: MOCK_TOKENS });
    }
    const response = await apiClient.post<ChangePasswordResponse>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  async forgotPassword(email: string): Promise<MessageResponse> {
    if (USE_MOCK_API) {
      return mockDelay({ message: 'If an account exists, a reset code has been sent.' });
    }
    const response = await apiClient.post<MessageResponse>('/auth/forgot-password', { email });
    return response.data;
  },

  async verifyResetOtp(email: string, otp: string): Promise<{ valid: boolean }> {
    if (USE_MOCK_API) {
      return mockDelay({ valid: true });
    }
    const response = await apiClient.post<{ valid: boolean }>('/auth/verify-reset-otp', { email, otp });
    return response.data;
  },

  async resetPassword(email: string, otp: string, newPassword: string): Promise<MessageResponse> {
    if (USE_MOCK_API) {
      return mockDelay({ message: 'Password updated successfully' });
    }
    const response = await apiClient.post<MessageResponse>('/auth/reset-password', {
      email,
      otp,
      new_password: newPassword,
    });
    return response.data;
  },

  // 429 too_many_requests (with retry_after_seconds) while the cooldown runs.
  async resendOtp(email: string, purpose: OtpPurpose): Promise<MessageResponse> {
    if (USE_MOCK_API) {
      return mockDelay({ message: 'If an account exists, a new code has been sent.' });
    }
    const response = await apiClient.post<MessageResponse>('/auth/resend-otp', { email, purpose });
    return response.data;
  },

  // Google sign-in, step 1: the Google URL to open. code_challenge is the
  // PKCE S256 challenge (see utils/googleSignIn.ts).
  async getGoogleAuthUrl(codeChallenge: string): Promise<{ url: string }> {
    const response = await apiClient.get<{ url: string }>('/auth/google/url', {
      params: { platform: 'mobile', code_challenge: codeChallenge },
    });
    return response.data;
  },

  // Google sign-in, step 2: trade the one-time redirect code (single-use,
  // expires after 2 minutes) for tokens. Same response as login.
  async googleExchange(code: string, codeVerifier: string): Promise<AuthResponse> {
    if (USE_MOCK_API) {
      return mockDelay(mockAuthResponse({ verified: true }));
    }
    const response = await apiClient.post<AuthResponse>('/auth/google/exchange', {
      code,
      code_verifier: codeVerifier,
    });
    return response.data;
  },

  // Businesses the user owns or works at — lets an owner get back into
  // business mode on a fresh install instead of relying on client memory.
  async listMyBusinesses(): Promise<MyBusiness[]> {
    if (USE_MOCK_API) {
      return mockDelay<MyBusiness[]>([]);
    }
    const response = await apiClient.get<{ businesses: MyBusiness[] }>('/me/businesses');
    return response.data.businesses;
  },
};

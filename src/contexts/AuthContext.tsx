import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { authApi } from '../api/auth';
import { AuthResponse, UpdateMeRequest, User } from '../api/types';
import { tokenStorage } from '../storage/tokenStorage';
import { signInWithGoogle as runGoogleSignIn } from '../utils/googleSignIn';
import { restoreOwnedBusiness } from '../utils/restoreOwnedBusiness';
import { useOwnedBusinessStore } from '../store/useOwnedBusinessStore';
import { useBusinessOnboardingStore } from '../store/useBusinessOnboardingStore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) => Promise<AuthResponse>;
  login: (data: { email: string; password: string }) => Promise<AuthResponse>;
  verifyEmail: (email: string, otp: string) => Promise<AuthResponse>;
  // null when the user cancelled — see utils/googleSignIn.ts.
  signInWithGoogle: () => Promise<AuthResponse | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: UpdateMeRequest) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Business state belongs to whoever is logged in — wipe it on the way out
// so the next person on this device doesn't inherit it.
function clearBusinessState() {
  useOwnedBusinessStore.getState().clear();
  useBusinessOnboardingStore.setState(useBusinessOnboardingStore.getInitialState(), true);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  // Business endpoints require a verified user, so wait for verification
  // (email OTP or Google). Best-effort: without it the user just starts in
  // customer mode, same as before this existed.
  const restoreForUserId = user?.verified ? user.id : null;
  useEffect(() => {
    if (restoreForUserId) restoreOwnedBusiness().catch(() => {});
  }, [restoreForUserId]);

  async function loadUser() {
    try {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        const u = await authApi.getMe();
        setUser(u);
      }
    } catch (err) {
      // A cold start offline (or with the server down) must not sign the
      // user out — only clear tokens when the server actually answered.
      const isNetworkError = axios.isAxiosError(err) && !err.response;
      if (!isNetworkError) await tokenStorage.clearTokens();
    } finally {
      setLoading(false);
    }
  }

  async function register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }): Promise<AuthResponse> {
    const response = await authApi.register(data);
    await tokenStorage.setTokens(
      response.tokens.access_token,
      response.tokens.refresh_token,
    );
    setUser(response.user);
    return response;
  }

  async function login(data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await authApi.login(data);
    await tokenStorage.setTokens(
      response.tokens.access_token,
      response.tokens.refresh_token,
    );
    setUser(response.user);
    return response;
  }

  async function verifyEmail(email: string, otp: string): Promise<AuthResponse> {
    const response = await authApi.verifyEmail(email, otp);
    await tokenStorage.setTokens(
      response.tokens.access_token,
      response.tokens.refresh_token,
    );
    setUser(response.user);
    return response;
  }

  async function signInWithGoogle(): Promise<AuthResponse | null> {
    const response = await runGoogleSignIn();
    if (!response) return null;
    await tokenStorage.setTokens(response.tokens.access_token, response.tokens.refresh_token);
    setUser(response.user);
    return response;
  }

  async function logout() {
    // Best-effort server revoke — the user is logged out locally either way
    // (e.g. offline, or the session had already expired).
    const refreshToken = await tokenStorage.getRefreshToken();
    if (refreshToken) {
      await authApi.logout(refreshToken).catch(() => {});
    }
    await tokenStorage.clearTokens();
    clearBusinessState();
    setUser(null);
  }

  async function updateProfile(data: UpdateMeRequest): Promise<User> {
    const u = await authApi.updateMe(data);
    setUser(u);
    return u;
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    const response = await authApi.changePassword(currentPassword, newPassword);
    await tokenStorage.setTokens(response.tokens.access_token, response.tokens.refresh_token);
  }

  async function deleteAccount(password: string) {
    await authApi.deleteMe(password);
    await tokenStorage.clearTokens();
    clearBusinessState();
    setUser(null);
  }

  async function refreshUser() {
    try {
      const u = await authApi.getMe();
      setUser(u);
    } catch {
      await tokenStorage.clearTokens();
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        verifyEmail,
        signInWithGoogle,
        logout,
        refreshUser,
        updateProfile,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

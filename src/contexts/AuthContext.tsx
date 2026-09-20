import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import { AuthResponse, User } from '../api/types';
import { tokenStorage } from '../storage/tokenStorage';

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
  verifyEmail: (otp: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        const u = await authApi.getMe();
        setUser(u);
      }
    } catch {
      await tokenStorage.clearTokens();
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

  async function verifyEmail(otp: string): Promise<AuthResponse> {
    const response = await authApi.verifyEmail(otp);
    await tokenStorage.setTokens(
      response.tokens.access_token,
      response.tokens.refresh_token,
    );
    setUser(response.user);
    return response;
  }

  async function logout() {
    await tokenStorage.clearTokens();
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
        logout,
        refreshUser,
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

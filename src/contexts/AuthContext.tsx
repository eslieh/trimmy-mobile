import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { authApi } from '../api/auth';
import { AuthResponse, UpdateMeRequest, User } from '../api/types';
import { tokenStorage } from '../storage/tokenStorage';
import { sessionStorage } from '../storage/sessionStorage';
import { signInWithGoogle as runGoogleSignIn } from '../utils/googleSignIn';
import { restoreOwnedBusiness } from '../utils/restoreOwnedBusiness';
import { useOwnedBusinessStore } from '../store/useOwnedBusinessStore';
import { useBusinessOnboardingStore } from '../store/useBusinessOnboardingStore';
import { useFrontDeskStore } from '../store/useFrontDeskStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { useNotificationsStore } from '../store/useNotificationsStore';
import { useToastStore } from '../store/useToastStore';
import { registerForPushNotifications, unregisterPushNotifications } from '../utils/pushNotifications';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  // Reopened from the on-device snapshot (mode and workplace already set),
  // rather than signed in just now.
  resumed: boolean;
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
  // After a change the server answered with (e.g. a new profile picture).
  replaceUser: (user: User) => void;
  updateProfile: (data: UpdateMeRequest) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Business state belongs to whoever is logged in — wipe it on the way out
// so the next person on this device doesn't inherit it.
function clearBusinessState() {
  sessionStorage.clear();
  useOwnedBusinessStore.getState().clear();
  useBusinessOnboardingStore.setState(useBusinessOnboardingStore.getInitialState(), true);
  useFrontDeskStore.getState().clear();
  useFavoritesStore.getState().clear();
  useNotificationsStore.getState().reset();
  useToastStore.getState().clear();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumed, setResumed] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  // Keep the on-device snapshot (who, which mode, which workplace) current,
  // so the next launch reopens right here. Writes are folded together.
  const signedInId = user?.id;
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const save = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const { activeMode, business, staffSession } = useOwnedBusinessStore.getState();
        sessionStorage.save({ user, mode: activeMode, business, staffSession });
      }, 300);
    };
    save();
    const unsubscribe = useOwnedBusinessStore.subscribe(save);
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
    // The user object changes on profile edits too; that's worth saving.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedInId, user]);

  // Business endpoints require a verified user, so wait for verification
  // (email OTP or Google). Best-effort: without it the user just starts in
  // customer mode, same as before this existed.
  const restoreForUserId = user?.verified ? user.id : null;
  useEffect(() => {
    if (!restoreForUserId) return;
    restoreOwnedBusiness().catch(() => {});
    useFavoritesStore.getState().load().catch(() => {});
    registerForPushNotifications();
  }, [restoreForUserId]);

  async function loadUser() {
    const [token, snapshot] = await Promise.all([tokenStorage.getAccessToken(), sessionStorage.load()]);
    if (token && snapshot) {
      // Reopen straight away from the device — instant, and works offline —
      // then confirm with the server in the background.
      useOwnedBusinessStore.setState({
        activeMode: snapshot.mode,
        business: snapshot.business,
        staffSession: snapshot.staffSession,
      });
      setUser(snapshot.user);
      setResumed(true);
      setLoading(false);
      try {
        setUser(await authApi.getMe());
      } catch (err) {
        await signOutIfRejected(err);
      }
      return;
    }
    try {
      if (token) setUser(await authApi.getMe());
    } catch (err) {
      await signOutIfRejected(err);
    } finally {
      setLoading(false);
    }
  }

  // A cold start offline (or with the server down) must not sign the user
  // out — only when the server actually answered (expired, deleted account).
  async function signOutIfRejected(err: unknown) {
    const isNetworkError = axios.isAxiosError(err) && !err.response;
    if (isNetworkError) return;
    await tokenStorage.clearTokens();
    clearBusinessState();
    setUser(null);
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
    // Stop pushes to this device for this account (needs the session).
    await unregisterPushNotifications();
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
    await unregisterPushNotifications();
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
        resumed,
        register,
        login,
        verifyEmail,
        signInWithGoogle,
        logout,
        refreshUser,
        replaceUser: setUser,
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

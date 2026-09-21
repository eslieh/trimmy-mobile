import Constants from 'expo-constants';

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'http://localhost:8001';

export const config = {
  apiBaseUrl: API_BASE_URL,
} as const;

// True until the backend actually implements these endpoints (see
// reference/api/*.json) — flip to false per-domain once they're live.
// Independent of apiBaseUrl, which is always configured (.env.development
// etc.) for the real, already-wired auth endpoints.
export const USE_MOCK_API = true;

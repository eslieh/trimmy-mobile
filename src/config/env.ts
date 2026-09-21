import Constants from 'expo-constants';

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'http://localhost:8001';

export const config = {
  apiBaseUrl: API_BASE_URL,
} as const;

// All backend endpoints are now live on staging.
// Set EXPO_PUBLIC_API_BASE_URL to your backend URL (defaults to localhost:8001).
export const USE_MOCK_API = false;

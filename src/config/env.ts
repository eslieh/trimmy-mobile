import Constants from 'expo-constants';

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'http://localhost:8001';

export const config = {
  apiBaseUrl: API_BASE_URL,
} as const;

// Reverted to mock mode: dev builds load .env.development, which points at
// localhost:8001, not staging — flipping this to false without also fixing
// that pointed every mock-backed screen (auth, business setup, Discovery) at
// an unreachable server. Discovery's search-businesses/get-business-profile
// especially are brand-new contracts unlikely to be live on staging yet.
// Flip back once .env.development is pointed at a real, verified backend
// that implements every endpoint in reference/api/*.json.
export const USE_MOCK_API = true;

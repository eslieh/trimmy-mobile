import Constants from 'expo-constants';

// Public API base URL. Never localhost — Expo loads .env.development for
// `expo start` (staging), .env.production for packaged builds (prod), and
// .env.staging when NODE_ENV=staging. Those files are committed; the
// fallback below is also staging so a missing env file still hits a
// reachable backend.
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'https://trimmy-staging.pesagrid.co.ke';

export const config = {
  apiBaseUrl: API_BASE_URL,
} as const;

// Live against the real backend for domains it fully implements:
// auth, business setup (incl. post-publish management), discovery, team.
// Booking and customer fulfillment stay on mock until Phase 3/4 ship
// (see USE_MOCK_BOOKING / USE_MOCK_FULFILLMENT below).
export const USE_MOCK_API = false;

// Phase 3 Booking API (booking.json) — not built on the server yet.
export const USE_MOCK_BOOKING = true;

// Phase 4/5 fulfillment (fulfillment.json: walk-in, scheduled, charge,
// status, customers) — not built on the server yet.
export const USE_MOCK_FULFILLMENT = true;

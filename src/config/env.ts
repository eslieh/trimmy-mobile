export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

// No base URL configured yet (no backend exists) — the app runs against the
// mock adapters in src/api instead of making real network calls.
export const USE_MOCK_API = API_BASE_URL.length === 0;

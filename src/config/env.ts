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

// Live against the real backend: auth, business setup (incl. post-publish
// management), discovery, team, booking, deposit payment, business-side
// bookings, checkout charge, customers and payouts. The flags below can
// switch individual domains back to mocks for offline work.
export const USE_MOCK_API = false;

// Phase 3 Booking API (booking.json): create, get and list bookings are live.
export const USE_MOCK_BOOKING = false;

// Deposit payment (M-Pesa STK, BK-31/32) — live: start the prompt, then
// poll the booking. Flip to true to simulate payment without M-Pesa.
export const USE_MOCK_BOOKING_PAYMENT = false;

// Phase 4 fulfillment bookings (fulfillment.json: list business bookings,
// walk-in, scheduled, status, assign staff) — live (BK-26, BK-63).
export const USE_MOCK_FULFILLMENT = false;

// Charging for the service at checkout (fulfillment.json#charge-booking) —
// live: POST /charge, then poll the booking like the deposit.
export const USE_MOCK_CHARGE = false;

// Business customer list (fulfillment.json#save-customer / list-customers)
// — live; the server fills it from bookings with a phone.
export const USE_MOCK_CUSTOMERS = false;

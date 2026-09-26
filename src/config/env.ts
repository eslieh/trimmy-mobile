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
// management), discovery, team, booking, deposit payment and business-side
// bookings. Charge-at-checkout and the customer list stay on mock until
// they ship (see USE_MOCK_CHARGE / USE_MOCK_CUSTOMERS below).
export const USE_MOCK_API = false;

// Phase 3 Booking API (booking.json): create, get and list bookings are live.
export const USE_MOCK_BOOKING = false;

// Deposit payment (M-Pesa STK, BK-31/32) — live: start the prompt, then
// poll the booking. Flip to true to simulate payment without M-Pesa.
export const USE_MOCK_BOOKING_PAYMENT = false;

// Phase 4 fulfillment bookings (fulfillment.json: list business bookings,
// walk-in, scheduled, status, assign staff) — live (BK-26, BK-63).
export const USE_MOCK_FULFILLMENT = false;

// Charging for the service at checkout (fulfillment.json#charge-booking).
// The server has no charge endpoint yet (its payments module only takes
// deposits), so this stays mocked. The app's live path — POST /charge,
// then poll the booking like the deposit — is already built: flip this to
// false once the backend ships charge-booking.
export const USE_MOCK_CHARGE = true;

// Business customer list (fulfillment.json#save-customer / list-customers)
// — not built on the server yet.
export const USE_MOCK_CUSTOMERS = true;

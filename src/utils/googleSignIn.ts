import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { authApi } from '../api/auth';
import type { AuthResponse } from '../api/types';

// Where the server sends the browser back after Google — matches app.json's
// `scheme`. See app/auth/google.tsx for the matching (no-op) route.
const REDIRECT_URL = 'trimmy://auth/google';

// ?error=<code> values from the server's Google callback. access_denied
// (user cancelled on Google's screen) is handled as a quiet cancel instead.
const REDIRECT_ERROR_MESSAGES: Record<string, string> = {
  email_not_verified: "Your Google account's email isn't verified. Verify it with Google, or sign up with email instead.",
  account_conflict: 'This email is already linked to a different Google account.',
  google_exchange_failed: "We couldn't reach Google. Please try again.",
};
const GENERIC_ERROR = 'Google sign-in failed. Please try again.';

export class GoogleSignInError extends Error {}

function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// PKCE: a random verifier kept in memory for the exchange, and its S256
// challenge (base64url(sha256(verifier)), always 43 chars) sent up front.
async function createPkcePair() {
  const verifier = toBase64Url(btoa(String.fromCharCode(...Crypto.getRandomBytes(32))));
  const challenge = toBase64Url(
    await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
      encoding: Crypto.CryptoEncoding.BASE64,
    }),
  );
  return { verifier, challenge };
}

// Resolves to null when the user backs out (closed the sheet or cancelled
// on Google's screen) — callers should return quietly, no error shown.
// Throws GoogleSignInError with a user-facing message otherwise; API errors
// (e.g. 503 google_not_configured, 400 invalid_code) are rethrown as-is for
// getApiErrorMessage.
export async function signInWithGoogle(): Promise<AuthResponse | null> {
  const { verifier, challenge } = await createPkcePair();
  const { url } = await authApi.getGoogleAuthUrl(challenge);

  const result = await WebBrowser.openAuthSessionAsync(url, REDIRECT_URL);
  if (result.type !== 'success') return null;

  const { queryParams } = Linking.parse(result.url);
  const error = typeof queryParams?.error === 'string' ? queryParams.error : null;
  const code = typeof queryParams?.code === 'string' ? queryParams.code : null;

  if (error === 'access_denied') return null;
  if (error || !code) throw new GoogleSignInError(REDIRECT_ERROR_MESSAGES[error ?? ''] ?? GENERIC_ERROR);

  // The code is single-use and expires in 2 minutes — exchange right away.
  return authApi.googleExchange(code, verifier);
}

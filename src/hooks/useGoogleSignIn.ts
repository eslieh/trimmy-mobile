import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../api/client';
import { GoogleSignInError } from '../utils/googleSignIn';
import { routeAfterLogin } from '../utils/routeAfterLogin';

// Shared "Continue with Google" handler for Welcome and Login. Google
// accounts are always verified, so success skips the OTP step and goes
// straight into the app (see utils/routeAfterLogin).
export function useGoogleSignIn() {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const start = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await signInWithGoogle();
      if (!response) return; // cancelled — no error shown
      // Into their app by role; a brand-new account (no workplace yet) gets
      // Get Started to enroll a business or browse.
      await routeAfterLogin(router, '/get-started');
    } catch (err) {
      setError(
        err instanceof GoogleSignInError
          ? err.message
          : getApiErrorMessage(err, 'Google sign-in failed. Please try again.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return { start, loading, error };
}

import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../api/client';
import { GoogleSignInError } from '../utils/googleSignIn';

// Shared "Continue with Google" handler for Welcome and Login. Google
// accounts are always verified, so success skips the OTP step and goes
// straight to Get Started (invites / enroll a business / browse).
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
      router.dismissAll();
      router.replace('/get-started');
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

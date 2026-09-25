import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// trimmy://auth/google?code=… is the Google sign-in redirect. The code is
// read by WebBrowser.openAuthSessionAsync (utils/googleSignIn.ts), but on
// Android the same link also reaches Expo Router as a deep link — this route
// just steps back out of it instead of showing an unmatched-route screen.
export default function GoogleAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  return null;
}

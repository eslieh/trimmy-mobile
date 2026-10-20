import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useOwnedBusinessStore } from '../store/useOwnedBusinessStore';
import { switchMode } from '../utils/switchMode';

// Keeps a reopened session honest once the server has had its say:
// - their workplace for the current mode is gone (removed from the team, the
//   business unpublished) → back to the customer app;
// - the server rejected the session (expired, account deleted) while they
//   were inside the app → to the sign-in screen.
// Renders nothing.
export function SessionGuard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const activeMode = useOwnedBusinessStore((s) => s.activeMode);
  const business = useOwnedBusinessStore((s) => s.business);
  const staffSession = useOwnedBusinessStore((s) => s.staffSession);

  useEffect(() => {
    if (loading || !user) return;
    const lost =
      (activeMode === 'business' && !business) ||
      ((activeMode === 'staff' || activeMode === 'front_desk') && !staffSession);
    if (lost) switchMode(router, 'customer');
  }, [loading, user, activeMode, business, staffSession, router]);

  const hadUser = useRef(false);
  useEffect(() => {
    if (loading) return;
    if (user) {
      hadUser.current = true;
    } else if (hadUser.current) {
      hadUser.current = false;
      if (router.canDismiss()) router.dismissAll();
      router.replace('/');
    }
  }, [loading, user, router]);

  return null;
}

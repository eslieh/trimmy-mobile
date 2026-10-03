import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useOwnedBusinessStore } from '../store/useOwnedBusinessStore';
import { routeForNotification } from '../utils/pushNotifications';
import { openAfterLoginRedirect } from '../utils/routeAfterLogin';

// Opens the right screen when a push is tapped (including the one that
// launched the app), switching to the matching app mode first so e.g. a
// staff member's "booking assigned" opens in the staff view. Renders nothing.
export function NotificationTapRouter() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const response = Notifications.useLastNotificationResponse();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !user || !response) return;
    const id = response.notification.request.identifier;
    if (handledRef.current === id) return;
    handledRef.current = id;

    const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;
    const route = routeForNotification(data);
    if (!route) return;

    const applyMode = () => {
      const store = useOwnedBusinessStore.getState();
      switch (data.type) {
        case 'booking_assigned':
        case 'payout_responded':
        case 'wallet_adjusted':
          if (store.staffSession) store.setActiveMode(store.staffSession.role === 'front_desk' ? 'front_desk' : 'staff');
          break;
        case 'day_summary_submitted':
          if (store.business) store.setActiveMode('business');
          break;
        default:
          store.setActiveMode('customer');
      }
    };
    openAfterLoginRedirect(route, applyMode, router);
  }, [loading, user, response, router]);

  return null;
}

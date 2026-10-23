import { useEffect, useRef } from 'react';
import type * as NotificationsModule from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { applyModeForNotification, routeForNotification } from '../utils/pushNotifications';
import { useNotificationsStore } from '../store/useNotificationsStore';
import { openAfterLoginRedirect } from '../utils/routeAfterLogin';
import { getNotifications } from '../utils/notificationsModule';

// Opens the right screen when a push is tapped (including the one that
// launched the app), switching to the matching app mode first so e.g. a
// staff member's "booking assigned" opens in the staff view. Renders nothing.
export function NotificationTapRouter() {
  // No push (off, or Expo Go): nothing to route. Decided once per run, so the hooks below stay stable.
  const Notifications = getNotifications();
  return Notifications ? <TapRouter Notifications={Notifications} /> : null;
}

function TapRouter({ Notifications }: { Notifications: typeof NotificationsModule }) {
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

    // The tapped push is also in the inbox; refresh so the bell catches up.
    useNotificationsStore.getState().refreshUnreadCount();
    openAfterLoginRedirect(route, () => applyModeForNotification(data.type), router);
  }, [loading, user, response, router]);

  return null;
}

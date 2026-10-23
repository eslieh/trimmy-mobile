import { useNotificationsStore } from '../store/useNotificationsStore';
import { useToastStore } from '../store/useToastStore';
import type { AppNotification } from '../types/notification';
import { emitRealtime } from './events';

// Everything that happens when a notification arrives while the app is open
// (live stream, or a simulated one in mock mode): into the inbox and the
// bell's count, a toast (the host adds the buzz), and a nudge to any screen
// showing data it changes. Repeats of one notificationId are ignored.
// Recently seen ids, kept separately from the inbox list (which may not be
// loaded yet) so a replayed event never counts twice. Capped to stay tiny.
const seen = new Set<string>();
const SEEN_LIMIT = 200;

export function receiveNotification(notification: AppNotification): void {
  if (seen.has(notification.notificationId)) return;
  seen.add(notification.notificationId);
  if (seen.size > SEEN_LIMIT) seen.delete(seen.values().next().value as string);
  if (!useNotificationsStore.getState().receive(notification)) return;
  useToastStore.getState().show(notification);
  emitRealtime(notification);
}

// The stream may have missed events: refetch the bell, and the list if it's
// been loaded, and let screens refresh.
export function resyncNotifications(): void {
  const store = useNotificationsStore.getState();
  store.refreshUnreadCount();
  if (store.notifications.length > 0) store.loadNotifications().catch(() => {});
  emitRealtime(null);
}

import { create } from 'zustand';
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications';
import type { AppNotification } from '../types/notification';

type NotificationsState = {
  notifications: AppNotification[];
  unreadCount: number;
  nextCursor: string | null;
  // Server → cache. Replaces the list with the newest page.
  loadNotifications: (unreadOnly?: boolean) => Promise<void>;
  // Appends the next (older) page; no-op on the last page.
  loadMoreNotifications: (unreadOnly?: boolean) => Promise<void>;
  // For the bell: just the count, without fetching the list.
  refreshUnreadCount: () => Promise<void>;
  // A notification that arrived live. Returns false if it was already here.
  receive: (notification: AppNotification) => boolean;
  markReadNow: (notificationId: string) => Promise<void>;
  markAllReadNow: () => Promise<void>;
  // On logout, so the next account doesn't see a stale badge.
  reset: () => void;
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  nextCursor: null,
  loadNotifications: async (unreadOnly = false) => {
    const page = await listNotifications({ unreadOnly });
    set({ notifications: page.notifications, unreadCount: page.unreadCount, nextCursor: page.nextCursor });
  },
  loadMoreNotifications: async (unreadOnly = false) => {
    const cursor = get().nextCursor;
    if (!cursor) return;
    const page = await listNotifications({ cursor, unreadOnly });
    set((state) => ({
      notifications: [...state.notifications, ...page.notifications],
      unreadCount: page.unreadCount,
      nextCursor: page.nextCursor,
    }));
  },
  refreshUnreadCount: async () => {
    try {
      const { unreadCount } = await getUnreadNotificationCount();
      set({ unreadCount });
    } catch {
      // The badge is a hint; a failed refresh keeps the last known count.
    }
  },
  receive: (notification) => {
    if (get().notifications.some((n) => n.notificationId === notification.notificationId)) return false;
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.readAt ? 0 : 1),
    }));
    return true;
  },
  markReadNow: async (notificationId) => {
    const target = get().notifications.find((n) => n.notificationId === notificationId);
    if (!target || target.readAt) return;
    // Optimistic: the row and badge update before the request lands.
    const now = new Date().toISOString();
    set((state) => ({
      notifications: state.notifications.map((n) => (n.notificationId === notificationId ? { ...n, readAt: now } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    try {
      const { unreadCount } = await markNotificationRead(notificationId);
      set({ unreadCount });
    } catch {
      // Left read locally; the next load corrects it if the server disagrees.
    }
  },
  markAllReadNow: async () => {
    const { unreadCount } = await markAllNotificationsRead();
    const now = new Date().toISOString();
    set((state) => ({
      notifications: state.notifications.map((n) => (n.readAt ? n : { ...n, readAt: now })),
      unreadCount,
    }));
  },
  reset: () => set({ notifications: [], unreadCount: 0, nextCursor: null }),
}));

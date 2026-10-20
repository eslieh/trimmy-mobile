import { create } from 'zustand';
import type { AppNotification } from '../types/notification';

// The in-app toast queue (components/InAppToastHost). One toast at a time;
// if several arrive while one is showing, the next toast summarises them
// ("3 new notifications") instead of playing them back one by one.
export type Toast = {
  key: string;
  title: string;
  body: string;
  type: string;
  // The notification to open on tap; null for a summary (opens the inbox).
  notification: AppNotification | null;
};

type ToastState = {
  current: Toast | null;
  pending: AppNotification[];
  show: (notification: AppNotification) => void;
  // Called by the host once the current toast has animated out.
  next: () => void;
  clear: () => void;
};

function toastFor(notification: AppNotification): Toast {
  return {
    key: notification.notificationId,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    notification,
  };
}

export const useToastStore = create<ToastState>((set, get) => ({
  current: null,
  pending: [],
  show: (notification) => {
    if (get().current) set((state) => ({ pending: [...state.pending, notification] }));
    else set({ current: toastFor(notification) });
  },
  next: () => {
    const { pending } = get();
    if (pending.length === 0) set({ current: null });
    else if (pending.length === 1) set({ current: toastFor(pending[0]), pending: [] });
    else {
      const latest = pending[pending.length - 1];
      set({
        current: {
          key: `summary-${latest.notificationId}`,
          title: `${pending.length} new notifications`,
          body: latest.title,
          type: 'summary',
          notification: null,
        },
        pending: [],
      });
    }
  },
  clear: () => set({ current: null, pending: [] }),
}));

import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import type { AppNotification } from '../types/notification';

// Fan-out of live events to screens that show data someone else can change
// (Today, Calendar, Activity, the payout queue). `null` means "events may
// have been missed" (a resync), so every listener should refresh.
type Listener = (notification: AppNotification | null) => void;

const listeners = new Set<Listener>();

export function emitRealtime(notification: AppNotification | null): void {
  listeners.forEach((listener) => listener(notification));
}

// Calls `refresh` when a matching notification arrives, but only while the
// screen is focused — a backgrounded tab refetches on focus anyway, so this
// never spends requests on screens nobody is looking at. Bursts are folded
// into one refresh.
export function useRealtimeRefresh(matches: (type: string) => boolean, refresh: () => void, debounceMs = 600): void {
  const focused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ matches, refresh });
  latest.current = { matches, refresh };

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
      };
    }, []),
  );

  useEffect(() => {
    const listener: Listener = (notification) => {
      if (!focused.current) return;
      if (notification && !latest.current.matches(notification.type)) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => latest.current.refresh(), debounceMs);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [debounceMs]);
}

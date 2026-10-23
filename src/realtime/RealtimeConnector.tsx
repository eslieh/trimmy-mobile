import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { refreshAccessToken } from '../api/client';
import { config, USE_MOCK_NOTIFICATIONS } from '../config/env';
import { useAuth } from '../contexts/AuthContext';
import { tokenStorage } from '../storage/tokenStorage';
import { useNotificationsStore } from '../store/useNotificationsStore';
import type { AppNotification } from '../types/notification';
import { receiveNotification, resyncNotifications } from './incoming';
import { openEventStream } from './sseClient';
import { markConnectionFailed, resetRealtimeStatus, setRealtimeConnected } from './status';

// Keeps one live stream (GET /me/events) open while a signed-in user has the
// app in the foreground, and none otherwise: closing it in the background
// costs nothing (missed events are replayed from Last-Event-ID, and the
// inbox is the source of truth) and saves battery and data on every phone.
//
// - reconnects with exponential backoff + jitter (1s → 60s), so a server
//   restart doesn't get every phone reconnecting in the same second
// - a 401 refreshes the access token once, then reconnects
// - a watchdog reconnects if nothing (not even a heartbeat) arrives for 3
//   heartbeats — mobile networks drop idle connections silently
// Renders nothing.

const DEFAULT_HEARTBEAT_SECONDS = 20;
const MAX_BACKOFF_MS = 60_000;

export function RealtimeConnector() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId || USE_MOCK_NOTIFICATIONS) return;

    let stream: { close: () => void } | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let watchdog: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let heartbeatMs = DEFAULT_HEARTBEAT_SECONDS * 1000;
    let lastEventId: string | null = null;
    let refreshedToken = false;
    let active = AppState.currentState === 'active';
    let stopped = false;

    const clearTimers = () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (watchdog) clearTimeout(watchdog);
      retryTimer = watchdog = null;
    };

    const disconnect = () => {
      clearTimers();
      stream?.close();
      stream = null;
      setRealtimeConnected(false);
    };

    const armWatchdog = () => {
      if (watchdog) clearTimeout(watchdog);
      watchdog = setTimeout(() => {
        disconnect();
        scheduleReconnect(0);
      }, heartbeatMs * 3);
    };

    const scheduleReconnect = (delayMs?: number) => {
      disconnect();
      if (stopped || !active) return;
      const backoff = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempts);
      const wait = delayMs ?? backoff / 2 + Math.random() * (backoff / 2);
      attempts += 1;
      retryTimer = setTimeout(connect, wait);
    };

    const connect = async () => {
      if (stopped || !active || stream) return;
      const token = await tokenStorage.getAccessToken();
      if (!token || stopped || !active) return;
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      if (lastEventId) headers['Last-Event-ID'] = lastEventId;

      stream = openEventStream(`${config.apiBaseUrl}/api/v1/me/events`, headers, {
        onActivity: armWatchdog,
        onEvent: (event) => {
          switch (event.event) {
            case 'ready': {
              const wasDisconnectedBefore = attempts > 0;
              attempts = 0;
              refreshedToken = false;
              setRealtimeConnected(true);
              try {
                const seconds = JSON.parse(event.data)?.heartbeatSeconds;
                if (typeof seconds === 'number' && seconds > 0) heartbeatMs = seconds * 1000;
              } catch {
                // Keep the default.
              }
              armWatchdog();
              // First connect without a Last-Event-ID can't replay: sync the
              // badge instead. (With one, the server replays what was missed.)
              if (!lastEventId || wasDisconnectedBefore) useNotificationsStore.getState().refreshUnreadCount();
              break;
            }
            case 'notification': {
              if (event.id) lastEventId = event.id;
              try {
                receiveNotification(JSON.parse(event.data) as AppNotification);
              } catch {
                // A malformed event: skip it; the inbox still has the row.
              }
              break;
            }
            case 'resync':
              resyncNotifications();
              break;
            case 'reconnect':
              // The server is rotating this stream (token lifetime, deploys).
              scheduleReconnect(0);
              break;
          }
        },
        onClose: async (status) => {
          stream = null;
          setRealtimeConnected(false);
          if (status === 401 && !refreshedToken) {
            refreshedToken = true;
            const fresh = await refreshAccessToken();
            if (fresh) scheduleReconnect(0);
            return; // no session left: AuthContext handles signing out
          }
          // Couldn't reach the server at all (no network, or it's down).
          if (status === null || status >= 500) markConnectionFailed();
          if (status === 429) attempts = Math.max(attempts, 5); // too many streams: back off hard
          scheduleReconnect();
        },
      });
    };

    // 'inactive' (iOS control centre, an incoming-call banner) keeps the stream.
    const onAppState = (state: AppStateStatus) => {
      if (state === 'active' && !active) {
        active = true;
        attempts = 0;
        connect();
      } else if (state === 'background' && active) {
        active = false;
        disconnect();
        resetRealtimeStatus(); // closed on purpose: not "offline"
      }
    };

    const subscription = AppState.addEventListener('change', onAppState);
    if (active) connect();

    return () => {
      stopped = true;
      subscription.remove();
      disconnect();
      resetRealtimeStatus(); // signed out
    };
  }, [userId]);

  return null;
}

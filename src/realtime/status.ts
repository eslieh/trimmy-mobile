import { create } from 'zustand';

// Whether the live stream is open right now. Its own module so the push
// handler and the offline banner can read it without importing the
// connector (and, through it, AuthContext, which imports the push code).
// `lostAt`: when an open stream last dropped (null while connected, or
// before the first connection), for the banner's grace period.
type RealtimeStatus = {
  connected: boolean;
  lostAt: number | null;
};

export const useRealtimeStatus = create<RealtimeStatus>(() => ({ connected: false, lostAt: null }));

export function setRealtimeConnected(value: boolean): void {
  const { connected } = useRealtimeStatus.getState();
  if (value === connected) return;
  useRealtimeStatus.setState({ connected: value, lostAt: value ? null : Date.now() });
}

// A connection attempt that couldn't reach the server (e.g. opened with no
// network): offline too, from the first failure, until one succeeds.
export function markConnectionFailed(): void {
  const { connected, lostAt } = useRealtimeStatus.getState();
  if (!connected && lostAt === null) useRealtimeStatus.setState({ lostAt: Date.now() });
}

// Signed out, or the app went to the background on purpose: not "offline".
export function resetRealtimeStatus(): void {
  useRealtimeStatus.setState({ connected: false, lostAt: null });
}

export function isRealtimeConnected(): boolean {
  return useRealtimeStatus.getState().connected;
}

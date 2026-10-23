import { useEffect, useState } from 'react';

// Seconds left until an ISO timestamp (e.g. a booking's expiresAt), ticking
// once a second. null when there's no deadline; never below 0.
export function useCountdown(deadline: string | null | undefined): number | null {
  const compute = () => (deadline ? Math.max(0, Math.round((new Date(deadline).getTime() - Date.now()) / 1000)) : null);
  const [secondsLeft, setSecondsLeft] = useState(compute);

  useEffect(() => {
    setSecondsLeft(compute());
    if (!deadline) return;
    const id = setInterval(() => setSecondsLeft(compute()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  return secondsLeft;
}

export function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

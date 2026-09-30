import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listBusinessBookings } from '../api/booking';
import { getApiErrorMessage } from '../api/client';
import { useBookingsStore } from '../store/useBookingsStore';

const MAX_RANGE_DAYS = 62; // server limit per request

function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Split an inclusive YYYY-MM-DD range into ≤62-day chunks.
function chunkRange(from: string, to: string): [string, string][] {
  const chunks: [string, string][] = [];
  let start = parseKey(from);
  const end = parseKey(to);
  while (start <= end) {
    const chunkEnd = new Date(start);
    chunkEnd.setDate(chunkEnd.getDate() + MAX_RANGE_DAYS - 1);
    const clamped = chunkEnd > end ? end : chunkEnd;
    chunks.push([toKey(start), toKey(clamped)]);
    start = new Date(clamped);
    start.setDate(start.getDate() + 1);
  }
  return chunks;
}

// Loads a business's bookings for an inclusive date range from the server
// (list-business-bookings) into useBookingsStore whenever the screen comes
// into focus or the range changes. The store is a cache: screens keep
// selecting from it, the server is the source of truth. Owner/front desk
// get every booking; staff get only their own.
export function useSyncBusinessBookings(businessId: string | undefined, from: string, to: string) {
  const replaceBusinessRange = useBookingsStore((s) => s.replaceBusinessRange);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    if (!businessId) return;
    setLoading(true);
    setError('');
    Promise.all(
      chunkRange(from, to).map(([chunkFrom, chunkTo]) =>
        chunkFrom === chunkTo
          ? listBusinessBookings(businessId, { date: chunkFrom })
          : listBusinessBookings(businessId, { from: chunkFrom, to: chunkTo }),
      ),
    )
      .then((pages) => replaceBusinessRange(businessId, from, to, pages.flat()))
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load bookings.")))
      .finally(() => setLoading(false));
  }, [businessId, from, to, replaceBusinessRange]);

  useFocusEffect(refresh);

  return { loading, error, refresh };
}

// DateRange (earnings: end exclusive) → inclusive YYYY-MM-DD keys.
export function dateRangeKeys(range: { start: Date; end: Date }): [string, string] {
  const lastDay = new Date(range.end);
  lastDay.setDate(lastDay.getDate() - 1);
  return [toKey(range.start), toKey(lastDay < range.start ? range.start : lastDay)];
}

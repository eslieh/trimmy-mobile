import type { PaymentMethod } from '../types/booking';

// Date-range helpers for the three earnings screens. The numbers themselves
// come from the server (get-earnings-summary, see hooks/useEarningsSummary),
// which applies the rules this file used to compute client-side.

export type EarningsRange = 'today' | 'week' | 'month' | 'year' | 'custom';

export type DateRange = {
  start: Date; // inclusive
  end: Date; // exclusive
};

// One row of the transactions ledger (see TransactionList).
export type TransactionLine = {
  bookingId: string;
  serviceId: string;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  customerName: string;
  serviceName: string;
  amount: number;
  paymentMethod: PaymentMethod | null;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// The presets are just specific rolling windows anchored on today (default
// range on opening the screen) — no need for exact calendar-month precision
// against mock data. A custom range is built by the caller (EarningsScreen)
// from its two date pickers.
export function getPresetDateRange(range: Exclude<EarningsRange, 'custom'>): DateRange {
  const today = startOfDay(new Date());
  const end = new Date(today);
  end.setDate(end.getDate() + 1); // exclusive upper bound = end of today

  if (range === 'today') return { start: today, end };

  const start = new Date(today);
  if (range === 'week') start.setDate(start.getDate() - 6);
  else if (range === 'month') start.setDate(start.getDate() - 29);
  else start.setMonth(start.getMonth() - 11, 1);

  return { start, end };
}

// Custom-range helper: 'YYYY-MM-DD' + 'YYYY-MM-DD' → a DateRange with an
// exclusive end (end-of-day on the chosen end date, so that day's bookings
// are included). Clamps end to not fall before start.
export function buildCustomDateRange(startKey: string, endKey: string): DateRange {
  const [sy, sm, sd] = startKey.split('-').map(Number);
  const [ey, em, ed] = endKey.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  let end = new Date(ey, em - 1, ed);
  if (end < start) end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

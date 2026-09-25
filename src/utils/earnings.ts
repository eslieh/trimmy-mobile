import { getBookingDateTime } from './date';
import type { Booking, PaymentMethod } from '../types/booking';
import type { Service } from '../types/business';

export type EarningsRange = 'today' | 'week' | 'month' | 'year' | 'custom';

export type DateRange = {
  start: Date; // inclusive
  end: Date; // exclusive
};

export type EarningsBucket = {
  label: string;
  amount: number;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Only a completed charge counts as real revenue — a confirmed-but-unpaid
// booking, or one still in progress, hasn't actually earned anything yet.
function isPaid(booking: Booking): boolean {
  return booking.paymentStatus === 'paid';
}

function bookingTotal(booking: Booking): number {
  return booking.totalAmount.amount;
}

function bookingsInRange(bookings: Booking[], range: DateRange): Booking[] {
  return bookings.filter((b) => {
    const t = getBookingDateTime(b.date, b.time);
    return t >= range.start && t < range.end;
  });
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

type BucketGranularity = 'hour' | 'day' | 'week' | 'month';

function pickGranularity(range: DateRange): BucketGranularity {
  const spanDays = Math.round((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24));
  if (spanDays <= 1) return 'hour';
  if (spanDays <= 16) return 'day';
  if (spanDays <= 70) return 'week';
  return 'month';
}

// Generic bucketing that adapts to however long the range actually is —
// 3-hour bars for a single day (the Today preset lands here), daily bars
// for anything ~2 weeks or shorter (Week), weekly bars up to ~10 weeks
// (Month), monthly bars beyond that (Year, and any custom multi-month
// range).
export function getEarningsBuckets(bookings: Booking[], range: DateRange): EarningsBucket[] {
  const paidBookings = bookings.filter(isPaid);
  const granularity = pickGranularity(range);

  const buckets: { start: Date; end: Date; label: string }[] = [];
  let cursor = new Date(range.start);

  while (cursor < range.end) {
    const bucketStart = new Date(cursor);
    let bucketEnd: Date;
    let label: string;

    if (granularity === 'hour') {
      bucketEnd = new Date(bucketStart);
      bucketEnd.setHours(bucketEnd.getHours() + 3);
      label = bucketStart.toLocaleTimeString('en-US', { hour: 'numeric' });
    } else if (granularity === 'day') {
      bucketEnd = new Date(bucketStart);
      bucketEnd.setDate(bucketEnd.getDate() + 1);
      label = bucketStart.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (granularity === 'week') {
      bucketEnd = new Date(bucketStart);
      bucketEnd.setDate(bucketEnd.getDate() + 7);
      label = bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      bucketEnd = new Date(bucketStart.getFullYear(), bucketStart.getMonth() + 1, 1);
      label = bucketStart.toLocaleDateString('en-US', { month: 'short' });
    }

    if (bucketEnd > range.end) bucketEnd = new Date(range.end);
    buckets.push({ start: bucketStart, end: bucketEnd, label });
    cursor = bucketEnd;
  }

  return buckets.map(({ start, end, label }) => ({
    label,
    amount: paidBookings
      .filter((b) => {
        const t = getBookingDateTime(b.date, b.time);
        return t >= start && t < end;
      })
      .reduce((sum, b) => sum + bookingTotal(b), 0),
  }));
}

export type PaymentMethodSlice = {
  method: PaymentMethod;
  amount: number;
  count: number;
};

export function getPaymentMethodBreakdown(bookings: Booking[], range: DateRange): PaymentMethodSlice[] {
  const paid = bookingsInRange(bookings, range).filter(isPaid);
  const methods: PaymentMethod[] = ['mpesa', 'cash'];

  return methods
    .map((method) => {
      const matching = paid.filter((b) => b.paymentMethod === method);
      return {
        method,
        amount: matching.reduce((sum, b) => sum + bookingTotal(b), 0),
        count: matching.length,
      };
    })
    .filter((slice) => slice.count > 0);
}

export type ServiceBreakdownRow = {
  serviceId: string;
  name: string;
  amount: number;
  bookingsCount: number;
};

// Every service the business currently offers, not just ones with revenue —
// a service sitting at 0 bookings this range is exactly the kind of thing
// "list the services they offered" is meant to surface. Revenue is
// allocated per service line (price.amount * quantity), not by splitting
// a multi-service booking's total evenly.
export function getServicesBreakdown(
  allServices: Service[],
  bookings: Booking[],
  range: DateRange,
): ServiceBreakdownRow[] {
  const paid = bookingsInRange(bookings, range).filter(isPaid);
  const totals = new Map<string, { amount: number; bookingsCount: number }>();

  for (const booking of paid) {
    for (const line of booking.services) {
      const existing = totals.get(line.serviceId);
      const lineTotal = line.price.amount * line.quantity;
      if (existing) {
        existing.amount += lineTotal;
        existing.bookingsCount += 1;
      } else {
        totals.set(line.serviceId, { amount: lineTotal, bookingsCount: 1 });
      }
    }
  }

  return allServices
    .map((service) => {
      const totalled = totals.get(service.serviceId);
      return {
        serviceId: service.serviceId,
        name: service.name,
        amount: totalled?.amount ?? 0,
        bookingsCount: totalled?.bookingsCount ?? 0,
      };
    })
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
}

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

// The line-by-line ledger behind every chart above — one row per service
// actually performed (not per booking, so a 2-service booking is 2 rows,
// each with its own allocated amount), newest first. Used by all three
// earnings screens (Earnings, Team Member Detail, staff's own Earnings) for
// the "show me the actual transactions" view underneath the aggregates.
export function getTransactionLines(bookings: Booking[], range: DateRange): TransactionLine[] {
  const paid = bookingsInRange(bookings, range).filter(isPaid);
  const lines: TransactionLine[] = [];

  for (const booking of paid) {
    for (const line of booking.services) {
      lines.push({
        bookingId: booking.bookingId,
        serviceId: line.serviceId,
        date: booking.date,
        time: booking.time,
        customerName: booking.customerName,
        serviceName: line.name,
        amount: line.price.amount * line.quantity,
        paymentMethod: booking.paymentMethod,
      });
    }
  }

  return lines.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

export type AppointmentStats = {
  completed: number;
  noShow: number;
  cancelled: number;
  totalRevenue: number;
  avgTicket: number;
};

export function getAppointmentStats(bookings: Booking[], range: DateRange): AppointmentStats {
  const inRange = bookingsInRange(bookings, range);
  const paid = inRange.filter(isPaid);
  const totalRevenue = paid.reduce((sum, b) => sum + bookingTotal(b), 0);

  return {
    completed: inRange.filter((b) => b.status === 'completed').length,
    noShow: inRange.filter((b) => b.status === 'no_show').length,
    cancelled: inRange.filter((b) => b.status === 'cancelled').length,
    totalRevenue,
    avgTicket: paid.length > 0 ? Math.round(totalRevenue / paid.length) : 0,
  };
}

import { apiRequest, toQueryString } from './client';
import type { PaymentMethod } from '../types/booking';

// See reference/api/fulfillment.json#get-earnings-summary. Computed on the
// server from paid bookings, following the rules src/utils/earnings.ts used
// to apply client-side (same buckets, labels and sorting). Owner: whole
// business, or one person with staffId; staff: always their own; front
// desk: 403. from/to are business-local days, inclusive, ≤366 days apart.
export type EarningsSummary = {
  totalRevenue: number;
  completed: number;
  noShow: number;
  cancelled: number;
  avgTicket: number;
  buckets: { label: string; amount: number }[];
  paymentMethods: { method: PaymentMethod; amount: number; count: number }[];
  // Every current service (0 rows included), plus deleted ones that earned
  // money in the range (serviceId null).
  services: { serviceId: string | null; name: string; amount: number; bookingsCount: number }[];
  // One row per service performed, newest first.
  transactions: {
    bookingId: string;
    serviceId: string | null;
    date: string;
    time: string;
    customerName: string;
    serviceName: string;
    amount: number;
    paymentMethod: PaymentMethod | null;
  }[];
  transactionsTotal: number;
  commission: number;
  // Same-length period just before `from`; revenueChangePercent null when it earned nothing.
  previous: { from: string; to: string; totalRevenue: number; revenueChangePercent: number | null } | null;
};

export function getEarningsSummary(
  businessId: string,
  query: { from: string; to: string; staffId?: string; transactionsLimit?: number },
): Promise<EarningsSummary> {
  const qs = toQueryString([
    ['from', query.from],
    ['to', query.to],
    ['staffId', query.staffId],
    ['transactionsLimit', query.transactionsLimit],
  ]);
  return apiRequest<EarningsSummary>(`/businesses/${businessId}/earnings?${qs}`);
}

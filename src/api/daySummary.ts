import { apiRequest, toQueryString } from './client';
import type { Money } from '../types/business';

// See reference/api/fulfillment.json#get-day-summary / #submit-day-summary
// (F4). Owner or front desk. `collected` is the cash drawer: payments that
// succeeded that day, split by method (cash / mpesa) and, separately, by
// kind (deposits / balance payments) — the two splits cover the same money,
// so never add them together.
export type AmountCount = { amount: number; count: number };

export type DaySummary = {
  date: string;
  timezone: string;
  appointments: number; // booked ahead, not cancelled
  walkIns: number;
  completed: number;
  noShows: number;
  cancelled: number;
  collected: {
    cash: AmountCount;
    mpesa: AmountCount;
    depositsCollected: AmountCount;
    balancePayments: AmountCount;
  };
  refundsPaid: AmountCount;
  unpaid: { bookingId: string; customerName: string; time: string; status: string; balanceDue: Money }[];
  submission: { submittedAt: string | null; submittedBy: string | null; notes: string | null };
};

export function getDaySummary(businessId: string, date: string): Promise<DaySummary> {
  return apiRequest<DaySummary>(`/businesses/${businessId}/day-summary?${toQueryString([['date', date]])}`);
}

// Records the day as reconciled (notes optional) and notifies the owner by
// SMS and push. Resubmitting replaces the note; a future day is 400.
export function submitDaySummary(businessId: string, date: string, notes?: string): Promise<DaySummary> {
  return apiRequest<DaySummary>(`/businesses/${businessId}/day-summary/${date}/submit`, {
    method: 'POST',
    body: { notes: notes?.trim() || null },
  });
}

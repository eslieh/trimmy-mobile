import { apiRequest, getApiErrorCode } from './client';
import { ChargeFailedError } from './booking';
import type { Visit } from '../types/booking';

// Visits (reference/api/fulfillment.json#add-service, #get-visit, #charge-visit):
// a customer having one thing done adds another, maybe with someone else, and
// it's all checked out in one payment with the tip split between the staff.

export type AddServiceInput = {
  serviceId: string;
  staffId: string;
  start: 'now' | 'after' | 'at';
  time?: string; // 'HH:MM' when start is 'at'
};

export function addServiceToVisit(bookingId: string, input: AddServiceInput): Promise<Visit> {
  return apiRequest<Visit>(`/bookings/${bookingId}/add-service`, {
    method: 'POST',
    body: {
      services: [{ serviceId: input.serviceId, quantity: 1 }],
      staffId: input.staffId,
      start: input.start,
      ...(input.start === 'at' ? { time: input.time } : {}),
    },
  });
}

export function getVisit(visitId: string): Promise<Visit> {
  return apiRequest<Visit>(`/visits/${visitId}`);
}

export type VisitTip = { staffId: string; amount: number };

const POLL_INTERVAL_MS = 3000;
const POLL_LIMIT_MS = 2 * 60 * 1000;

// One payment for the visit (or just `bookingIds`, the parts that are done).
// Cash comes straight back; M-Pesa sends one prompt and polls the visit until
// those parts are paid. Throws ChargeFailedError when the customer doesn't
// complete the prompt, or an ApiError (e.g. visit_not_ready) otherwise.
export async function chargeVisit(
  visitId: string,
  input: { method: 'mpesa' | 'cash'; phone?: string; tips: VisitTip[]; bookingIds?: string[] },
): Promise<Visit> {
  try {
    const res = await apiRequest<Visit | { paymentId: string }>(`/visits/${visitId}/charge`, {
      method: 'POST',
      body: {
        method: input.method,
        tips: input.tips.filter((t) => t.amount > 0),
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.bookingIds ? { bookingIds: input.bookingIds } : {}),
      },
    });
    if ('visitId' in res && 'bookings' in res) return res;
  } catch (err) {
    if (getApiErrorCode(err) !== 'payment_in_progress') throw err;
  }
  const startedAt = Date.now();
  while (Date.now() - startedAt < POLL_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const visit = await getVisit(visitId).catch(() => null); // a dropped poll isn't an outcome
    if (!visit) continue;
    const wanted = input.bookingIds ?? visit.bookings.map((b) => b.bookingId);
    const paid = visit.bookings.filter((b) => wanted.includes(b.bookingId) && b.status !== 'cancelled' && b.status !== 'no_show');
    if (paid.length && paid.every((b) => b.paymentStatus === 'paid')) return visit;
    const attempt = visit.chargePayment;
    if (attempt && (attempt.status === 'failed' || attempt.status === 'timeout')) {
      throw new ChargeFailedError(attempt.failureReason ?? attempt.status);
    }
  }
  throw new ChargeFailedError('timeout');
}

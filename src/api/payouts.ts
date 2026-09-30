import { apiRequest, toQueryString } from './client';
import type { PayoutBalance, PayoutRequest, PayoutStatus } from '../types/payout';

// See reference/api/fulfillment.json#request-payout / #list-business-payouts /
// #respond-to-payout / #get-payout-balance. The server computes and
// enforces every balance — the app only displays it.

export type RequestPayoutInput = {
  businessId: string;
  amount: number;
  // Optional: defaults to the caller's own staff record; anyone else's is 403.
  staffId?: string;
};

// Staff, for themselves. 409 insufficient_balance if over the available
// balance. Always comes back pending.
export function requestPayout(input: RequestPayoutInput): Promise<PayoutRequest> {
  return apiRequest<PayoutRequest>('/payouts', { method: 'POST', body: input });
}

// Owner: everyone's; staff: their own.
export function listBusinessPayouts(
  businessId: string,
  filters: { status?: PayoutStatus; staffId?: string } = {},
): Promise<PayoutRequest[]> {
  const qs = toQueryString([
    ['status', filters.status],
    ['staffId', filters.staffId],
  ]);
  return apiRequest<{ payouts: PayoutRequest[] }>(`/businesses/${businessId}/payouts${qs ? `?${qs}` : ''}`).then(
    (res) => res.payouts,
  );
}

// Owner. approve = they've paid the staff member themselves (M-Pesa/cash);
// reject releases the amount back to the staff member's balance.
export function respondToPayout(
  payoutId: string,
  action: 'approve' | 'reject',
  rejectionReason?: string,
): Promise<PayoutRequest> {
  return apiRequest<PayoutRequest>(`/payouts/${payoutId}/respond`, {
    method: 'POST',
    body: { action, rejectionReason: action === 'reject' ? (rejectionReason ?? null) : null },
  });
}

// The signed-in staff member's wallet at this business.
export function getMyPayoutBalance(businessId: string): Promise<PayoutBalance> {
  return apiRequest<PayoutBalance>(`/me/payouts/balance?${toQueryString([['businessId', businessId]])}`);
}

// Owner (or that staff member) looking at one person's wallet.
export function getStaffPayoutBalance(businessId: string, staffId: string): Promise<PayoutBalance> {
  return apiRequest<PayoutBalance>(`/businesses/${businessId}/staff/${staffId}/payout-balance`);
}

import { apiRequest, toQueryString } from './client';
import type {
  AdjustmentKind,
  PayoutBalance,
  PayoutRequest,
  PayoutStatus,
  Wallet,
  WalletAdjustment,
  WalletStatement,
} from '../types/payout';

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

// See reference/api/fulfillment.json#get-my-wallet. Totals across every
// business the signed-in person works at (empty without a staff record).
export function getMyWallet(): Promise<Wallet> {
  return apiRequest<Wallet>('/me/wallet');
}

// See reference/api/fulfillment.json#get-wallet-statement. Newest first;
// pass nextOffset back as offset (null on the last page).
export function getMyWalletStatement(
  options: { businessId?: string; offset?: number; limit?: number } = {},
): Promise<WalletStatement> {
  const qs = toQueryString([
    ['businessId', options.businessId],
    ['limit', options.limit ?? 50],
    ['offset', options.offset],
  ]);
  return apiRequest<WalletStatement>(`/me/wallet/transactions?${qs}`);
}

// The owner (or that staff member) viewing one person's statement.
export function getStaffWalletStatement(
  businessId: string,
  staffId: string,
  options: { offset?: number; limit?: number } = {},
): Promise<WalletStatement> {
  const qs = toQueryString([
    ['limit', options.limit ?? 50],
    ['offset', options.offset],
  ]);
  return apiRequest<WalletStatement>(`/businesses/${businessId}/staff/${staffId}/wallet/transactions?${qs}`);
}

// See reference/api/fulfillment.json#add-wallet-adjustment. Owner: any kind;
// front desk: tips only. amount is positive KES; tip / bonus add, deduction /
// advance take away. The staff member gets a wallet_adjusted push.
export function addWalletAdjustment(
  businessId: string,
  staffId: string,
  input: { kind: AdjustmentKind; amount: number; note?: string; bookingId?: string },
): Promise<WalletAdjustment> {
  return apiRequest<WalletAdjustment>(`/businesses/${businessId}/staff/${staffId}/wallet-adjustments`, {
    method: 'POST',
    body: { kind: input.kind, amount: input.amount, note: input.note?.trim() || null, bookingId: input.bookingId ?? null },
  });
}

// Owner: undo a mistaken adjustment (kept on record, no longer counts).
export function voidWalletAdjustment(adjustmentId: string): Promise<WalletAdjustment> {
  return apiRequest<WalletAdjustment>(`/wallet-adjustments/${adjustmentId}/void`, { method: 'POST' });
}

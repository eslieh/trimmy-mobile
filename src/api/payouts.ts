import { apiRequest } from './client';
import { mockDelay } from './mock/delay';
import { USE_MOCK_API } from '../config/env';
import type { PayoutRequest } from '../types/payout';

// See reference/api/fulfillment.json#request-payout for the contract this
// implements (staff.md's S3, wallet model — see types/payout.ts). Always
// comes back 'pending' — see respondToPayout below for how it moves to
// 'paid'/'rejected'. Validating amount against the available balance
// happens client-side (StaffEarningsScreen); a real backend should re-check
// it server-side too, not trust the client.
export type RequestPayoutInput = {
  businessId: string;
  invitationId: string;
  amount: number;
};

let mockPayoutSequence = 0;

export function requestPayout(input: RequestPayoutInput): Promise<PayoutRequest> {
  if (USE_MOCK_API) {
    mockPayoutSequence += 1;
    return mockDelay<PayoutRequest>({
      payoutId: `payout_mock_${mockPayoutSequence}`,
      businessId: input.businessId,
      invitationId: input.invitationId,
      amount: input.amount,
      currency: 'KES',
      status: 'pending',
      requestedAt: new Date().toISOString(),
      respondedAt: null,
      rejectionReason: null,
    });
  }

  return apiRequest<PayoutRequest>('/payouts', { method: 'POST', body: input });
}

// See reference/api/fulfillment.json#respond-to-payout for the contract
// this implements (business-owner.md's O4). 'approve' is the owner's
// attestation that they've already sent the money themselves (M-Pesa/cash,
// outside this app — there's no real payment rail here), not a trigger
// that moves money. Mock-only quirk: takes the full payout rather than
// just an id, same reason as chargeBookingPayment/updateBookingStatus.
export function respondToPayout(
  payout: PayoutRequest,
  action: 'approve' | 'reject',
  rejectionReason?: string,
): Promise<PayoutRequest> {
  if (USE_MOCK_API) {
    return mockDelay<PayoutRequest>({
      ...payout,
      status: action === 'approve' ? 'paid' : 'rejected',
      respondedAt: new Date().toISOString(),
      rejectionReason: action === 'reject' ? (rejectionReason ?? null) : null,
    });
  }

  return apiRequest<PayoutRequest>(`/payouts/${payout.payoutId}/respond`, {
    method: 'POST',
    body: { action, rejectionReason },
  });
}

import { create } from 'zustand';
import { requestPayout, respondToPayout, type RequestPayoutInput } from '../api/payouts';
import type { PayoutRequest } from '../types/payout';

type PayoutsState = {
  payouts: PayoutRequest[];
  requestPayoutNow: (input: RequestPayoutInput) => Promise<PayoutRequest>;
  respondToPayoutNow: (
    payout: PayoutRequest,
    action: 'approve' | 'reject',
    rejectionReason?: string,
  ) => Promise<PayoutRequest>;
};

// Client-only, in-memory — same caveat as every other mock store here.
// Every request ever made counts against a member's wallet balance while
// it's 'pending' or 'paid' — see StaffEarningsScreen, which computes
// lifetime commission earned minus the sum of everything in this array for
// their invitationId, excluding 'rejected' ones (a rejection releases that
// amount back to their available balance, since it was never actually paid).
export const usePayoutsStore = create<PayoutsState>((set) => ({
  payouts: [],
  requestPayoutNow: async (input) => {
    const payout = await requestPayout(input);
    set((state) => ({ payouts: [...state.payouts, payout] }));
    return payout;
  },
  respondToPayoutNow: async (payout, action, rejectionReason) => {
    const updated = await respondToPayout(payout, action, rejectionReason);
    set((state) => ({
      payouts: state.payouts.map((p) => (p.payoutId === updated.payoutId ? updated : p)),
    }));
    return updated;
  },
}));

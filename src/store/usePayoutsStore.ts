import { create } from 'zustand';
import {
  getPayout,
  listBusinessPayouts,
  requestPayout,
  respondToPayout,
  type RequestPayoutInput,
} from '../api/payouts';
import type { PayoutRequest, PayoutStatus } from '../types/payout';

type PayoutsState = {
  payouts: PayoutRequest[];
  // Server → cache (list-business-payouts). Replaces the cached payouts for
  // the business (narrowed by status / staffId when given).
  loadPayouts: (businessId: string, filters?: { status?: PayoutStatus; staffId?: string }) => Promise<void>;
  // Server → cache for one payout (upserted), e.g. opened from a notification.
  loadPayout: (payoutId: string) => Promise<PayoutRequest>;
  requestPayoutNow: (input: RequestPayoutInput) => Promise<PayoutRequest>;
  respondToPayoutNow: (payoutId: string, action: 'approve' | 'reject', rejectionReason?: string) => Promise<PayoutRequest>;
};

export const usePayoutsStore = create<PayoutsState>((set) => ({
  payouts: [],
  loadPayouts: async (businessId, filters = {}) => {
    const fetched = await listBusinessPayouts(businessId, filters);
    const covered = (p: PayoutRequest) =>
      p.businessId === businessId &&
      (!filters.status || p.status === filters.status) &&
      (!filters.staffId || p.staffId === filters.staffId);
    set((state) => ({ payouts: [...fetched, ...state.payouts.filter((p) => !covered(p))] }));
  },
  loadPayout: async (payoutId) => {
    const payout = await getPayout(payoutId);
    set((state) => ({ payouts: [payout, ...state.payouts.filter((p) => p.payoutId !== payout.payoutId)] }));
    return payout;
  },
  requestPayoutNow: async (input) => {
    const payout = await requestPayout(input);
    set((state) => ({ payouts: [payout, ...state.payouts] }));
    return payout;
  },
  respondToPayoutNow: async (payoutId, action, rejectionReason) => {
    const updated = await respondToPayout(payoutId, action, rejectionReason);
    set((state) => ({
      payouts: state.payouts.map((p) => (p.payoutId === updated.payoutId ? updated : p)),
    }));
    return updated;
  },
}));

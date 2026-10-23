import { colors } from '../theme';
import type { PayoutStatus } from '../types/payout';

// Shared by StaffEarningsScreen (their own payout history), TeamScreen
// (pending queue), and PayoutDetailScreen/PayoutHistoryScreen (owner's O4
// approval views) — one status vocabulary, not copies drifting apart.
export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  rejected: 'Rejected',
};

export const PAYOUT_STATUS_COLOR: Record<PayoutStatus, string> = {
  pending: colors.feedback.warning,
  paid: colors.feedback.success,
  rejected: colors.feedback.danger,
};

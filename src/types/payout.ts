// A staff member's payout request from their earnings wallet (staff.md's
// S3, wallet model — the balance accumulates continuously as bookings get
// charged, and they can request any amount up to what's available, whenever
// they want). O4 (owner payout approval, business-owner.md) is the other
// half: the owner sees pending requests on the Team tab, approves ("Accept
// & Send" — a manual attestation that they've actually sent the money via
// M-Pesa/cash themselves; Trimyy never moves money) or rejects (with a
// reason). See TASKS.md.
export type PayoutStatus = 'pending' | 'paid' | 'rejected';

export type PayoutRequest = {
  payoutId: string;
  businessId: string;
  invitationId: string;
  amount: number;
  currency: 'KES';
  status: PayoutStatus;
  requestedAt: string;
  respondedAt: string | null; // when the owner approved/rejected
  rejectionReason: string | null;
};

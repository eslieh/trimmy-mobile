export type PayoutStatus = 'pending' | 'paid' | 'rejected';

// A staff member's withdrawal request from their earnings wallet (S3/O4).
// Trimmy never moves this money: "approve" records that the owner paid the
// staff member themselves. Keyed by staffId (BK-02), not invitationId.
export type PayoutRequest = {
  payoutId: string;
  businessId: string;
  staffId: string | null;
  staffName: string;
  amount: number;
  currency: 'KES';
  status: PayoutStatus;
  requestedAt: string;
  respondedAt: string | null; // when the owner approved/rejected
  rejectionReason: string | null;
};

// GET /me/payouts/balance or /businesses/{id}/staff/{staffId}/payout-balance.
// earned = commission on paid bookings (fixed on each booking when it's
// paid, at that moment's commissionPercent); available = earned − pending − paid.
export type PayoutBalance = {
  businessId: string;
  staffId: string;
  currency: 'KES';
  earned: number;
  pending: number;
  paid: number;
  available: number;
  commissionPercent: number | null;
};

import type { Money } from './business';

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'no_show'
  | 'cancelled';

// 'walk_in' bookings are created in-app by the business owner (Today tab
// "+") rather than through the customer-facing booking flow.
export type BookingSource = 'online' | 'walk_in';

// Tracks the final service charge collected via the "Charge customer" flow
// — separate from depositAmount, which (if any) is paid up front at booking
// time through the existing confirm-booking-payment flow.
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid';

// 'mpesa' sends an STK push to the customer's phone through the business's
// connected payment destination; 'cash' just records that cash changed
// hands in person, no push involved.
export type PaymentMethod = 'mpesa' | 'cash';

export type BookingServiceLine = {
  serviceId: string;
  name: string;
  durationMinutes: number;
  price: Money;
  quantity: number;
};

// The result of the C2 booking flow (Select Staff → Date & Time → Review &
// Policies → Payment). staffId null means "Any available" was chosen.
export type Booking = {
  bookingId: string;
  businessId: string;
  businessName: string;
  customerName: string;
  customerPhone: string | null; // set once a charge STK push has been sent, or entered up front for a scheduled/walk-in appointment
  customerEmail: string | null;
  staffId: string | null;
  staffName: string;
  services: BookingServiceLine[];
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  durationMinutes: number;
  totalAmount: Money;
  depositAmount: Money | null; // null when the business requires no deposit
  status: BookingStatus;
  source: BookingSource;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null; // null until charged
  paymentReference: string | null; // M-Pesa receipt number once paid via mpesa; cash has no reference, stays null
  createdAt: string;
  // Server-created bookings (create-booking / get-booking) always carry the
  // fields below; they're optional only because the owner-side fulfillment
  // flows (walk-in, scheduled) are still mocked and build bookings locally.
  reference?: string; // short human code, e.g. BK7F3AQ9
  startsAt?: string; // date + time with the business's UTC offset
  expiresAt?: string | null; // pending_payment only: when the slot hold lapses
  cancelReason?: string | null; // e.g. payment_expired
  notes?: string | null;
  depositPayment?: DepositPayment | null; // null until a deposit payment is started (BK-31)
  // Checkout (charge-booking, not built yet): what's left to pay after any
  // deposit, and the M-Pesa charge attempt once one is started.
  balanceDue?: Money | null;
  chargePayment?: DepositPayment | null;
  // Both null unless a cancellation involved money (BK-60).
  cancellationFee?: Money | null; // kept by the business for a late cancellation
  refund?: BookingRefund | null; // owed back to the customer, paid by the business by hand
};

export type BookingRefund = {
  amount: Money;
  status: 'due' | 'refunded';
  refundedAt: string | null;
  reference: string | null; // e.g. the refund's M-Pesa code
};

export type DepositPayment = {
  paymentId: string;
  status: 'pending' | 'succeeded' | 'failed' | 'timeout';
  failureReason: string | null;
};

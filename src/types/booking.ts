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
export type PaymentStatus = 'unpaid' | 'paid';

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
  createdAt: string;
};

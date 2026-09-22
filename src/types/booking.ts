import type { Money } from './business';

export type BookingStatus = 'pending_payment' | 'confirmed' | 'cancelled';

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
  staffId: string | null;
  staffName: string;
  services: BookingServiceLine[];
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  durationMinutes: number;
  totalAmount: Money;
  depositAmount: Money | null; // null when the business requires no deposit
  status: BookingStatus;
  createdAt: string;
};

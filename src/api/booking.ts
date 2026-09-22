import { apiRequest } from './client';
import { mockDelay } from './mock/delay';
import { USE_MOCK_API } from '../config/env';
import type { Booking, BookingServiceLine } from '../types/booking';
import type { Money } from '../types/business';

// See reference/api/booking.json#create-booking for the contract this implements.
export type CreateBookingInput = {
  businessId: string;
  businessName: string;
  customerName: string;
  staffId: string | null;
  staffName: string;
  services: BookingServiceLine[];
  date: string;
  time: string;
  durationMinutes: number;
  totalAmount: Money;
  depositAmount: Money | null;
};

let mockBookingSequence = 0;

export function createBooking(input: CreateBookingInput): Promise<Booking> {
  if (USE_MOCK_API) {
    mockBookingSequence += 1;
    return mockDelay<Booking>({
      ...input,
      bookingId: `booking_mock_${mockBookingSequence}`,
      customerPhone: null,
      customerEmail: null,
      status: input.depositAmount ? 'pending_payment' : 'confirmed',
      source: 'online',
      paymentStatus: 'unpaid',
      paymentMethod: null,
      createdAt: new Date().toISOString(),
    });
  }

  return apiRequest<Booking>('/bookings', { method: 'POST', body: input });
}

// No corresponding reference/api contract entry yet — owner-recorded
// appointments (walk-in or manually scheduled) are an in-app-only concept,
// not part of the customer-facing booking flow this file otherwise
// documents. See TASKS.md's "New appointment" section.
export type CreateOwnerBookingInput = {
  businessId: string;
  businessName: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  services: BookingServiceLine[];
  durationMinutes: number;
  totalAmount: Money;
};

// A walk-in is already physically present and being served, so it skips
// pending_payment/confirmed entirely and starts life as in_progress — no
// staff assignment, no deposit, no date/time picking (uses right now).
export function createWalkInBooking(input: CreateOwnerBookingInput): Promise<Booking> {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);

  if (USE_MOCK_API) {
    mockBookingSequence += 1;
    return mockDelay<Booking>({
      ...input,
      bookingId: `booking_mock_${mockBookingSequence}`,
      staffId: null,
      staffName: 'Walk-in',
      date,
      time,
      depositAmount: null,
      status: 'in_progress',
      source: 'walk_in',
      paymentStatus: 'unpaid',
      paymentMethod: null,
      createdAt: now.toISOString(),
    });
  }

  return apiRequest<Booking>('/bookings/walk-in', { method: 'POST', body: input });
}

export type CreateScheduledBookingInput = CreateOwnerBookingInput & {
  date: string;
  time: string;
};

// Owner manually books a future appointment on someone's behalf (Today tab
// "+" → Schedule) — same "in-app-only" caveat as createWalkInBooking, and
// deliberately the same source ('walk_in': owner-recorded, as opposed to
// 'online' via the customer-facing flow) since the only real difference
// from a walk-in is that it starts life as 'confirmed' rather than
// 'in_progress' — the owner still has to check the customer in when they
// arrive.
export function createScheduledBooking(input: CreateScheduledBookingInput): Promise<Booking> {
  if (USE_MOCK_API) {
    mockBookingSequence += 1;
    return mockDelay<Booking>({
      ...input,
      bookingId: `booking_mock_${mockBookingSequence}`,
      staffId: null,
      staffName: 'Any available',
      depositAmount: null,
      status: 'confirmed',
      source: 'walk_in',
      paymentStatus: 'unpaid',
      paymentMethod: null,
      createdAt: new Date().toISOString(),
    });
  }

  return apiRequest<Booking>('/bookings/scheduled', { method: 'POST', body: input });
}

// No corresponding reference/api contract entry yet — same as above. Mocks
// an M-Pesa STK push to the customer's phone for the final service charge,
// separate from confirm-booking-payment's up-front deposit push. Mock-only
// quirk: takes the full booking rather than just an id, same reason as
// confirmBookingPayment below.
export function chargeBookingPayment(booking: Booking, customerPhone: string): Promise<Booking> {
  if (USE_MOCK_API) {
    return mockDelay<Booking>(
      { ...booking, customerPhone, paymentStatus: 'paid', paymentMethod: 'mpesa', status: 'completed' },
      2200,
    );
  }

  return apiRequest<Booking>(`/bookings/${booking.bookingId}/charge`, {
    method: 'POST',
    body: { customerPhone, method: 'mpesa' },
  });
}

// No corresponding reference/api contract entry yet — same as
// chargeBookingPayment, but for cash paid in person: no phone, no push, just
// records the service as paid immediately. Still goes through mockDelay so
// the UI's brief loading state is exercised the same way as every other
// mock write.
export function chargeBookingCash(booking: Booking): Promise<Booking> {
  if (USE_MOCK_API) {
    return mockDelay<Booking>({ ...booking, paymentStatus: 'paid', paymentMethod: 'cash', status: 'completed' });
  }

  return apiRequest<Booking>(`/bookings/${booking.bookingId}/charge`, {
    method: 'POST',
    body: { method: 'cash' },
  });
}

// See reference/api/booking.json#confirm-booking-payment for the contract this implements.
// Mock-only quirk: takes the full booking rather than just an id, since the
// mock layer has no server-side record to look one up from — a real
// implementation looks it up by bookingId instead. No real M-Pesa STK push
// exists yet (see TASKS.md's open "M-Pesa integration decision"); this just
// simulates the push settling successfully after a short delay.
export function confirmBookingPayment(booking: Booking): Promise<Booking> {
  if (USE_MOCK_API) {
    return mockDelay<Booking>({ ...booking, status: 'confirmed' }, 2200);
  }

  return apiRequest<Booking>(`/bookings/${booking.bookingId}/confirm-payment`, { method: 'POST' });
}

import { apiRequest } from './client';
import { mockDelay } from './mock/delay';
import { USE_MOCK_API } from '../config/env';
import type { Booking, BookingServiceLine } from '../types/booking';
import type { Money } from '../types/business';

// See reference/api/booking.json#create-booking for the contract this implements.
export type CreateBookingInput = {
  businessId: string;
  businessName: string;
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
      status: input.depositAmount ? 'pending_payment' : 'confirmed',
      createdAt: new Date().toISOString(),
    });
  }

  return apiRequest<Booking>('/bookings', { method: 'POST', body: input });
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

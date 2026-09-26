import { apiRequest, toQueryString } from './client';
import { mockDelay } from './mock/delay';
import { USE_MOCK_BOOKING, USE_MOCK_FULFILLMENT } from '../config/env';
import type { Booking, BookingServiceLine } from '../types/booking';
import type { Money } from '../types/business';

// See reference/api/booking.json#create-booking for the contract this implements.
// Only what the customer chose: the server prices the booking, fills in
// names/duration/deposit, checks the slot is still free, and (when a deposit
// is due) holds it until expiresAt. staffId null = "Any available".
export type CreateBookingInput = {
  businessId: string;
  staffId: string | null;
  services: { serviceId: string; quantity: number }[];
  date: string; // YYYY-MM-DD, business local
  time: string; // HH:MM, one of get-availability's slots
  notes?: string;
  // The total the customer saw — if prices changed since, the server
  // answers 409 price_changed (with the new totalAmount) instead of booking.
  expectedTotal?: Money;
};

// Mock mode only: the server normally supplies these, so the mock needs the
// draft's names/prices to build a realistic booking.
export type CreateBookingMockContext = {
  businessName: string;
  customerName: string;
  staffName: string;
  lines: BookingServiceLine[];
  depositAmount: Money | null;
};

let mockBookingSequence = 0;

// Plausible-looking M-Pesa receipt number (real ones are ~10 chars,
// uppercase letters + digits) — purely cosmetic, for the transaction-detail
// view (AppointmentDetailScreen) to show something realistic once charged.
function generateMpesaReceipt(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 10; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function createBooking(input: CreateBookingInput, mock?: CreateBookingMockContext): Promise<Booking> {
  if (USE_MOCK_BOOKING) {
    mockBookingSequence += 1;
    const lines = mock?.lines ?? [];
    return mockDelay<Booking>({
      bookingId: `booking_mock_${mockBookingSequence}`,
      reference: `BKMOCK${mockBookingSequence}`,
      businessId: input.businessId,
      businessName: mock?.businessName ?? '',
      customerName: mock?.customerName ?? '',
      customerPhone: null,
      customerEmail: null,
      staffId: input.staffId,
      staffName: mock?.staffName ?? 'Any available',
      services: lines,
      date: input.date,
      time: input.time,
      durationMinutes: lines.reduce((sum, line) => sum + line.durationMinutes * line.quantity, 0),
      totalAmount: { amount: lines.reduce((sum, line) => sum + line.price.amount * line.quantity, 0), currency: 'KES' },
      depositAmount: mock?.depositAmount ?? null,
      status: mock?.depositAmount ? 'pending_payment' : 'confirmed',
      source: 'online',
      paymentStatus: 'unpaid',
      paymentMethod: null,
      paymentReference: null,
      expiresAt: mock?.depositAmount ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null,
      cancelReason: null,
      notes: input.notes ?? null,
      depositPayment: null,
      createdAt: new Date().toISOString(),
    });
  }

  return apiRequest<Booking>('/bookings', { method: 'POST', body: input });
}

// See reference/api/booking.json#get-booking. Also what the STK step will
// poll while a deposit is being paid (BK-31).
export function getBooking(bookingId: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}`);
}

// See reference/api/booking.json#list-my-bookings.
//   upcoming  — pending_payment / confirmed / in_progress not yet over, soonest first
//   past      — completed, no_show, and confirmed ones whose time has passed, newest first
//   cancelled — newest first
export type MyBookingsFilter = 'upcoming' | 'past' | 'cancelled';

export function listMyBookings(
  filter: MyBookingsFilter,
  cursor: string | null = null,
  limit = 20,
): Promise<{ bookings: Booking[]; nextCursor: string | null }> {
  return apiRequest(`/me/bookings?${toQueryString([['filter', filter], ['limit', limit], ['cursor', cursor]])}`);
}

// See reference/api/fulfillment.json#create-walk-in-booking and
// #create-scheduled-booking for the contracts this shared input implements
// — owner-recorded appointments (walk-in or manually scheduled), not part
// of the customer-facing booking flow this file otherwise documents.
export type CreateOwnerBookingInput = {
  businessId: string;
  businessName: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  services: BookingServiceLine[];
  durationMinutes: number;
  totalAmount: Money;
  // staffId is the member's staff record id (TeamInvitation.staffId, same as
  // the profile's staff[].staffId) — only accepted members have one. This is
  // how TeamMemberDetailScreen's earnings know which bookings are theirs.
  // null = "Any available"/unassigned, same as online bookings.
  staffId: string | null;
  staffName: string;
};

// A walk-in is already physically present and being served, so it skips
// pending_payment/confirmed entirely and starts life as in_progress — no
// deposit, no date/time picking (uses right now).
export function createWalkInBooking(input: CreateOwnerBookingInput): Promise<Booking> {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);

  if (USE_MOCK_FULFILLMENT) {
    mockBookingSequence += 1;
    return mockDelay<Booking>({
      ...input,
      bookingId: `booking_mock_${mockBookingSequence}`,
      date,
      time,
      depositAmount: null,
      status: 'in_progress',
      source: 'walk_in',
      paymentStatus: 'unpaid',
      paymentMethod: null,
      paymentReference: null,
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
  if (USE_MOCK_FULFILLMENT) {
    mockBookingSequence += 1;
    return mockDelay<Booking>({
      ...input,
      bookingId: `booking_mock_${mockBookingSequence}`,
      depositAmount: null,
      status: 'confirmed',
      source: 'walk_in',
      paymentStatus: 'unpaid',
      paymentMethod: null,
      paymentReference: null,
      createdAt: new Date().toISOString(),
    });
  }

  return apiRequest<Booking>('/bookings/scheduled', { method: 'POST', body: input });
}

// See reference/api/fulfillment.json#charge-booking for the contract this
// and chargeBookingCash below implement (one endpoint, method-dependent
// body). Mocks an M-Pesa STK push to the customer's phone for the final
// service charge, separate from confirm-booking-payment's up-front deposit
// push. Mock-only quirk: takes the full booking rather than just an id,
// same reason as confirmBookingPayment below.
export function chargeBookingPayment(booking: Booking, customerPhone: string): Promise<Booking> {
  if (USE_MOCK_FULFILLMENT) {
    return mockDelay<Booking>(
      {
        ...booking,
        customerPhone,
        paymentStatus: 'paid',
        paymentMethod: 'mpesa',
        paymentReference: generateMpesaReceipt(),
        status: 'completed',
      },
      2200,
    );
  }

  return apiRequest<Booking>(`/bookings/${booking.bookingId}/charge`, {
    method: 'POST',
    body: { customerPhone, method: 'mpesa' },
  });
}

// See reference/api/fulfillment.json#charge-booking — same endpoint as
// chargeBookingPayment above, but for cash paid in person: no phone, no
// push, just records the service as paid immediately. Still goes through
// mockDelay so the UI's brief loading state is exercised the same way as
// every other mock write.
export function chargeBookingCash(booking: Booking): Promise<Booking> {
  if (USE_MOCK_API) {
    return mockDelay<Booking>({
      ...booking,
      paymentStatus: 'paid',
      paymentMethod: 'cash',
      paymentReference: null,
      status: 'completed',
    });
  }

  return apiRequest<Booking>(`/bookings/${booking.bookingId}/charge`, {
    method: 'POST',
    body: { method: 'cash' },
  });
}

// See reference/api/booking.json#start-booking-payment. Sends the M-Pesa
// prompt for a pending_payment booking's deposit and returns (202) right
// away — the outcome arrives by polling getBooking (see StkPendingScreen).
// phone is optional; the server defaults to the booking's phone.
export type StartPaymentResult = {
  paymentId: string;
  bookingId: string;
  status: 'pending';
  amount: number;
  currency: 'KES';
  phone: string;
  customerMessage: string;
  expiresAt: string | null;
};

export function startBookingPayment(bookingId: string, phone?: string): Promise<StartPaymentResult> {
  return apiRequest<StartPaymentResult>(`/bookings/${bookingId}/payments`, {
    method: 'POST',
    body: phone ? { phone } : {},
  });
}

// Mock mode only (USE_MOCK_BOOKING_PAYMENT) — simulates the deposit
// settling after a short delay. The real flow is startBookingPayment +
// polling getBooking.
export function confirmBookingPayment(booking: Booking): Promise<Booking> {
  return mockDelay<Booking>({ ...booking, status: 'confirmed', paymentStatus: 'deposit_paid', expiresAt: null }, 2200);
}

// See reference/api/fulfillment.json#assign-booking-staff. Owner / front
// desk: give an unassigned ("Any available") booking to someone, or
// reassign it. The server checks they offer every service, work that day
// and are free — 409 staff_unavailable otherwise.
export function assignBookingStaff(booking: Booking, staffId: string, staffName: string): Promise<Booking> {
  if (USE_MOCK_FULFILLMENT) {
    return mockDelay<Booking>({ ...booking, staffId, staffName });
  }

  return apiRequest<Booking>(`/bookings/${booking.bookingId}/staff`, { method: 'PATCH', body: { staffId } });
}

// See reference/api/fulfillment.json#update-booking-status for the contract
// this implements. Covers Appointment Detail's status stepper (check-in →
// in_progress, no-show, cancel) — previously these just mutated
// useBookingsStore's local state directly with no API call at all, unlike
// every other write in the app. Same mock-only "takes the full booking"
// quirk as confirmBookingPayment/chargeBookingPayment above.
export function updateBookingStatus(booking: Booking, status: Booking['status']): Promise<Booking> {
  if (USE_MOCK_FULFILLMENT) {
    return mockDelay<Booking>({ ...booking, status });
  }

  return apiRequest<Booking>(`/bookings/${booking.bookingId}/status`, { method: 'PATCH', body: { status } });
}

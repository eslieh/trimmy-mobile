import { apiRequest, getApiErrorCode, toQueryString } from './client';
import { mockDelay } from './mock/delay';
import { USE_MOCK_BOOKING, USE_MOCK_CHARGE, USE_MOCK_FULFILLMENT } from '../config/env';
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

// See reference/api/fulfillment.json#list-business-bookings. Owner / front
// desk see every booking; staff only their own. Pass one date, or an
// inclusive from/to range (≤62 days). Soonest first. unassigned=true lists
// "Any available" bookings waiting for staff; refund='due' lists every
// booking with a refund owed (no date needed).
export type BusinessBookingsQuery =
  | { date: string; from?: never; to?: never }
  | { from: string; to: string; date?: never }
  | { refund: 'due'; date?: never; from?: never; to?: never };

export function listBusinessBookings(
  businessId: string,
  query: BusinessBookingsQuery & { status?: Booking['status'][]; staffId?: string; unassigned?: boolean },
): Promise<Booking[]> {
  if (USE_MOCK_FULFILLMENT) {
    return mockDelay<Booking[]>([]);
  }

  const qs = toQueryString([
    ['date', query.date],
    ['from', query.from],
    ['to', query.to],
    ['status', query.status?.join(',')],
    ['staffId', query.staffId],
    ['unassigned', query.unassigned ? 'true' : undefined],
    ['refund', 'refund' in query ? query.refund : undefined],
  ]);
  return apiRequest<{ bookings: Booking[] }>(`/businesses/${businessId}/bookings?${qs}`).then((res) => res.bookings);
}

// See reference/api/fulfillment.json#create-walk-in-booking and
// #create-scheduled-booking — owner/front-desk-recorded appointments. Like
// create-booking, only choices go up: the server prices it and fills in
// names and duration. staffId is the member's staffId (null = unassigned);
// the server checks they're free. source is 'walk_in' for both.
export type CreateOwnerBookingInput = {
  businessId: string;
  customerName: string; // server defaults to 'Walk-in customer' when blank
  customerPhone: string | null;
  customerEmail: string | null;
  services: { serviceId: string; quantity: number }[];
  staffId: string | null;
  notes?: string | null;
};

// Mock mode only: what the server would otherwise fill in.
export type OwnerBookingMockContext = {
  businessName: string;
  staffName: string;
  lines: BookingServiceLine[];
};

function mockOwnerBooking(
  input: CreateOwnerBookingInput,
  mock: OwnerBookingMockContext | undefined,
  fields: Pick<Booking, 'date' | 'time' | 'status'>,
): Booking {
  mockBookingSequence += 1;
  const lines = mock?.lines ?? [];
  return {
    bookingId: `booking_mock_${mockBookingSequence}`,
    businessId: input.businessId,
    businessName: mock?.businessName ?? '',
    customerName: input.customerName || 'Walk-in customer',
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    staffId: input.staffId,
    staffName: mock?.staffName ?? 'Any available',
    services: lines,
    durationMinutes: lines.reduce((sum, line) => sum + line.durationMinutes * line.quantity, 0),
    totalAmount: { amount: lines.reduce((sum, line) => sum + line.price.amount * line.quantity, 0), currency: 'KES' },
    depositAmount: null,
    source: 'walk_in',
    paymentStatus: 'unpaid',
    paymentMethod: null,
    paymentReference: null,
    createdAt: new Date().toISOString(),
    notes: input.notes ?? null,
    ...fields,
  };
}

// The customer is here now: the server stamps the current time and starts
// it in_progress (no deposit). 409 slot_unavailable if the chosen staff
// member isn't free right now.
export function createWalkInBooking(input: CreateOwnerBookingInput, mock?: OwnerBookingMockContext): Promise<Booking> {
  if (USE_MOCK_FULFILLMENT) {
    const now = new Date();
    return mockDelay(
      mockOwnerBooking(input, mock, {
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
        status: 'in_progress',
      }),
    );
  }

  return apiRequest<Booking>('/bookings/walk-in', { method: 'POST', body: input });
}

export type CreateScheduledBookingInput = CreateOwnerBookingInput & {
  date: string;
  time: string;
};

// Book on a customer's behalf: starts confirmed, no deposit. Must be in the
// future and within working hours, but may be off the customer slot grid
// and needs no lead time.
export function createScheduledBooking(
  input: CreateScheduledBookingInput,
  mock?: OwnerBookingMockContext,
): Promise<Booking> {
  if (USE_MOCK_FULFILLMENT) {
    return mockDelay(mockOwnerBooking(input, mock, { date: input.date, time: input.time, status: 'confirmed' }));
  }

  return apiRequest<Booking>('/bookings/scheduled', { method: 'POST', body: input });
}

// See reference/api/fulfillment.json#charge-booking (requested — not built
// yet, so USE_MOCK_CHARGE is on). The final charge at checkout for an
// in_progress booking: the balance after any deposit. Works like the
// deposit: M-Pesa answers 202 at once, then we poll the booking until it's
// paid (status completed) or chargePayment failed / timed out.
const CHARGE_POLL_INTERVAL_MS = 3000;
const CHARGE_POLL_LIMIT_MS = 2 * 60 * 1000;

export class ChargeFailedError extends Error {
  failureReason: string;

  constructor(failureReason: string) {
    super(failureReason);
    this.failureReason = failureReason;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCharge(bookingId: string): Promise<Booking> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < CHARGE_POLL_LIMIT_MS) {
    await sleep(CHARGE_POLL_INTERVAL_MS);
    const booking = await getBooking(bookingId).catch(() => null); // a dropped poll isn't an outcome
    if (!booking) continue;
    if (booking.paymentStatus === 'paid') return booking;
    const attempt = booking.chargePayment;
    if (attempt && (attempt.status === 'failed' || attempt.status === 'timeout')) {
      throw new ChargeFailedError(attempt.failureReason ?? attempt.status);
    }
  }
  throw new ChargeFailedError('timeout');
}

// Throws ChargeFailedError (failureReason: cancelled, insufficient_funds,
// wrong_pin, timeout, …) when the customer doesn't complete the prompt, or
// an ApiError when the prompt couldn't be sent. On payment_in_progress it
// keeps waiting on the prompt already out instead of sending another.
export async function chargeBookingPayment(booking: Booking, customerPhone: string): Promise<Booking> {
  if (USE_MOCK_CHARGE) {
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

  try {
    const res = await apiRequest<Booking | { paymentId: string }>(`/bookings/${booking.bookingId}/charge`, {
      method: 'POST',
      body: { method: 'mpesa', phone: customerPhone },
    });
    // Nothing left to pay (deposit covered it) completes immediately.
    if ('bookingId' in res && 'status' in res && res.status === 'completed') return res as Booking;
  } catch (err) {
    if (getApiErrorCode(err) !== 'payment_in_progress') throw err;
  }
  return waitForCharge(booking.bookingId);
}

// Same endpoint, cash paid in person: recorded immediately.
export function chargeBookingCash(booking: Booking): Promise<Booking> {
  if (USE_MOCK_CHARGE) {
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
// Returns the whole Booking. Cancelling here is the business cancelling
// (cancelReason 'business' unless a reason is sent), which makes any paid
// deposit refundable. no_show only after the start time; staff may set
// in_progress / completed on their own bookings.
export function updateBookingStatus(booking: Booking, status: Booking['status'], reason?: string): Promise<Booking> {
  if (USE_MOCK_FULFILLMENT) {
    return mockDelay<Booking>({ ...booking, status });
  }

  return apiRequest<Booking>(`/bookings/${booking.bookingId}/status`, {
    method: 'PATCH',
    body: { status, reason: reason ?? null },
  });
}

// See reference/api/booking.json#cancel-preview / #cancel-booking (BK-60).
// Deposits sit in the business's own account, so any refund is paid back
// by the business by hand (see markBookingRefunded).
export type CancelPreview = {
  bookingId: string;
  canCancel: boolean;
  reasonBlocked: string | null;
  freeUntil: string;
  withinFreeWindow: boolean;
  depositPaid: Money;
  fee: Money;
  refund: Money;
  lateFeePercent: number;
  message: string; // show as-is
};

export function getCancelPreview(bookingId: string): Promise<CancelPreview> {
  return apiRequest<CancelPreview>(`/bookings/${bookingId}/cancel-preview`);
}

// Customer cancels with the outcome the preview showed. 409 cannot_cancel
// once the appointment has started.
export function cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/cancel`, {
    method: 'POST',
    body: { reason: reason ?? null },
  });
}

// Owner / front desk: record that the business has sent back a refund it
// owed. reference is optional (e.g. the refund's M-Pesa code).
export function markBookingRefunded(bookingId: string, reference?: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/refund`, {
    method: 'POST',
    body: { reference: reference || null },
  });
}

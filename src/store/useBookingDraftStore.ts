import { create } from 'zustand';
import type { Booking, BookingServiceLine } from '../types/booking';

type BookingDraftState = {
  businessId: string | null;
  businessName: string;
  services: BookingServiceLine[];
  staffId: string | null; // null = "Any available"
  staffName: string;
  date: string | null;
  time: string | null;
  paymentPhone: string; // E.164, entered on PaymentMethodScreen — shown on the STK pending/confirmed screens
  currentBooking: Booking | null;
  startDraft: (businessId: string, businessName: string, services: BookingServiceLine[]) => void;
  setStaff: (staffId: string | null, staffName: string) => void;
  setDateTime: (date: string, time: string) => void;
  setPaymentPhone: (phone: string) => void;
  setCurrentBooking: (booking: Booking | null) => void;
  reset: () => void;
};

const emptyDraft = {
  businessId: null,
  businessName: '',
  services: [] as BookingServiceLine[],
  staffId: null,
  staffName: '',
  date: null,
  time: null,
  paymentPhone: '',
  currentBooking: null,
};

// Client-only, in-progress state for the C2 booking flow (Select Staff →
// Date & Time → Review & Policies → Payment) — cleared once a booking is
// created (see useBookingsStore for the resulting list).
export const useBookingDraftStore = create<BookingDraftState>((set) => ({
  ...emptyDraft,
  startDraft: (businessId, businessName, services) => set({ ...emptyDraft, businessId, businessName, services }),
  setStaff: (staffId, staffName) => set({ staffId, staffName }),
  setDateTime: (date, time) => set({ date, time }),
  setPaymentPhone: (paymentPhone) => set({ paymentPhone }),
  setCurrentBooking: (currentBooking) => set({ currentBooking }),
  reset: () => set({ ...emptyDraft }),
}));

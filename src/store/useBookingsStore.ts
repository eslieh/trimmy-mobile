import { create } from 'zustand';
import type { Booking } from '../types/booking';

type BookingsState = {
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  updateBooking: (booking: Booking) => void;
  // Upsert one booking fetched from the server (e.g. get-booking).
  upsertBooking: (booking: Booking) => void;
  // Server → cache for one business over an inclusive date range: drops
  // that business's cached bookings in the range, then adds what the
  // server returned. See hooks/useSyncBusinessBookings.
  replaceBusinessRange: (businessId: string, from: string, to: string, bookings: Booking[]) => void;
};

// Client-only, in-memory — no "my bookings" endpoint exists yet, so this is
// what ActivityScreen reads instead of the real thing. Resets on app
// restart, same caveat as useFavoritesStore/useCartStore.
export const useBookingsStore = create<BookingsState>((set) => ({
  bookings: [],
  addBooking: (booking) => set((state) => ({ bookings: [booking, ...state.bookings] })),
  updateBooking: (booking) =>
    set((state) => ({
      bookings: state.bookings.map((b) => (b.bookingId === booking.bookingId ? booking : b)),
    })),
  upsertBooking: (booking) =>
    set((state) => ({
      bookings: state.bookings.some((b) => b.bookingId === booking.bookingId)
        ? state.bookings.map((b) => (b.bookingId === booking.bookingId ? booking : b))
        : [booking, ...state.bookings],
    })),
  replaceBusinessRange: (businessId, from, to, fetched) =>
    set((state) => {
      const fetchedIds = new Set(fetched.map((b) => b.bookingId));
      const kept = state.bookings.filter(
        (b) =>
          !fetchedIds.has(b.bookingId) && !(b.businessId === businessId && b.date >= from && b.date <= to),
      );
      return { bookings: [...fetched, ...kept] };
    }),
}));

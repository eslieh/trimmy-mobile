import { create } from 'zustand';
import type { Booking } from '../types/booking';

type BookingsState = {
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  updateBooking: (booking: Booking) => void;
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
}));

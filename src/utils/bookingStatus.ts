import { colors } from '../theme';
import type { BookingStatus } from '../types/booking';

// Shared by the customer-side Activity list/Booking Detail and the
// business-owner Today Timeline/Appointment Detail — one status vocabulary,
// not three copies drifting apart.
export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending_payment: 'Payment pending',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  no_show: 'No-show',
  cancelled: 'Cancelled',
};

export const BOOKING_STATUS_COLOR: Record<BookingStatus, string> = {
  pending_payment: colors.feedback.warning,
  confirmed: colors.feedback.success,
  in_progress: colors.brand.purple,
  completed: colors.feedback.success,
  no_show: colors.feedback.danger,
  cancelled: colors.feedback.danger,
};
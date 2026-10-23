import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { updateBookingStatus } from '../api/booking';
import { QuickActionsSheet } from '../components/ui/QuickActionsSheet';
import type { SwipeAction } from '../components/ui/SwipeRow';
import { useBookingsStore } from '../store/useBookingsStore';
import { useOwnedBusinessStore } from '../store/useOwnedBusinessStore';
import { colors } from '../theme';
import type { Booking, BookingStatus } from '../types/booking';
import { successHaptic, tapHaptic } from '../utils/haptics';
import { showApiError } from '../utils/showApiError';

// The quick actions for an appointment row (swipe left, or long-press):
// the same steps as the Appointment screen's footer, without opening it.
// Staff start and finish their own; owner / front desk also charge, mark a
// no-show and cancel. Cancel always asks first. Charging opens the
// appointment with its charge sheet up (it needs a phone number and a tip).
// One long-press menu per screen: render `menu` once, call openMenu(booking).
export function useAppointmentActions() {
  const router = useRouter();
  const updateBooking = useBookingsStore((s) => s.updateBooking);
  const isStaffView = useOwnedBusinessStore((s) => s.activeMode === 'staff');

  const setStatus = useCallback(
    async (booking: Booking, status: BookingStatus) => {
      try {
        updateBooking(await updateBookingStatus(booking, status));
        successHaptic();
      } catch (err) {
        showApiError("Couldn't update this appointment", err);
      }
    },
    [updateBooking],
  );

  const actionsFor = useCallback(
    (booking: Booking): SwipeAction[] => {
      const actions: SwipeAction[] = [];
      const unpaid = booking.paymentStatus !== 'paid';
      if (booking.status === 'confirmed') {
        actions.push({ key: 'start', label: isStaffView ? 'Start' : 'Check in', color: colors.feedback.success, onPress: () => setStatus(booking, 'in_progress') });
      }
      if (booking.status === 'in_progress') {
        actions.push({ key: 'done', label: 'Done', color: colors.feedback.success, onPress: () => setStatus(booking, 'completed') });
      }
      if (isStaffView) return actions;
      if ((booking.status === 'in_progress' || booking.status === 'completed') && unpaid) {
        actions.push({
          key: 'charge',
          label: 'Charge',
          color: colors.brand.pink,
          onPress: () => router.push({ pathname: '/appointment/[bookingId]', params: { bookingId: booking.bookingId, charge: '1' } }),
        });
      }
      if (booking.status === 'confirmed') {
        // The server only takes a no-show once the start time has passed.
        if (new Date(`${booking.date}T${booking.time}`) <= new Date()) {
          actions.push({ key: 'no-show', label: 'No-show', color: colors.text.secondary, onPress: () => setStatus(booking, 'no_show') });
        }
        actions.push({
          key: 'cancel',
          label: 'Cancel',
          color: colors.feedback.danger,
          onPress: () =>
            Alert.alert(`Cancel ${booking.customerName}'s appointment?`, 'They’ll be told, and any deposit becomes a refund owed.', [
              { text: 'Keep it', style: 'cancel' },
              { text: 'Cancel appointment', style: 'destructive', onPress: () => setStatus(booking, 'cancelled') },
            ]),
        });
      }
      return actions;
    },
    [isStaffView, router, setStatus],
  );

  const [menuFor, setMenuFor] = useState<Booking | null>(null);
  const openMenu = useCallback(
    (booking: Booking) => {
      if (!actionsFor(booking).length) return;
      tapHaptic();
      setMenuFor(booking);
    },
    [actionsFor],
  );
  const menu = (
    <QuickActionsSheet
      title={menuFor ? menuFor.customerName : null}
      actions={menuFor ? actionsFor(menuFor) : []}
      onClose={() => setMenuFor(null)}
    />
  );

  return { actionsFor, openMenu, menu };
}

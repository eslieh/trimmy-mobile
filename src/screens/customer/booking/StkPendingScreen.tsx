import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../../components/Button';
import { confirmBookingPayment, getBooking } from '../../../api/booking';
import { USE_MOCK_BOOKING_PAYMENT } from '../../../config/env';
import { useBookingDraftStore } from '../../../store/useBookingDraftStore';
import { useBookingsStore } from '../../../store/useBookingsStore';
import { useCartStore } from '../../../store/useCartStore';
import { colors, spacing, typography } from '../../../theme';
import type { Booking } from '../../../types/booking';

const POLL_INTERVAL_MS = 3000;
const POLL_LIMIT_MS = 2 * 60 * 1000;

// Terminal states that need the customer's attention on this screen.
type Outcome = 'lateRefund' | 'expired' | 'stillWaiting' | null;

// After the M-Pesa prompt is sent (PaymentMethodScreen), poll the booking
// every 3s for up to ~2 min and route on the result (BK-31/32):
//   confirmed                              → Booking Confirmed
//   depositPayment failed / timeout        → back to Payment Method, reason shown
//   cancelled + deposit_paid (paid late,   → refund message (business refunds manually)
//     slot already taken)
//   cancelled otherwise (hold ran out)     → book again
export function StkPendingScreen() {
  const router = useRouter();
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const currentBooking = useBookingDraftStore((s) => s.currentBooking);
  const paymentPhone = useBookingDraftStore((s) => s.paymentPhone);
  const setCurrentBooking = useBookingDraftStore((s) => s.setCurrentBooking);
  const addBooking = useBookingsStore((s) => s.addBooking);
  const clearCart = useCartStore((s) => s.clear);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [pollRound, setPollRound] = useState(0);
  const settledRef = useRef(false);

  const finishConfirmed = useCallback(
    (booking: Booking) => {
      setCurrentBooking(booking);
      addBooking(booking);
      clearCart();
      router.replace(`/business/${businessId}/book/confirmed`);
    },
    [businessId, router, setCurrentBooking, addBooking, clearCart],
  );

  const bookingId = currentBooking?.bookingId;

  useEffect(() => {
    if (!currentBooking || settledRef.current) return;

    if (USE_MOCK_BOOKING_PAYMENT) {
      settledRef.current = true;
      confirmBookingPayment(currentBooking).then(finishConfirmed);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const booking = await getBooking(currentBooking.bookingId);
        if (cancelled) return;
        setCurrentBooking(booking);

        if (booking.status === 'confirmed') {
          settledRef.current = true;
          finishConfirmed(booking);
          return;
        }
        if (booking.status === 'cancelled') {
          settledRef.current = true;
          setOutcome(booking.paymentStatus === 'deposit_paid' ? 'lateRefund' : 'expired');
          return;
        }
        const payment = booking.depositPayment;
        if (payment && (payment.status === 'failed' || payment.status === 'timeout')) {
          settledRef.current = true;
          router.replace(
            `/business/${businessId}/book/payment?failure=${encodeURIComponent(payment.failureReason ?? payment.status)}`,
          );
          return;
        }
      } catch {
        // A dropped request mid-poll isn't an outcome — keep trying.
      }
      if (Date.now() - startedAt >= POLL_LIMIT_MS) {
        setOutcome('stillWaiting');
        return;
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    timer = setTimeout(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // pollRound restarts polling after "Check again".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, pollRound]);

  if (outcome === 'lateRefund') {
    return (
      <OutcomeView
        title="Payment arrived too late"
        body="Your payment arrived after the booking expired, and the slot has since been taken. The business will refund you."
        primary={{ label: 'Pick another time', onPress: () => router.replace(`/business/${businessId}/book/datetime`) }}
      />
    );
  }
  if (outcome === 'expired') {
    return (
      <OutcomeView
        title="Your slot hold expired"
        body="The deposit wasn't paid in time, so the slot was released. Pick a time again to book."
        primary={{ label: 'Pick another time', onPress: () => router.replace(`/business/${businessId}/book/datetime`) }}
      />
    );
  }
  if (outcome === 'stillWaiting') {
    return (
      <OutcomeView
        title="Still waiting for M-Pesa"
        body="We haven't heard back about your payment yet. If you paid, check again in a moment."
        primary={{
          label: 'Check again',
          onPress: () => {
            setOutcome(null);
            setPollRound((n) => n + 1);
          },
        }}
        secondary={{
          label: 'Send a new prompt',
          onPress: () => router.replace(`/business/${businessId}/book/payment?failure=timeout`),
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.brand.purple} />
        <Text style={styles.title}>Check your phone</Text>
        <Text style={styles.subtitle}>
          {paymentPhone
            ? `We sent an M-Pesa payment prompt to ${paymentPhone}. Enter your PIN to confirm.`
            : 'Confirming your payment...'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

interface OutcomeViewProps {
  title: string;
  body: string;
  primary: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
}

function OutcomeView({ title, body, primary, secondary }: OutcomeViewProps) {
  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{body}</Text>
      </View>
      <View style={styles.footer}>
        <Button label={primary.label} onPress={primary.onPress} />
        {secondary ? <Button label={secondary.label} variant="secondary" onPress={secondary.onPress} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

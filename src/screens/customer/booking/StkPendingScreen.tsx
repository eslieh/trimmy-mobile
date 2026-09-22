import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { confirmBookingPayment } from '../../../api/booking';
import { useBookingDraftStore } from '../../../store/useBookingDraftStore';
import { useBookingsStore } from '../../../store/useBookingsStore';
import { useCartStore } from '../../../store/useCartStore';
import { colors, spacing, typography } from '../../../theme';

// No real M-Pesa integration exists yet (see TASKS.md's open "STK push
// integration decision") — this simulates the push settling successfully
// after a short delay rather than polling a real payment status endpoint.
export function StkPendingScreen() {
  const router = useRouter();
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const currentBooking = useBookingDraftStore((s) => s.currentBooking);
  const paymentPhone = useBookingDraftStore((s) => s.paymentPhone);
  const setCurrentBooking = useBookingDraftStore((s) => s.setCurrentBooking);
  const addBooking = useBookingsStore((s) => s.addBooking);
  const clearCart = useCartStore((s) => s.clear);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!currentBooking || startedRef.current) return;
    startedRef.current = true;

    confirmBookingPayment(currentBooking).then((confirmed) => {
      setCurrentBooking(confirmed);
      addBooking(confirmed);
      clearCart();
      router.replace(`/business/${businessId}/book/confirmed`);
    });
  }, [currentBooking, businessId, router, setCurrentBooking, addBooking, clearCart]);

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
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

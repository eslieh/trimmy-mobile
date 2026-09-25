import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { PhoneInput } from '../../components/PhoneInput';
import { CheckIcon } from '../../components/icons/CheckIcon';
import { PhoneIcon } from '../../components/icons/PhoneIcon';
import { chargeBookingCash, chargeBookingPayment, updateBookingStatus } from '../../api/booking';
import { useBookingsStore } from '../../store/useBookingsStore';
import { BOOKING_STATUS_COLOR, BOOKING_STATUS_LABEL } from '../../utils/bookingStatus';
import { formatBookingDateLong } from '../../utils/date';
import { countries } from '../../data/countries';
import { normalizePhoneNumber } from '../../utils/phone';
import { colors, radii, shadows, springs, spacing, typography } from '../../theme';
import type { BookingStatus, PaymentMethod } from '../../types/booking';

const DEFAULT_COUNTRY = countries.find((c) => c.iso2 === 'KE') ?? countries[0];
const SUCCESS_DISMISS_DELAY = 1600;

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  mpesa: 'M-Pesa',
  cash: 'Cash',
};

const PAYMENT_SUCCESS_TITLE: Record<PaymentMethod, string> = {
  mpesa: 'M-Pesa payment received',
  cash: 'Cash payment recorded',
};

type ChargeStep = 'form' | 'pending' | 'success';

// Reached from TodayTimelineScreen. Deliberately not built: client history,
// preferences/reference images, special-instructions callout, post-service
// notes modal — none of that data is modeled anywhere in the app yet (no
// per-client profile concept exists). Just the status stepper, summary, and
// (once in_progress) the charge-customer flow.
export function AppointmentDetailScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const booking = useBookingsStore((s) => s.bookings.find((b) => b.bookingId === bookingId));
  const updateBooking = useBookingsStore((s) => s.updateBooking);

  const [chargeSheetVisible, setChargeSheetVisible] = useState(false);
  const [chargeMethod, setChargeMethod] = useState<PaymentMethod>('mpesa');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [rawPhone, setRawPhone] = useState('');
  const [chargeStep, setChargeStep] = useState<ChargeStep>('form');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  if (!booking) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <BackButton onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const setStatus = async (status: BookingStatus) => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    const updated = await updateBookingStatus(booking, status);
    updateBooking(updated);
    setIsUpdatingStatus(false);
  };

  const handleCall = () => {
    if (booking.customerPhone) Linking.openURL(`tel:${booking.customerPhone}`);
  };

  const closeChargeSheet = () => {
    if (chargeStep === 'pending') return;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setChargeSheetVisible(false);
    setChargeStep('form');
    setChargeMethod('mpesa');
    setRawPhone('');
  };

  const finishWithSuccess = (charged: Parameters<typeof updateBooking>[0]) => {
    updateBooking(charged);
    setChargeStep('success');
    dismissTimer.current = setTimeout(closeChargeSheet, SUCCESS_DISMISS_DELAY);
  };

  const handleSendChargeRequest = async () => {
    if (rawPhone.length < 4) return;
    setChargeStep('pending');
    const phone = normalizePhoneNumber(rawPhone, country);
    const charged = await chargeBookingPayment(booking, phone);
    finishWithSuccess(charged);
  };

  const handleChargeCash = async () => {
    setChargeStep('pending');
    const charged = await chargeBookingCash(booking);
    finishWithSuccess(charged);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Appointment</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.customerName}>{booking.customerName}</Text>
          <View style={styles.summaryBadges}>
            {booking.paymentStatus === 'paid' ? (
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>
                  Paid{booking.paymentMethod ? ` · ${PAYMENT_METHOD_LABEL[booking.paymentMethod]}` : ''}
                </Text>
              </View>
            ) : null}
            <Text style={[styles.status, { color: BOOKING_STATUS_COLOR[booking.status] }]}>
              {BOOKING_STATUS_LABEL[booking.status]}
            </Text>
          </View>
        </View>

        {booking.customerPhone || booking.customerEmail ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Customer</Text>
            <View style={styles.customerRow}>
              <View style={styles.customerContactLines}>
                {booking.customerPhone ? <Text style={styles.cardValue}>{booking.customerPhone}</Text> : null}
                {booking.customerEmail ? <Text style={styles.cardValue}>{booking.customerEmail}</Text> : null}
              </View>
              {booking.customerPhone ? (
                <Pressable style={styles.callButton} onPress={handleCall} hitSlop={8}>
                  <PhoneIcon size={16} color={colors.white} />
                  <Text style={styles.callButtonText}>Call</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Date & time</Text>
          <Text style={styles.cardValue}>{formatBookingDateLong(booking.date)}</Text>
          <Text style={styles.cardValue}>{booking.time}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Services</Text>
          {booking.services.map((service) => (
            <View key={service.serviceId} style={styles.serviceLine}>
              <Text style={styles.serviceLineName}>
                {service.quantity > 1 ? `${service.quantity}× ` : ''}
                {service.name}
              </Text>
              <Text style={styles.serviceLinePrice}>KSh {service.price.amount * service.quantity}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>KSh {booking.totalAmount.amount}</Text>
          </View>
        </View>

        {booking.paymentStatus === 'paid' && booking.paymentMethod ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Payment</Text>
            <Text style={styles.cardValue}>{PAYMENT_METHOD_LABEL[booking.paymentMethod]}</Text>
            <Text style={styles.cardValue}>KSh {booking.totalAmount.amount} paid</Text>
            {booking.paymentReference ? (
              <Text style={styles.cardValueMuted}>M-Pesa ref: {booking.paymentReference}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Staff</Text>
          <Text style={styles.cardValue}>{booking.staffName}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {booking.status === 'confirmed' ? (
          <>
            <Button label="Check in" disabled={isUpdatingStatus} onPress={() => setStatus('in_progress')} />
            <View style={styles.footerRow}>
              <Button
                label="No-show"
                variant="secondary"
                disabled={isUpdatingStatus}
                onPress={() => setStatus('no_show')}
                style={styles.footerHalf}
              />
              <Button
                label="Cancel"
                variant="secondary"
                disabled={isUpdatingStatus}
                onPress={() => setStatus('cancelled')}
                style={styles.footerHalf}
              />
            </View>
          </>
        ) : null}
        {booking.status === 'in_progress' ? (
          <Button label="Charge customer" onPress={() => setChargeSheetVisible(true)} />
        ) : null}
      </View>

      <Modal visible={chargeSheetVisible} transparent animationType="slide" onRequestClose={closeChargeSheet}>
        <Pressable style={styles.overlay} onPress={closeChargeSheet}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {chargeStep === 'pending' ? (
              <View style={styles.chargingState}>
                <ActivityIndicator size="large" color={colors.brand.purple} />
                {chargeMethod === 'mpesa' ? (
                  <>
                    <Text style={styles.chargingTitle}>Check their phone</Text>
                    <Text style={styles.chargingSubtitle}>
                      We sent an M-Pesa payment prompt to{' '}
                      {rawPhone ? `+${country.dialCode}${rawPhone}` : 'their number'}. Waiting for them to enter
                      their PIN.
                    </Text>
                  </>
                ) : (
                  <Text style={styles.chargingTitle}>Recording payment…</Text>
                )}
              </View>
            ) : chargeStep === 'success' ? (
              <ChargeSuccessState method={chargeMethod} amount={booking.totalAmount.amount} />
            ) : (
              <>
                <Text style={styles.sheetTitle}>Charge customer</Text>
                <Text style={styles.sheetSubtitle}>
                  KSh {booking.totalAmount.amount} for {booking.customerName}
                </Text>

                <View style={styles.methodRow}>
                  {(['mpesa', 'cash'] as const).map((method) => {
                    const selected = chargeMethod === method;
                    return (
                      <Pressable
                        key={method}
                        style={[styles.methodPill, selected && styles.methodPillSelected]}
                        onPress={() => setChargeMethod(method)}
                      >
                        <Text style={[styles.methodPillText, selected && styles.methodPillTextSelected]}>
                          {PAYMENT_METHOD_LABEL[method]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {chargeMethod === 'mpesa' ? (
                  <>
                    <PhoneInput
                      label="Customer phone"
                      country={country}
                      onCountryChange={setCountry}
                      value={rawPhone}
                      onChangeText={setRawPhone}
                    />
                    <Button
                      label="Send payment request"
                      disabled={rawPhone.length < 4}
                      onPress={handleSendChargeRequest}
                      style={styles.sheetButton}
                    />
                  </>
                ) : (
                  <Button label="Mark as paid (cash)" onPress={handleChargeCash} style={styles.sheetButton} />
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

interface ChargeSuccessStateProps {
  method: PaymentMethod;
  amount: number;
}

// Spring-pops the checkmark in rather than just appearing, matching the
// bouncy-spring convention used for other confirmation moments (e.g.
// AnimatedFavoriteHeart) instead of a flat fade.
function ChargeSuccessState({ method, amount }: ChargeSuccessStateProps) {
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withSpring(1, springs.bouncy);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.successState}>
      <Animated.View style={animatedStyle}>
        <CheckIcon size={72} />
      </Animated.View>
      <Text style={styles.chargingTitle}>{PAYMENT_SUCCESS_TITLE[method]}</Text>
      <Text style={styles.chargingSubtitle}>KSh {amount} recorded for this appointment.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    ...shadows.card,
  },
  customerName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  summaryBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paidBadge: {
    borderRadius: radii.pill,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  paidBadgeText: {
    ...typography.caption,
    color: colors.feedback.success,
  },
  status: {
    ...typography.bodyMedium,
  },
  card: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.card,
  },
  cardLabel: {
    ...typography.label,
    color: colors.text.secondary,
  },
  cardValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  cardValueMuted: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  customerContactLines: {
    flex: 1,
    gap: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.brand.purple,
  },
  callButtonText: {
    ...typography.bodyMedium,
    color: colors.white,
  },
  serviceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceLineName: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  serviceLinePrice: {
    ...typography.body,
    color: colors.text.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  totalLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  totalValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    gap: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerHalf: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  sheetTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  sheetSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: -spacing.sm,
  },
  methodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  methodPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.pill.unselectedBg,
  },
  methodPillSelected: {
    backgroundColor: colors.pill.selectedBg,
  },
  methodPillText: {
    ...typography.bodyMedium,
    color: colors.pill.unselectedText,
  },
  methodPillTextSelected: {
    color: colors.pill.selectedText,
  },
  sheetButton: {
    marginTop: spacing.sm,
  },
  chargingState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  chargingTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  chargingSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  successState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
});

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
import {
  assignBookingStaff,
  ChargeFailedError,
  chargeBookingCash,
  chargeBookingPayment,
  getBooking,
  rescheduleBooking,
  updateBookingStatus,
} from '../../api/booking';
import { DatePickerField } from '../../components/DatePickerField';
import { TimePickerField } from '../../components/TimePickerField';
import { depositFailureMessage } from '../../utils/depositPayment';
import { MarkRefundedSheet } from '../../components/MarkRefundedSheet';
import { showApiError } from '../../utils/showApiError';
import { getApiErrorCode, getApiErrorMessage } from '../../api/client';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { bookableStaff, teamMemberDisplayName } from '../../utils/team';
import { useBookingsStore } from '../../store/useBookingsStore';
import { BOOKING_STATUS_COLOR, BOOKING_STATUS_LABEL } from '../../utils/bookingStatus';
import { formatBookingDateLong } from '../../utils/date';
import { countries } from '../../data/countries';
import { normalizePhoneNumber } from '../../utils/phone';
import { colors, radii, shadows, springs, spacing, typography } from '../../theme';
import type { BookingStatus, PaymentMethod } from '../../types/booking';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';

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
  const upsertBooking = useBookingsStore((s) => s.upsertBooking);
  const [refundSheetVisible, setRefundSheetVisible] = useState(false);
  const [chargeError, setChargeError] = useState('');
  // Owner / front desk reschedule: any future time within working hours,
  // off the customer slot grid allowed (BK-61).
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  // Always refresh from the server — this may be opened from a list that
  // hasn't cached the booking (e.g. Unassigned or Refunds owed).
  useEffect(() => {
    getBooking(bookingId).then(upsertBooking).catch(() => {});
  }, [bookingId, upsertBooking]);

  const [chargeSheetVisible, setChargeSheetVisible] = useState(false);
  const [chargeMethod, setChargeMethod] = useState<PaymentMethod>('mpesa');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [rawPhone, setRawPhone] = useState('');
  const [chargeStep, setChargeStep] = useState<ChargeStep>('form');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const invitations = useBusinessOnboardingStore((s) => s.invitations);
  // Staff open this same screen from their own schedule, but can only start
  // their own appointments — no charging, assigning, refunds, no-shows or
  // cancelling (the server 403s those for staff).
  const isStaffView = useOwnedBusinessStore((s) => s.activeMode === 'staff');
  const [assignSheetVisible, setAssignSheetVisible] = useState(false);
  const [assigningStaffId, setAssigningStaffId] = useState<string | null>(null);
  const [assignError, setAssignError] = useState('');
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
    try {
      // Returns the whole Booking — e.g. a business cancellation comes back
      // with any paid deposit marked as a refund owed.
      const updated = await updateBookingStatus(booking, status);
      updateBooking(updated);
    } catch (err) {
      showApiError("Couldn't update this appointment", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Only active bookings can be (re)assigned; the server checks the rest
  // (offers the services, works that day, is free).
  const canAssign = !isStaffView && ['pending_payment', 'confirmed', 'in_progress'].includes(booking.status);
  const assignableStaff = bookableStaff(invitations);

  const handleAssign = async (staffId: string, staffName: string) => {
    setAssigningStaffId(staffId);
    setAssignError('');
    try {
      const updated = await assignBookingStaff(booking, staffId, staffName);
      updateBooking(updated);
      setAssignSheetVisible(false);
    } catch (err) {
      // staff_unavailable: keep the picker open so they can choose someone else.
      setAssignError(
        getApiErrorCode(err) === 'staff_unavailable'
          ? `${staffName} can't take this booking — busy, off that day, or doesn't offer the service. Choose someone else.`
          : getApiErrorMessage(err, "Couldn't assign staff. Please try again."),
      );
    } finally {
      setAssigningStaffId(null);
    }
  };

  const canReschedule = !isStaffView && (booking.status === 'confirmed' || booking.status === 'pending_payment');

  const openReschedule = () => {
    setNewDate(booking.date);
    setNewTime(booking.time);
    setRescheduleError('');
    setRescheduleVisible(true);
  };

  const handleReschedule = async () => {
    setRescheduling(true);
    setRescheduleError('');
    try {
      // staffId omitted keeps whoever is assigned; the server checks they're free.
      updateBooking(await rescheduleBooking(booking.bookingId, { date: newDate, time: newTime }));
      setRescheduleVisible(false);
    } catch (err) {
      setRescheduleError(getApiErrorMessage(err, "Couldn't move this appointment."));
    } finally {
      setRescheduling(false);
    }
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
    setChargeError('');
    setRawPhone('');
  };

  const finishWithSuccess = (charged: Parameters<typeof updateBooking>[0]) => {
    updateBooking(charged);
    setChargeStep('success');
    dismissTimer.current = setTimeout(closeChargeSheet, SUCCESS_DISMISS_DELAY);
  };

  // Back to the form with the reason — the owner can re-prompt or take cash.
  const failCharge = (err: unknown) => {
    setChargeError(
      err instanceof ChargeFailedError
        ? `${depositFailureMessage(err.failureReason)} Try again or take cash.`
        : getApiErrorMessage(err, "Couldn't charge the customer. Please try again."),
    );
    setChargeStep('form');
  };

  const handleSendChargeRequest = async () => {
    if (rawPhone.length < 4) return;
    setChargeError('');
    setChargeStep('pending');
    try {
      const charged = await chargeBookingPayment(booking, normalizePhoneNumber(rawPhone, country));
      finishWithSuccess(charged);
    } catch (err) {
      failCharge(err);
    }
  };

  const handleChargeCash = async () => {
    setChargeError('');
    setChargeStep('pending');
    try {
      finishWithSuccess(await chargeBookingCash(booking));
    } catch (err) {
      failCharge(err);
    }
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

        {booking.noShowFee ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>No-show fee ({booking.noShowFee.percent}%)</Text>
            <Text style={styles.cardValue}>KES {booking.noShowFee.kept.amount} kept from the deposit</Text>
            {booking.noShowFee.uncollected.amount > 0 ? (
              <Text style={styles.cardValueMuted}>KES {booking.noShowFee.uncollected.amount} not collected</Text>
            ) : null}
          </View>
        ) : null}

        {booking.refund ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Refund</Text>
            {booking.refund.status === 'due' ? (
              <>
                <Text style={styles.cardValue}>
                  KES {booking.refund.amount.amount} owed back to {booking.customerName}
                </Text>
                {isStaffView ? null : (
                  <Button label="Mark refunded" variant="secondary" onPress={() => setRefundSheetVisible(true)} />
                )}
              </>
            ) : (
              <Text style={styles.cardValue}>
                Refunded KES {booking.refund.amount.amount}
                {booking.refund.reference ? ` · ${booking.refund.reference}` : ''}
              </Text>
            )}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Staff</Text>
          <Text style={styles.cardValue}>{booking.staffId ? booking.staffName : 'Unassigned'}</Text>
          {canAssign && assignableStaff.length > 0 ? (
            <Button
              label={booking.staffId ? 'Reassign' : 'Assign staff'}
              variant="secondary"
              onPress={() => {
                setAssignError('');
                setAssignSheetVisible(true);
              }}
            />
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isStaffView ? (
          <>
            {booking.status === 'confirmed' ? (
              <Button label="Start" disabled={isUpdatingStatus} onPress={() => setStatus('in_progress')} />
            ) : null}
            {/* Checkout (charging) completes it, and charging needs it still in
                progress — so staff don't complete it themselves. */}
            {booking.status === 'in_progress' ? (
              <Text style={styles.cardValueMuted}>The owner or front desk will check the customer out.</Text>
            ) : null}
          </>
        ) : booking.status === 'confirmed' ? (
          <>
            <Button label="Check in" disabled={isUpdatingStatus} onPress={() => setStatus('in_progress')} />
            {canReschedule ? <Button label="Reschedule" variant="secondary" onPress={openReschedule} /> : null}
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
        {!isStaffView && booking.status === 'in_progress' ? (
          <Button label="Charge customer" onPress={() => setChargeSheetVisible(true)} />
        ) : null}
      </View>

      <Modal visible={rescheduleVisible} transparent animationType="slide" onRequestClose={() => setRescheduleVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setRescheduleVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Reschedule</Text>
            <Text style={styles.sheetSubtitle}>
              Any time within working hours. The customer gets an SMS with the new time.
            </Text>
            <DatePickerField label="Date" value={newDate} onChange={setNewDate} minimumDate={new Date()} />
            <TimePickerField label="Time" value={newTime} onChange={setNewTime} />
            {rescheduleError ? <Text style={styles.assignError}>{rescheduleError}</Text> : null}
            <Button
              label={rescheduling ? 'Moving…' : 'Move appointment'}
              disabled={rescheduling || !newDate || !newTime || (newDate === booking.date && newTime === booking.time)}
              onPress={handleReschedule}
              style={styles.sheetButton}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <MarkRefundedSheet
        booking={refundSheetVisible ? booking : null}
        onClose={() => setRefundSheetVisible(false)}
        onRefunded={(updated) => {
          updateBooking(updated);
          setRefundSheetVisible(false);
        }}
      />

      <Modal
        visible={assignSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAssignSheetVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setAssignSheetVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{booking.staffId ? 'Reassign booking' : 'Assign staff'}</Text>
            {assignError ? <Text style={styles.assignError}>{assignError}</Text> : null}
            {assignableStaff.map((member) => {
              const name = teamMemberDisplayName(member);
              const current = member.staffId === booking.staffId;
              return (
                <Pressable
                  key={member.staffId}
                  style={styles.assignRow}
                  disabled={current || assigningStaffId !== null}
                  onPress={() => handleAssign(member.staffId, name)}
                >
                  <Text style={[styles.cardValue, current && styles.cardValueMuted]}>
                    {name}
                    {current ? ' (assigned)' : ''}
                  </Text>
                  {assigningStaffId === member.staffId ? <ActivityIndicator color={colors.text.secondary} /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

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
                  {/* balanceDue = total minus any deposit paid (from charge-booking, once live). */}
                  KSh {(booking.balanceDue ?? booking.totalAmount).amount} for {booking.customerName}
                </Text>
                {chargeError ? <Text style={styles.assignError}>{chargeError}</Text> : null}

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
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  assignError: {
    ...typography.caption,
    color: colors.feedback.danger,
    marginBottom: spacing.sm,
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

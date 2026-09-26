import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar } from '../../components/Avatar';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { EmbeddedLocationMap } from '../../components/EmbeddedLocationMap';
import { getBusinessProfile } from '../../api/discovery';
import { cancelBooking, getBooking, getCancelPreview, type CancelPreview } from '../../api/booking';
import { getApiErrorMessage } from '../../api/client';
import { useBookingDraftStore } from '../../store/useBookingDraftStore';
import { useBookingsStore } from '../../store/useBookingsStore';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { BOOKING_STATUS_COLOR, BOOKING_STATUS_LABEL } from '../../utils/bookingStatus';
import { formatBookingDateLong, isUpcomingBooking } from '../../utils/date';
import type { Booking, BookingServiceLine } from '../../types/booking';
import type { BusinessProfile } from '../../types/discovery';

// Reached from Activity's list. No reschedule yet (that's C3, sequenced
// separately) — cancellation is built here since it's simple enough to not
// need its own dedicated flow: a confirm sheet showing the business's real
// cancellation policy and the fee (if any) this specific cancellation would
// trigger. There's no cancel endpoint yet, so confirming only explains
// that — flipping the status locally would be undone by the next refresh
// from the server.
const CANCEL_REASONS = ['Something came up', 'Found another time', 'Booked by mistake', 'Other'];

export function BookingDetailScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  // The server is the source of truth (get-booking); the local cache only
  // fills the screen while that loads.
  const cached = useBookingsStore((s) => s.bookings.find((b) => b.bookingId === bookingId));
  const [fetched, setFetched] = useState<Booking | null>(null);
  const [loadError, setLoadError] = useState('');
  const booking = fetched ?? cached;
  const startBookingDraft = useBookingDraftStore((s) => s.startDraft);
  const setStaff = useBookingDraftStore((s) => s.setStaff);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [cancelSheetVisible, setCancelSheetVisible] = useState(false);
  // Cancel flow (BK-60): the server's preview decides what cancelling costs.
  const [preview, setPreview] = useState<CancelPreview | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    getBooking(bookingId)
      .then(setFetched)
      .catch((err) => setLoadError(getApiErrorMessage(err, "Couldn't load this booking.")));
  }, [bookingId]);

  const bookingBusinessId = booking?.businessId;
  useEffect(() => {
    if (bookingBusinessId) getBusinessProfile(bookingBusinessId).then(setProfile);
  }, [bookingBusinessId]);

  if (!booking) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <BackButton onPress={() => router.back()} />
        {loadError ? (
          <Text style={styles.loadError}>{loadError}</Text>
        ) : (
          <ActivityIndicator style={styles.loading} color={colors.text.secondary} />
        )}
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ActivityIndicator style={styles.loading} color={colors.text.secondary} />
      </SafeAreaView>
    );
  }

  const upcoming = isUpcomingBooking(booking.date, booking.time);
  const canCancel = upcoming && (booking.status === 'confirmed' || booking.status === 'pending_payment');
  const staffMember = booking.staffId ? profile.staff.find((s) => s.staffId === booking.staffId) : null;


  const handleRebook = () => {
    const lines: BookingServiceLine[] = booking.services.map((service) => ({ ...service }));
    startBookingDraft(booking.businessId, booking.businessName, lines);
    setStaff(booking.staffId, booking.staffName);
    router.push(`/business/${booking.businessId}/book/datetime`);
  };

  const openCancelSheet = () => {
    setPreview(null);
    setPreviewError('');
    setCancelReason(null);
    setCancelSheetVisible(true);
    getCancelPreview(booking.bookingId)
      .then(setPreview)
      .catch((err) => setPreviewError(getApiErrorMessage(err, "Couldn't check the cancellation terms.")));
  };

  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      const cancelled = await cancelBooking(booking.bookingId, cancelReason ?? undefined);
      setFetched(cancelled);
      setCancelSheetVisible(false);
    } catch (err) {
      setPreviewError(getApiErrorMessage(err, "Couldn't cancel this appointment."));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Booking details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Image source={{ uri: profile.photos[0] }} style={styles.thumb} />
          <View style={styles.summaryInfo}>
            <Text style={styles.businessName}>{booking.businessName}</Text>
            <Text style={[styles.status, { color: BOOKING_STATUS_COLOR[booking.status] }]}>
              {BOOKING_STATUS_LABEL[booking.status]}
              {booking.cancelReason === 'payment_expired'
                ? booking.paymentStatus === 'deposit_paid'
                  ? ' · your payment arrived after it expired; the business will refund you'
                  : ' · deposit not paid in time'
                : ''}
            </Text>
            {booking.reference ? <Text style={styles.reference}>Ref {booking.reference}</Text> : null}
            {booking.refund ? (
              <Text style={styles.reference}>
                {booking.refund.status === 'due'
                  ? `KES ${booking.refund.amount.amount} refund pending from the business`
                  : `Refunded KES ${booking.refund.amount.amount}${booking.refund.reference ? ` · ${booking.refund.reference}` : ''}`}
              </Text>
            ) : null}
          </View>
        </View>

        {booking.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Your notes</Text>
            <Text style={styles.notes}>{booking.notes}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Staff</Text>
          <View style={styles.staffRow}>
            {staffMember ? (
              <Avatar name={staffMember.name} uri={staffMember.avatarUrl} size={40} />
            ) : (
              <View style={styles.anyAvatar}>
                <Text style={styles.anyAvatarText}>?</Text>
              </View>
            )}
            <View>
              <Text style={styles.cardValue}>{booking.staffName}</Text>
              {staffMember ? <Text style={styles.metaLine}>{staffMember.role}</Text> : null}
            </View>
          </View>
        </View>

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
          {booking.depositAmount ? (
            <Text style={styles.metaLine}>Deposit paid: KSh {booking.depositAmount.amount}</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Location</Text>
          <EmbeddedLocationMap address={profile.address} lat={profile.lat} lng={profile.lng} />
        </View>

        <View style={styles.policyCard}>
          <Text style={styles.cardLabel}>Cancellation policy</Text>
          <Text style={styles.policyText}>
            Free cancellation up to {profile.policies.cancellation.freeCancellationHours}h before your appointment,
            {' '}{profile.policies.cancellation.lateFeePercent}% fee after.
          </Text>
          <Text style={styles.policyText}>No-show fee: {profile.policies.noShow.feePercent}% of the total.</Text>
        </View>

        {canCancel ? (
          <Button
            label="Cancel appointment"
            variant="secondary"
            onPress={openCancelSheet}
            style={styles.actionButton}
          />
        ) : null}

        {booking.status === 'cancelled' ? (
          <Button label="Book again" onPress={handleRebook} style={styles.actionButton} />
        ) : null}
      </ScrollView>

      <Modal
        visible={cancelSheetVisible}
        animationType="slide"
        onRequestClose={() => setCancelSheetVisible(false)}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <View style={styles.content}>
            <Text style={styles.sheetTitle}>Cancel this appointment?</Text>
            <View style={styles.policyCard}>
              <Text style={styles.policyText}>
                {profile.name}'s policy: free cancellation up to {profile.policies.cancellation.freeCancellationHours}h
                before your appointment, {profile.policies.cancellation.lateFeePercent}% fee after.
              </Text>
            </View>
            {previewError ? (
              <Text style={styles.feeTextWarning}>{previewError}</Text>
            ) : !preview ? (
              <ActivityIndicator color={colors.text.secondary} />
            ) : !preview.canCancel ? (
              <Text style={styles.feeTextWarning}>{preview.reasonBlocked ?? "This appointment can't be cancelled."}</Text>
            ) : (
              <>
                {/* The server's message already explains fee and refund in words. */}
                <Text style={preview.fee.amount > 0 ? styles.feeTextWarning : styles.feeText}>{preview.message}</Text>
                <Text style={styles.reasonLabel}>Reason (optional)</Text>
                <View style={styles.reasonRow}>
                  {CANCEL_REASONS.map((reason) => {
                    const selected = cancelReason === reason;
                    return (
                      <Pressable
                        key={reason}
                        style={[styles.reasonPill, selected && styles.reasonPillSelected]}
                        onPress={() => setCancelReason(selected ? null : reason)}
                      >
                        <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>{reason}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </View>
          <View style={styles.sheetFooter}>
            <Button
              label={cancelling ? 'Cancelling…' : 'Confirm cancellation'}
              disabled={!preview?.canCancel || cancelling}
              onPress={handleConfirmCancel}
            />
            <Button
              label="Keep appointment"
              variant="secondary"
              onPress={() => setCancelSheetVisible(false)}
              style={styles.keepButton}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadError: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  loading: {
    flex: 1,
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
    gap: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    ...shadows.card,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.background.tertiary,
  },
  summaryInfo: {
    flex: 1,
    gap: 2,
  },
  businessName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  status: {
    ...typography.caption,
    marginTop: 2,
  },
  reasonLabel: {
    ...typography.label,
    color: colors.text.primary,
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  reasonPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.pill.unselectedBg,
  },
  reasonPillSelected: {
    backgroundColor: colors.pill.selectedBg,
  },
  reasonText: {
    ...typography.bodyMedium,
    color: colors.pill.unselectedText,
  },
  reasonTextSelected: {
    color: colors.pill.selectedText,
  },
  reference: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  notes: {
    ...typography.body,
    color: colors.text.primary,
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
  metaLine: {
    ...typography.body,
    color: colors.text.secondary,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  anyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anyAvatarText: {
    ...typography.h3,
    color: colors.text.secondary,
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
  policyCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  policyText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  actionButton: {
    marginTop: spacing.sm,
  },
  sheetTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  feeText: {
    ...typography.body,
    color: colors.feedback.success,
  },
  feeTextWarning: {
    ...typography.body,
    color: colors.feedback.warning,
  },
  sheetFooter: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  keepButton: {
    marginTop: 0,
  },
});

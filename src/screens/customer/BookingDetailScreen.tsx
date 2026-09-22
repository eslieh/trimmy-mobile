import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar } from '../../components/Avatar';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { EmbeddedLocationMap } from '../../components/EmbeddedLocationMap';
import { getBusinessProfile } from '../../api/discovery';
import { useBookingDraftStore } from '../../store/useBookingDraftStore';
import { useBookingsStore } from '../../store/useBookingsStore';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { BOOKING_STATUS_COLOR, BOOKING_STATUS_LABEL } from '../../utils/bookingStatus';
import { formatBookingDateLong, getBookingDateTime, isUpcomingBooking } from '../../utils/date';
import type { BookingServiceLine } from '../../types/booking';
import type { BusinessProfile } from '../../types/discovery';

// Reached from Activity's list. No reschedule yet (that's C3, sequenced
// separately) — cancellation is built here since it's simple enough to not
// need its own dedicated flow: a confirm sheet showing the business's real
// cancellation policy and the fee (if any) this specific cancellation would
// trigger, then just flips the booking's status client-side (no cancel
// endpoint exists yet).
export function BookingDetailScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const booking = useBookingsStore((s) => s.bookings.find((b) => b.bookingId === bookingId));
  const updateBooking = useBookingsStore((s) => s.updateBooking);
  const startBookingDraft = useBookingDraftStore((s) => s.startDraft);
  const setStaff = useBookingDraftStore((s) => s.setStaff);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [cancelSheetVisible, setCancelSheetVisible] = useState(false);

  useEffect(() => {
    if (booking) getBusinessProfile(booking.businessId).then(setProfile);
  }, [booking]);

  if (!booking) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <BackButton onPress={() => router.back()} />
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
  const canCancel = upcoming && booking.status !== 'cancelled';
  const staffMember = booking.staffId ? profile.staff.find((s) => s.staffId === booking.staffId) : null;

  const hoursUntil = (getBookingDateTime(booking.date, booking.time).getTime() - Date.now()) / (1000 * 60 * 60);
  const withinFreeWindow = hoursUntil >= profile.policies.cancellation.freeCancellationHours;
  const lateFeeAmount = Math.round((booking.totalAmount.amount * profile.policies.cancellation.lateFeePercent) / 100);

  const handleRebook = () => {
    const lines: BookingServiceLine[] = booking.services.map((service) => ({ ...service }));
    startBookingDraft(booking.businessId, booking.businessName, lines);
    setStaff(booking.staffId, booking.staffName);
    router.push(`/business/${booking.businessId}/book/datetime`);
  };

  const handleConfirmCancel = () => {
    updateBooking({ ...booking, status: 'cancelled' });
    setCancelSheetVisible(false);
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
            </Text>
          </View>
        </View>

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
            onPress={() => setCancelSheetVisible(true)}
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
            {withinFreeWindow ? (
              <Text style={styles.feeText}>
                You're cancelling within the free window — no fee will be charged.
              </Text>
            ) : (
              <Text style={styles.feeTextWarning}>
                This is within {profile.policies.cancellation.freeCancellationHours}h of your appointment, so a{' '}
                {profile.policies.cancellation.lateFeePercent}% fee (KSh {lateFeeAmount}) applies.
              </Text>
            )}
          </View>
          <View style={styles.sheetFooter}>
            <Button label="Confirm cancellation" onPress={handleConfirmCancel} />
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

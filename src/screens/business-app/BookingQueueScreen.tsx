import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { MarkRefundedSheet } from '../../components/MarkRefundedSheet';
import { listBusinessBookings } from '../../api/booking';
import { getApiErrorMessage } from '../../api/client';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { useBookingsStore } from '../../store/useBookingsStore';
import { formatBookingDate } from '../../utils/date';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import type { Booking } from '../../types/booking';

type QueueMode = 'unassigned' | 'refunds';

const UNASSIGNED_DAYS = 62; // the server's max range per request

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const COPY: Record<QueueMode, { title: string; empty: string }> = {
  unassigned: {
    title: 'Unassigned bookings',
    empty: 'Every upcoming booking has someone assigned.',
  },
  refunds: {
    title: 'Refunds owed',
    empty: 'No refunds owed right now.',
  },
};

// Two owner/front-desk work queues over list-business-bookings:
//   unassigned — "Any available" bookings in the next 62 days waiting for
//                staff; tap through to Assign staff (BK-26).
//   refunds    — every booking with a refund owed (refund=due), with Mark
//                refunded right in the list (BK-60).
export function BookingQueueScreen({ mode }: { mode: QueueMode }) {
  const router = useRouter();
  const business = useBusinessOnboardingStore((s) => s.business);
  const upsertBooking = useBookingsStore((s) => s.upsertBooking);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState('');
  const [refunding, setRefunding] = useState<Booking | null>(null);

  const businessId = business?.businessId;
  const load = useCallback(() => {
    if (!businessId) return;
    setError('');
    const today = new Date();
    const until = new Date(today);
    until.setDate(until.getDate() + UNASSIGNED_DAYS - 1);
    const request =
      mode === 'refunds'
        ? listBusinessBookings(businessId, { refund: 'due' })
        : listBusinessBookings(businessId, {
            from: dateKey(today),
            to: dateKey(until),
            unassigned: true,
            status: ['pending_payment', 'confirmed', 'in_progress'],
          });
    request
      .then((list) => {
        setBookings(list);
        list.forEach(upsertBooking);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load bookings.")));
  }, [businessId, mode, upsertBooking]);

  useFocusEffect(load);

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>{COPY[mode].title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {error ? (
          <View style={styles.center}>
            <Text style={styles.muted}>{error}</Text>
            <Button label="Try again" variant="secondary" onPress={load} />
          </View>
        ) : !bookings ? (
          <ActivityIndicator style={styles.center} color={colors.text.secondary} />
        ) : bookings.length === 0 ? (
          <Text style={[styles.muted, styles.center]}>{COPY[mode].empty}</Text>
        ) : (
          bookings.map((booking) => (
            <Pressable
              key={booking.bookingId}
              style={styles.card}
              onPress={() => router.push(`/appointment/${booking.bookingId}`)}
            >
              <Text style={styles.name}>{booking.customerName}</Text>
              <Text style={styles.muted}>
                {formatBookingDate(booking.date)} · {booking.time}
                {booking.reference ? ` · ${booking.reference}` : ''}
              </Text>
              <Text style={styles.muted}>{booking.services.map((service) => service.name).join(', ')}</Text>
              {mode === 'refunds' && booking.refund ? (
                <View style={styles.refundRow}>
                  <Text style={styles.amount}>KES {booking.refund.amount.amount} owed</Text>
                  <Button label="Mark refunded" variant="secondary" onPress={() => setRefunding(booking)} />
                </View>
              ) : null}
            </Pressable>
          ))
        )}
      </ScrollView>

      <MarkRefundedSheet
        booking={refunding}
        onClose={() => setRefunding(null)}
        onRefunded={(updated) => {
          upsertBooking(updated);
          setRefunding(null);
          setBookings((current) => current?.filter((b) => b.bookingId !== updated.bookingId) ?? null);
        }}
      />
    </SafeAreaView>
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
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  content: {
    padding: spacing.xxl,
    gap: spacing.md,
  },
  center: {
    marginTop: spacing.xxxl,
    alignItems: 'center',
    textAlign: 'center',
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.card,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  muted: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  refundRow: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  amount: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
});

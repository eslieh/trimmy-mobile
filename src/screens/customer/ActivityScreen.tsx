import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CalendarIcon } from '../../components/icons/CalendarIcon';
import { Button } from '../../components/Button';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { useBookingsStore } from '../../store/useBookingsStore';
import { colors, durations, radii, shadows, spacing, typography } from '../../theme';
import { BOOKING_STATUS_COLOR, BOOKING_STATUS_LABEL } from '../../utils/bookingStatus';
import { formatBookingDate, getBookingDateTime, isUpcomingBooking } from '../../utils/date';

type ActivityTab = 'upcoming' | 'past';

// No "my bookings" endpoint or reschedule/cancel actions yet (that's C3,
// sequenced separately) — this just lists and classifies what
// useBookingsStore has accumulated from completed bookings this session,
// Airbnb Trips-inspired: a pill Upcoming/Past switch, a connecting-line
// timeline down the list, tap through to a full detail screen.
export function ActivityScreen() {
  const router = useRouter();
  const bookings = useBookingsStore((s) => s.bookings);
  const [tab, setTab] = useState<ActivityTab>('upcoming');

  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => isUpcomingBooking(b.date, b.time))
        .sort((a, b) => getBookingDateTime(a.date, a.time).getTime() - getBookingDateTime(b.date, b.time).getTime()),
    [bookings],
  );
  const past = useMemo(
    () =>
      bookings
        .filter((b) => !isUpcomingBooking(b.date, b.time))
        .sort((a, b) => getBookingDateTime(b.date, b.time).getTime() - getBookingDateTime(a.date, a.time).getTime()),
    [bookings],
  );

  const visible = tab === 'upcoming' ? upcoming : past;

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <SegmentedTabs
          options={[
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'past', label: 'Past' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {visible.length === 0 ? (
        <Animated.View key={tab} entering={FadeIn.duration(durations.base)} style={styles.empty}>
          <CalendarIcon size={40} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>
            {tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          </Text>
          <Text style={styles.emptyBody}>
            {tab === 'upcoming'
              ? "Book a service and it'll show up here."
              : 'Appointments you\'ve completed will show up here.'}
          </Text>
          {tab === 'upcoming' ? (
            <Button label="Find a business" onPress={() => router.push('/explore')} style={styles.emptyButton} />
          ) : null}
        </Animated.View>
      ) : (
        <ScrollView key={tab} contentContainerStyle={styles.list}>
          <Animated.View entering={FadeIn.duration(durations.base)}>
            {visible.map((booking, index) => (
              <View key={booking.bookingId} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <Text style={styles.timelineWeekday}>{formatBookingDate(booking.date).slice(0, 3)}</Text>
                  <View style={styles.timelineNode}>
                    <Text style={styles.timelineNodeText}>{Number(booking.date.slice(-2))}</Text>
                  </View>
                  {index < visible.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>

                <Pressable style={styles.card} onPress={() => router.push(`/booking/${booking.bookingId}`)}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.businessName}>{booking.businessName}</Text>
                    <Text style={[styles.status, { color: BOOKING_STATUS_COLOR[booking.status] }]}>
                      {BOOKING_STATUS_LABEL[booking.status]}
                    </Text>
                  </View>
                  <Text style={styles.metaLine}>{booking.staffName}</Text>
                  {booking.services.map((service) => (
                    <Text key={service.serviceId} style={styles.metaLine}>
                      {service.quantity > 1 ? `${service.quantity}× ` : ''}
                      {service.name}
                    </Text>
                  ))}
                  <Text style={styles.metaLine}>{booking.time}</Text>
                </Pressable>
              </View>
            ))}
          </Animated.View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
  list: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineRail: {
    width: 40,
    alignItems: 'center',
  },
  timelineWeekday: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  timelineNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodeText: {
    ...typography.label,
    color: colors.text.primary,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border.subtle,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  card: {
    flex: 1,
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  businessName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  status: {
    ...typography.caption,
  },
  metaLine: {
    ...typography.body,
    color: colors.text.secondary,
  },
});

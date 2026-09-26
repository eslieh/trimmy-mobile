import { useCallback, useState } from 'react';
import { ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CalendarIcon } from '../../components/icons/CalendarIcon';
import { Button } from '../../components/Button';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { listMyBookings, type MyBookingsFilter } from '../../api/booking';
import { getApiErrorMessage } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { colors, durations, radii, shadows, spacing, typography } from '../../theme';
import { BOOKING_STATUS_COLOR, BOOKING_STATUS_LABEL } from '../../utils/bookingStatus';
import { formatBookingDate } from '../../utils/date';
import type { Booking } from '../../types/booking';

type ActivityTab = MyBookingsFilter;

type TabState = {
  bookings: Booking[];
  nextCursor: string | null;
  loading: boolean;
  error: string;
};

const EMPTY_TAB: TabState = { bookings: [], nextCursor: null, loading: false, error: '' };

const EMPTY_COPY: Record<ActivityTab, { title: string; body: string }> = {
  upcoming: { title: 'No upcoming appointments', body: "Book a service and it'll show up here." },
  past: { title: 'No past appointments', body: "Appointments you've completed will show up here." },
  cancelled: { title: 'No cancelled appointments', body: 'Cancelled bookings will show up here.' },
};

// My Appointments — read from the server (list-my-bookings), one request
// per tab, already sorted server-side (upcoming soonest first, past and
// cancelled newest first). Refreshes whenever the tab comes into focus and
// loads the next page as you near the bottom. Airbnb Trips-inspired: a pill
// tab switch, a connecting-line timeline, tap through to a detail screen.
export function ActivityScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<ActivityTab>('upcoming');
  const [tabs, setTabs] = useState<Record<ActivityTab, TabState>>({
    upcoming: EMPTY_TAB,
    past: EMPTY_TAB,
    cancelled: EMPTY_TAB,
  });

  const load = useCallback(
    (filter: ActivityTab, cursor: string | null) => {
      if (!user) return;
      setTabs((current) => ({ ...current, [filter]: { ...current[filter], loading: true, error: '' } }));
      listMyBookings(filter, cursor)
        .then((page) =>
          setTabs((current) => ({
            ...current,
            [filter]: {
              bookings: cursor ? [...current[filter].bookings, ...page.bookings] : page.bookings,
              nextCursor: page.nextCursor,
              loading: false,
              error: '',
            },
          })),
        )
        .catch((err) =>
          setTabs((current) => ({
            ...current,
            [filter]: { ...current[filter], loading: false, error: getApiErrorMessage(err, "Couldn't load your appointments.") },
          })),
        );
    },
    [user],
  );

  useFocusEffect(
    useCallback(() => {
      load(tab, null);
    }, [load, tab]),
  );

  const current = tabs[tab];
  const visible = current.bookings;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
    if (nearBottom && current.nextCursor && !current.loading) load(tab, current.nextCursor);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <SegmentedTabs
          options={[
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'past', label: 'Past' },
            { key: 'cancelled', label: 'Cancelled' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {!user ? (
        <View style={styles.empty}>
          <CalendarIcon size={40} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>Log in to see your appointments</Text>
          <Button label="Log in" onPress={() => router.push('/login')} style={styles.emptyButton} />
        </View>
      ) : visible.length === 0 && current.loading ? (
        <ActivityIndicator style={styles.empty} color={colors.text.secondary} />
      ) : visible.length === 0 && current.error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyBody}>{current.error}</Text>
          <Button label="Try again" variant="secondary" onPress={() => load(tab, null)} style={styles.emptyButton} />
        </View>
      ) : visible.length === 0 ? (
        <Animated.View key={tab} entering={FadeIn.duration(durations.base)} style={styles.empty}>
          <CalendarIcon size={40} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>{EMPTY_COPY[tab].title}</Text>
          <Text style={styles.emptyBody}>{EMPTY_COPY[tab].body}</Text>
          {tab === 'upcoming' ? (
            <Button label="Find a business" onPress={() => router.push('/explore')} style={styles.emptyButton} />
          ) : null}
        </Animated.View>
      ) : (
        <ScrollView key={tab} contentContainerStyle={styles.list} onScroll={handleScroll} scrollEventThrottle={200}>
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
          {current.loading ? <ActivityIndicator color={colors.text.secondary} /> : null}
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

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppointmentCard } from '../../components/AppointmentCard';
import { ChevronDownIcon } from '../../components/icons/ChevronDownIcon';
import { CalendarIcon } from '../../components/icons/CalendarIcon';
import { useBookingsStore } from '../../store/useBookingsStore';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { colors, radii, spacing, typography } from '../../theme';
import type { Booking } from '../../types/booking';

const RESOLVED_STATUSES: Booking['status'][] = ['completed', 'no_show', 'cancelled'];

type DayOffset = 0 | 1;

const DAY_OPTIONS: { offset: DayOffset; label: string }[] = [
  { offset: 0, label: 'Today' },
  { offset: 1, label: 'Tomorrow' },
];

function dateKeyForOffset(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// S1 — staff's own daily schedule. Same shape as the business-owner app's
// TodayTimelineScreen (Today/Tomorrow pills, upcoming timeline with a rail,
// completed collapsed) but scoped to bookings assigned to *this* staff
// member (staffId === staffSession.invitationId) rather than the whole
// business, and no "+" — staff don't create walk-ins/appointments, that's
// an owner/front-desk permission.
export function StaffTodayScreen() {
  const router = useRouter();
  const staffSession = useOwnedBusinessStore((s) => s.staffSession);
  const setActiveMode = useOwnedBusinessStore((s) => s.setActiveMode);
  const bookings = useBookingsStore((s) => s.bookings);
  const [dayOffset, setDayOffset] = useState<DayOffset>(0);
  const [showCompleted, setShowCompleted] = useState(false);

  const handleExitToCustomer = () => {
    setActiveMode('customer');
    router.dismissAll();
    router.replace('/explore');
  };

  const dateKey = dateKeyForOffset(dayOffset);

  const dayBookings = useMemo(() => {
    if (!staffSession) return [];
    return bookings
      .filter(
        (b) =>
          b.businessId === staffSession.businessId && b.staffId === staffSession.invitationId && b.date === dateKey,
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [bookings, staffSession, dateKey]);

  const upcomingBookings = useMemo(
    () => dayBookings.filter((b) => !RESOLVED_STATUSES.includes(b.status)),
    [dayBookings],
  );
  const completedBookings = useMemo(
    () => dayBookings.filter((b) => RESOLVED_STATUSES.includes(b.status)),
    [dayBookings],
  );

  if (!staffSession) {
    return (
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.empty}>
          <CalendarIcon size={40} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No staff session</Text>
          <Text style={styles.emptyBody}>Join a business as staff to see your schedule here.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {staffSession.businessName}
          </Text>
        </View>
        <Pressable onPress={handleExitToCustomer} hitSlop={8}>
          <Text style={styles.exitLink}>Exit</Text>
        </Pressable>
      </View>

      <View style={styles.dayRow}>
        {DAY_OPTIONS.map((option) => {
          const selected = option.offset === dayOffset;
          return (
            <Pressable
              key={option.offset}
              style={[styles.dayPill, selected && styles.dayPillSelected]}
              onPress={() => setDayOffset(option.offset)}
            >
              <Text style={[styles.dayPillText, selected && styles.dayPillTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {dayBookings.length === 0 ? (
        <View style={styles.empty}>
          <CalendarIcon size={40} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>Nothing scheduled</Text>
          <Text style={styles.emptyBody}>Appointments assigned to you will show up here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking, index) => (
              <View key={booking.bookingId} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={styles.timelineNode}>
                    <Text style={styles.timelineNodeText}>{booking.time}</Text>
                  </View>
                  {index < upcomingBookings.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>
                <View style={styles.timelineCardWrapper}>
                  <AppointmentCard
                    booking={booking}
                    showTime={false}
                    onPress={() => router.push(`/appointment/${booking.bookingId}`)}
                  />
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyBody}>Nothing left to do — see completed below.</Text>
          )}

          {completedBookings.length > 0 ? (
            <View style={styles.completedSection}>
              <Pressable style={styles.completedToggle} onPress={() => setShowCompleted((v) => !v)}>
                <Text style={styles.completedToggleText}>Completed ({completedBookings.length})</Text>
                <View style={showCompleted ? styles.chevronUp : undefined}>
                  <ChevronDownIcon size={14} />
                </View>
              </Pressable>
              {showCompleted
                ? completedBookings.map((booking) => (
                    <AppointmentCard
                      key={booking.bookingId}
                      booking={booking}
                      onPress={() => router.push(`/appointment/${booking.bookingId}`)}
                    />
                  ))
                : null}
            </View>
          ) : null}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  exitLink: {
    ...typography.bodyMedium,
    color: colors.brand.purple,
    marginTop: spacing.sm,
  },
  dayRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
  },
  dayPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.pill.unselectedBg,
  },
  dayPillSelected: {
    backgroundColor: colors.pill.selectedBg,
  },
  dayPillText: {
    ...typography.bodyMedium,
    color: colors.pill.unselectedText,
  },
  dayPillTextSelected: {
    color: colors.pill.selectedText,
  },
  list: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineRail: {
    width: 56,
    alignItems: 'center',
  },
  timelineNode: {
    minWidth: 48,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodeText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    minHeight: spacing.lg,
    backgroundColor: colors.border.subtle,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  timelineCardWrapper: {
    flex: 1,
  },
  completedSection: {
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  completedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  completedToggleText: {
    ...typography.label,
    color: colors.text.secondary,
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
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
});

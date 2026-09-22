import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppointmentCard } from '../../components/AppointmentCard';
import { Button } from '../../components/Button';
import { CalendarIcon } from '../../components/icons/CalendarIcon';
import { ChevronDownIcon } from '../../components/icons/ChevronDownIcon';
import { PlusIcon } from '../../components/icons/PlusIcon';
import { useBookingsStore } from '../../store/useBookingsStore';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { colors, radii, spacing, typography } from '../../theme';
import type { Booking } from '../../types/booking';

// Still open/in-flight vs already wrapped up — the owner only needs to *act*
// on the former, so that's what gets top billing; resolved appointments are
// just a record at that point.
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

// S1 — solo owner's own session gets this Staff-style view instead of (or
// alongside) the customer tabs. No client history / reference images /
// special-instructions / post-service-notes here — none of that is modeled
// anywhere in the app yet (no per-client profile concept exists), so it's a
// deliberately simpler timeline + status stepper, not the full S1 spec.
// "+" here is walk-in only (customer is physically present, starts right
// now) — scheduling a future appointment lives in the Calendar tab instead,
// kept as a separate entry point rather than folded into this one.
export function TodayTimelineScreen() {
  const router = useRouter();
  const ownedBusiness = useOwnedBusinessStore((s) => s.business);
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
    if (!ownedBusiness) return [];
    return bookings
      .filter((b) => b.businessId === ownedBusiness.businessId && b.date === dateKey)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [bookings, ownedBusiness, dateKey]);

  const upcomingBookings = useMemo(
    () => dayBookings.filter((b) => !RESOLVED_STATUSES.includes(b.status)),
    [dayBookings],
  );
  const completedBookings = useMemo(
    () => dayBookings.filter((b) => RESOLVED_STATUSES.includes(b.status)),
    [dayBookings],
  );

  if (!ownedBusiness) {
    return (
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.empty}>
          <CalendarIcon size={40} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No business to manage yet</Text>
          <Text style={styles.emptyBody}>Publish a business to see its schedule here.</Text>
          <Button label="Back to Trimyy" onPress={handleExitToCustomer} style={styles.emptyButton} />
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
            {ownedBusiness.name}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.addButton} onPress={() => router.push('/walk-in')} hitSlop={4}>
            <PlusIcon size={18} color={colors.text.primary} />
          </Pressable>
          <Pressable onPress={handleExitToCustomer} hitSlop={8}>
            <Text style={styles.exitLink}>Exit</Text>
          </Pressable>
        </View>
      </View>

      {ownedBusiness.teamMode === 'team' ? (
        <View style={styles.teamBanner}>
          <Text style={styles.teamBannerText}>
            Front Desk (the team calendar view) isn't built yet — showing the solo Today view as a
            placeholder.
          </Text>
        </View>
      ) : null}

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
          <Text style={styles.emptyBody}>Appointments booked for this day will show up here.</Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  exitLink: {
    ...typography.bodyMedium,
    color: colors.brand.purple,
  },
  teamBanner: {
    marginHorizontal: spacing.xxl,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#FEF3C7',
  },
  teamBannerText: {
    ...typography.caption,
    color: colors.feedback.warning,
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
  emptyButton: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});

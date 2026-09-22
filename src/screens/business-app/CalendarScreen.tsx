import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppointmentCard } from '../../components/AppointmentCard';
import { MonthCalendar } from '../../components/MonthCalendar';
import { PlusIcon } from '../../components/icons/PlusIcon';
import { useBookingsStore } from '../../store/useBookingsStore';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { getTimeSlots } from '../../utils/availability';
import { colors, radii, spacing, typography } from '../../theme';

// Just for browsing what's open on a day before any services are picked —
// the real availability check (against the actual service duration) happens
// once inside ScheduleAppointmentScreen. Matches the day's slot interval.
const BROWSE_SLOT_DURATION_MINUTES = 30;

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatSelectedDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// The month-grid view + "+" entry point for scheduling — kept separate from
// the Today tab (which is just "what's happening right now" plus walk-ins)
// so browsing other dates and booking someone in for later has its own
// dedicated space. Tapping a day shows both what's already booked and, like
// Google Calendar's scheduling view, the open slots still available that
// day — tapping one jumps straight into ScheduleAppointmentScreen with that
// date/time already chosen.
export function CalendarScreen() {
  const router = useRouter();
  const ownedBusiness = useOwnedBusinessStore((s) => s.business);
  const bookings = useBookingsStore((s) => s.bookings);

  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));

  const businessBookings = useMemo(
    () => (ownedBusiness ? bookings.filter((b) => b.businessId === ownedBusiness.businessId) : []),
    [bookings, ownedBusiness],
  );

  const markedDates = useMemo(() => new Set(businessBookings.map((b) => b.date)), [businessBookings]);

  const selectedDayBookings = useMemo(
    () => businessBookings.filter((b) => b.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)),
    [businessBookings, selectedDate],
  );

  const bookedTimes = useMemo(() => new Set(selectedDayBookings.map((b) => b.time)), [selectedDayBookings]);

  const openSlots = useMemo(() => {
    if (!ownedBusiness?.workingHours) return [];
    return getTimeSlots(ownedBusiness.workingHours, selectedDate, BROWSE_SLOT_DURATION_MINUTES).filter(
      (slot) => !bookedTimes.has(slot),
    );
  }, [ownedBusiness, selectedDate, bookedTimes]);

  if (!ownedBusiness) {
    return <SafeAreaView style={styles.flex} edges={['top']} />;
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/schedule')} hitSlop={4}>
          <PlusIcon size={18} color={colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <MonthCalendar
          month={month}
          onChangeMonth={setMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          markedDates={markedDates}
        />

        <Text style={styles.sectionTitle}>{formatSelectedDate(selectedDate)}</Text>

        {selectedDayBookings.length > 0 ? (
          <View style={styles.list}>
            {selectedDayBookings.map((booking) => (
              <AppointmentCard
                key={booking.bookingId}
                booking={booking}
                onPress={() => router.push(`/appointment/${booking.bookingId}`)}
              />
            ))}
          </View>
        ) : null}

        <View>
          <Text style={styles.sectionSubtitle}>
            {selectedDayBookings.length > 0 ? 'Other open times' : 'Available times'}
          </Text>
          {openSlots.length === 0 ? (
            <Text style={styles.emptyBody}>No open slots left on this day.</Text>
          ) : (
            <View style={styles.slotGrid}>
              {openSlots.map((slot) => (
                <Pressable
                  key={slot}
                  style={styles.slotPill}
                  onPress={() => router.push(`/schedule?date=${selectedDate}&time=${slot}`)}
                >
                  <Text style={styles.slotPillText}>{slot}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.primary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slotPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  slotPillText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  emptyBody: {
    ...typography.body,
    color: colors.text.secondary,
  },
});

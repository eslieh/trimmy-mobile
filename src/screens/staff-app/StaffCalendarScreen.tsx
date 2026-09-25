import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppointmentCard } from '../../components/AppointmentCard';
import { MonthCalendar } from '../../components/MonthCalendar';
import { CalendarIcon } from '../../components/icons/CalendarIcon';
import { useBookingsStore } from '../../store/useBookingsStore';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { colors, spacing, typography } from '../../theme';

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

// Read-only version of the business-owner app's CalendarScreen — browsing
// only, no "+" and no open-slots section, since scheduling/walk-ins are an
// owner/front-desk permission, not staff's. Scoped to bookings assigned to
// this staff member (staffId === staffSession.invitationId).
export function StaffCalendarScreen() {
  const router = useRouter();
  const staffSession = useOwnedBusinessStore((s) => s.staffSession);
  const bookings = useBookingsStore((s) => s.bookings);

  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));

  const myBookings = useMemo(
    () =>
      staffSession
        ? bookings.filter((b) => b.businessId === staffSession.businessId && b.staffId === staffSession.invitationId)
        : [],
    [bookings, staffSession],
  );

  const markedDates = useMemo(() => new Set(myBookings.map((b) => b.date)), [myBookings]);

  const selectedDayBookings = useMemo(
    () => myBookings.filter((b) => b.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)),
    [myBookings, selectedDate],
  );

  if (!staffSession) {
    return <SafeAreaView style={styles.flex} edges={['top']} />;
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
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

        {selectedDayBookings.length === 0 ? (
          <View style={styles.empty}>
            <CalendarIcon size={32} color={colors.text.tertiary} />
            <Text style={styles.emptyBody}>Nothing scheduled for this day.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {selectedDayBookings.map((booking) => (
              <AppointmentCard
                key={booking.bookingId}
                booking={booking}
                onPress={() => router.push(`/appointment/${booking.bookingId}`)}
              />
            ))}
          </View>
        )}
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
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.primary,
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
  list: {
    gap: spacing.md,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyBody: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

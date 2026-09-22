import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CalendarIcon } from '../../components/icons/CalendarIcon';
import { Button } from '../../components/Button';
import { useBookingsStore } from '../../store/useBookingsStore';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { formatBookingDate } from '../../utils/date';
import type { Booking } from '../../types/booking';

const STATUS_LABEL: Record<Booking['status'], string> = {
  pending_payment: 'Payment pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<Booking['status'], string> = {
  pending_payment: colors.feedback.warning,
  confirmed: colors.feedback.success,
  cancelled: colors.feedback.danger,
};

// No "my bookings" endpoint or reschedule/cancel actions yet (that's C3,
// sequenced separately) — this just lists what useBookingsStore has
// accumulated from completed bookings this session.
export function ActivityScreen() {
  const router = useRouter();
  const bookings = useBookingsStore((s) => s.bookings);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.empty}>
          <CalendarIcon size={40} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No appointments yet</Text>
          <Text style={styles.emptyBody}>Book a service and it'll show up here.</Text>
          <Button label="Find a business" onPress={() => router.push('/explore')} style={styles.emptyButton} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {bookings.map((booking) => (
            <View key={booking.bookingId} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.businessName}>{booking.businessName}</Text>
                <Text style={[styles.status, { color: STATUS_COLOR[booking.status] }]}>
                  {STATUS_LABEL[booking.status]}
                </Text>
              </View>
              <Text style={styles.metaLine}>{booking.staffName}</Text>
              {booking.services.map((service) => (
                <Text key={service.serviceId} style={styles.metaLine}>
                  {service.quantity > 1 ? `${service.quantity}× ` : ''}
                  {service.name}
                </Text>
              ))}
              <Text style={styles.metaLine}>
                {formatBookingDate(booking.date)} · {booking.time}
              </Text>
            </View>
          ))}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.xs,
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

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BOOKING_STATUS_COLOR, BOOKING_STATUS_LABEL } from '../utils/bookingStatus';
import { colors, radii, shadows, spacing, typography } from '../theme';
import type { Booking } from '../types/booking';

interface AppointmentCardProps {
  booking: Booking;
  onPress: () => void;
  showTime?: boolean; // false when a timeline rail already shows the time (TodayTimelineScreen's Upcoming section)
}

// Shared row between TodayTimelineScreen's day list and CalendarScreen's
// selected-date list — same booking, same card, two different ways of
// picking which day you're looking at.
export function AppointmentCard({ booking, onPress, showTime = true }: AppointmentCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {showTime ? <Text style={styles.cardTime}>{booking.time}</Text> : null}
      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
          <Text style={styles.customerName}>{booking.customerName}</Text>
          <Text style={[styles.status, { color: BOOKING_STATUS_COLOR[booking.status] }]}>
            {BOOKING_STATUS_LABEL[booking.status]}
          </Text>
        </View>
        {booking.services.map((service) => (
          <Text key={service.serviceId} style={styles.serviceLine}>
            {service.quantity > 1 ? `${service.quantity}× ` : ''}
            {service.name}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardTime: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    width: 52,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  status: {
    ...typography.caption,
  },
  serviceLine: {
    ...typography.body,
    color: colors.text.secondary,
  },
});

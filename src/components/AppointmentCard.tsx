import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SwipeRow, type SwipeAction } from './ui/SwipeRow';
import { BOOKING_STATUS_COLOR, BOOKING_STATUS_LABEL } from '../utils/bookingStatus';
import { colors, radii, shadows, spacing, typography } from '../theme';
import type { Booking } from '../types/booking';

interface AppointmentCardProps {
  booking: Booking;
  onPress: () => void;
  showTime?: boolean; // false when a timeline rail already shows the time (TodayTimelineScreen's Upcoming section)
  // Quick actions (useAppointmentActions): swipe left to reveal, or long-press.
  actions?: SwipeAction[];
  onLongPress?: () => void;
}

// Shared row between TodayTimelineScreen's day list and CalendarScreen's
// selected-date list — same booking, same card, two different ways of
// picking which day you're looking at. The shadow sits on an outer view:
// the swipeable clips its contents.
export function AppointmentCard({ booking, onPress, showTime = true, actions = [], onLongPress }: AppointmentCardProps) {
  return (
    <View style={styles.shadow}>
      <SwipeRow actions={actions}>
        <Pressable style={styles.card} onPress={onPress} onLongPress={onLongPress} delayLongPress={350}>
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
      </SwipeRow>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    ...shadows.card,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
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

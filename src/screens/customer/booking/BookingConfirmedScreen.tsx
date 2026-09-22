import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../../../components/Button';
import { CheckIcon } from '../../../components/icons/CheckIcon';
import { useBookingDraftStore } from '../../../store/useBookingDraftStore';
import { colors, radii, shadows, spacing, typography } from '../../../theme';
import { formatBookingDate } from '../../../utils/date';

export function BookingConfirmedScreen() {
  const router = useRouter();
  const booking = useBookingDraftStore((s) => s.currentBooking);
  const reset = useBookingDraftStore((s) => s.reset);

  const handleDone = () => {
    reset();
    router.dismissAll();
    router.replace('/explore');
  };

  const handleViewAppointment = () => {
    reset();
    router.dismissAll();
    router.replace('/activity');
  };

  if (!booking) {
    return <SafeAreaView style={styles.flex} edges={['top', 'bottom']} />;
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <CheckIcon size={80} />
        <Text style={styles.title}>Booking confirmed</Text>
        <Text style={styles.subtitle}>
          {booking.status === 'confirmed' && booking.depositAmount
            ? "Your deposit was received — see you soon."
            : "You're all set — see you soon."}
        </Text>

        <View style={styles.card}>
          <Text style={styles.businessName}>{booking.businessName}</Text>
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
          <Text style={styles.metaLine}>
            {booking.depositAmount
              ? `Deposit paid: KSh ${booking.depositAmount.amount}`
              : `Total: KSh ${booking.totalAmount.amount} — pay at the business`}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button label="View appointment" onPress={handleViewAppointment} />
        <Button label="Done" variant="secondary" onPress={handleDone} style={styles.doneButton} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  card: {
    alignSelf: 'stretch',
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.card,
  },
  businessName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  metaLine: {
    ...typography.body,
    color: colors.text.secondary,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  doneButton: {
    marginTop: 0,
  },
});

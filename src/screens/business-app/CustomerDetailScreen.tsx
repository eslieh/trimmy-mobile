import { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppointmentCard } from '../../components/AppointmentCard';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { PhoneIcon } from '../../components/icons/PhoneIcon';
import { useBookingsStore } from '../../store/useBookingsStore';
import { useCustomersStore } from '../../store/useCustomersStore';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { getBookingDateTime } from '../../utils/date';
import { colors, radii, shadows, spacing, typography } from '../../theme';

// Reached from CustomersScreen. Bookings don't carry a customerId (they
// predate this store, and online bookings never go through it at all), so
// appointment history is matched by phone when the customer has one —
// the closest thing to a stable identifier this mock data has — falling
// back to an exact name match otherwise.
export function CustomerDetailScreen() {
  const router = useRouter();
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const ownedBusiness = useOwnedBusinessStore((s) => s.business);
  const customer = useCustomersStore((s) => s.customers.find((c) => c.customerId === customerId));
  const bookings = useBookingsStore((s) => s.bookings);

  const history = useMemo(() => {
    if (!customer || !ownedBusiness) return [];
    return bookings
      .filter((b) => {
        if (b.businessId !== ownedBusiness.businessId) return false;
        return customer.phone ? b.customerPhone === customer.phone : b.customerName === customer.name;
      })
      .sort((a, b) => getBookingDateTime(b.date, b.time).getTime() - getBookingDateTime(a.date, a.time).getTime());
  }, [bookings, customer, ownedBusiness]);

  if (!customer || !ownedBusiness) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <BackButton onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const handleCall = () => {
    if (customer.phone) Linking.openURL(`tel:${customer.phone}`);
  };

  const handleNewAppointment = () => {
    const params = new URLSearchParams({ customerName: customer.name });
    if (customer.phone) params.set('customerPhone', customer.phone);
    if (customer.email) params.set('customerEmail', customer.email);
    router.push(`/schedule?${params.toString()}`);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Customer</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.contactHeader}>
            <Text style={styles.customerName}>{customer.name}</Text>
            {customer.phone ? (
              <View style={styles.callButtonWrapper}>
                <Button
                  label="Call"
                  variant="secondary"
                  icon={<PhoneIcon size={16} color={colors.text.primary} />}
                  onPress={handleCall}
                  style={styles.callButton}
                />
              </View>
            ) : null}
          </View>
          {customer.phone ? <Text style={styles.contactLine}>{customer.phone}</Text> : null}
          {customer.email ? <Text style={styles.contactLine}>{customer.email}</Text> : null}
        </View>

        <Button label="New appointment" onPress={handleNewAppointment} />

        <View>
          <Text style={styles.sectionLabel}>Appointment history</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyHint}>No appointments with this customer yet.</Text>
          ) : (
            <View style={styles.historyList}>
              {history.map((booking) => (
                <AppointmentCard
                  key={booking.bookingId}
                  booking={booking}
                  onPress={() => router.push(`/appointment/${booking.bookingId}`)}
                />
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
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  card: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.card,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  customerName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  callButtonWrapper: {
    flexShrink: 0,
  },
  callButton: {
    marginTop: 0,
    paddingHorizontal: spacing.lg,
  },
  contactLine: {
    ...typography.body,
    color: colors.text.secondary,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  historyList: {
    gap: spacing.md,
  },
});

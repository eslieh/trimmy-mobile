import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar } from '../../../components/Avatar';
import { BackButton } from '../../../components/BackButton';
import { Button } from '../../../components/Button';
import { createBooking } from '../../../api/booking';
import { getBusinessProfile } from '../../../api/discovery';
import { useAuth } from '../../../contexts/AuthContext';
import { useBookingDraftStore } from '../../../store/useBookingDraftStore';
import { useBookingsStore } from '../../../store/useBookingsStore';
import { useCartStore } from '../../../store/useCartStore';
import { colors, radii, shadows, spacing, typography } from '../../../theme';
import { formatBookingDate } from '../../../utils/date';
import type { Money } from '../../../types/business';
import type { BusinessProfile } from '../../../types/discovery';
import type { BookingServiceLine } from '../../../types/booking';

function computeDeposit(profile: BusinessProfile, services: BookingServiceLine[]): Money | null {
  const { deposit } = profile.policies;
  if (!deposit.required) return null;

  // selected_services: only the listed services take a deposit, so a booking
  // with none of them needs no deposit at all.
  const covered =
    deposit.appliesTo === 'selected_services'
      ? services.filter((service) => (deposit.serviceIds ?? []).includes(service.serviceId))
      : services;
  if (covered.length === 0) return null;

  if (deposit.type === 'fixed') {
    return deposit.amount ? { amount: deposit.amount.amount, currency: 'KES' } : null;
  }
  const coveredTotal = covered.reduce((sum, service) => sum + service.price.amount * service.quantity, 0);
  return { amount: Math.round((coveredTotal * (deposit.percent ?? 0)) / 100), currency: 'KES' };
}

export function ReviewPoliciesScreen() {
  const router = useRouter();
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const draft = useBookingDraftStore();
  const addBooking = useBookingsStore((s) => s.addBooking);
  const clearCart = useCartStore((s) => s.clear);
  const { user } = useAuth();
  const customerName = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Guest' : 'Guest';

  useEffect(() => {
    getBusinessProfile(businessId).then(setProfile);
  }, [businessId]);

  const totalAmount = useMemo(
    () => draft.services.reduce((sum, service) => sum + service.price.amount * service.quantity, 0),
    [draft.services],
  );
  const totalDuration = useMemo(
    () => draft.services.reduce((sum, service) => sum + service.durationMinutes * service.quantity, 0),
    [draft.services],
  );
  const depositAmount = profile ? computeDeposit(profile, draft.services) : null;
  const staffMember = profile && draft.staffId ? profile.staff.find((s) => s.staffId === draft.staffId) : null;

  const handleConfirm = async () => {
    if (!profile || !draft.date || !draft.time) return;
    setSubmitting(true);
    try {
      const booking = await createBooking({
        businessId,
        businessName: profile.name,
        customerName,
        staffId: draft.staffId,
        staffName: draft.staffName,
        services: draft.services,
        date: draft.date,
        time: draft.time,
        durationMinutes: totalDuration,
        totalAmount: { amount: totalAmount, currency: 'KES' },
        depositAmount,
      });
      draft.setCurrentBooking(booking);

      if (booking.status === 'confirmed') {
        addBooking(booking);
        clearCart();
        router.replace(`/business/${businessId}/book/confirmed`);
      } else {
        router.push(`/business/${businessId}/book/payment`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile || !draft.date || !draft.time) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ActivityIndicator style={styles.loading} color={colors.text.secondary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Review & confirm</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardRowHeader}>
            <Text style={styles.cardLabel}>Services</Text>
            <Pressable onPress={() => router.push(`/business/${businessId}/services`)}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>
          {draft.services.map((service) => (
            <View key={service.serviceId} style={styles.serviceLine}>
              <Text style={styles.serviceLineName}>
                {service.quantity > 1 ? `${service.quantity}× ` : ''}
                {service.name}
              </Text>
              <Text style={styles.serviceLinePrice}>KSh {service.price.amount * service.quantity}</Text>
            </View>
          ))}
          <Text style={styles.cardMeta}>{totalDuration} min total</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRowHeader}>
            <Text style={styles.cardLabel}>Staff</Text>
            <Pressable onPress={() => router.push(`/business/${businessId}/book/staff`)}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>
          <View style={styles.staffRow}>
            {staffMember ? (
              <Avatar name={staffMember.name} uri={staffMember.avatarUrl} size={40} />
            ) : (
              <View style={styles.anyAvatar}>
                <Text style={styles.anyAvatarText}>?</Text>
              </View>
            )}
            <View>
              <Text style={styles.cardValue}>{draft.staffName}</Text>
              {staffMember ? <Text style={styles.cardMeta}>{staffMember.role}</Text> : null}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRowHeader}>
            <Text style={styles.cardLabel}>Date & time</Text>
            <Pressable onPress={() => router.push(`/business/${businessId}/book/datetime`)}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>
          <Text style={styles.cardValue}>
            {formatBookingDate(draft.date)} · {draft.time}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Amount due at business</Text>
            <Text style={styles.totalValue}>KSh {totalAmount}</Text>
          </View>
          {depositAmount ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Deposit to pay now</Text>
              <Text style={styles.depositValue}>KSh {depositAmount.amount}</Text>
            </View>
          ) : (
            <Text style={styles.cardMeta}>No deposit required — pay at the business.</Text>
          )}
        </View>

        <View style={styles.policyCard}>
          <Text style={styles.policyText}>
            Free cancellation up to {profile.policies.cancellation.freeCancellationHours}h before your appointment,
            {' '}{profile.policies.cancellation.lateFeePercent}% fee after.
          </Text>
          <Text style={styles.policyText}>No-show fee: {profile.policies.noShow.feePercent}% of the total.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={depositAmount ? 'Continue to payment' : 'Confirm booking'}
          onPress={handleConfirm}
          disabled={submitting}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loading: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
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
  cardRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    ...typography.label,
    color: colors.text.secondary,
  },
  editLink: {
    ...typography.label,
    color: colors.brand.purple,
  },
  cardValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  anyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anyAvatarText: {
    ...typography.h3,
    color: colors.text.secondary,
  },
  serviceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceLineName: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  serviceLinePrice: {
    ...typography.body,
    color: colors.text.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  totalLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  totalValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  depositValue: {
    ...typography.bodyMedium,
    color: colors.brand.purple,
  },
  policyCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  policyText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
});

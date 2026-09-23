import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PhoneInput } from '../../components/PhoneInput';
import { StaffPicker } from '../../components/StaffPicker';
import { CheckmarkIcon } from '../../components/icons/CheckmarkIcon';
import { createWalkInBooking } from '../../api/booking';
import { useBookingsStore } from '../../store/useBookingsStore';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { useCustomersStore } from '../../store/useCustomersStore';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { countries } from '../../data/countries';
import { normalizePhoneNumber } from '../../utils/phone';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import type { BookingServiceLine } from '../../types/booking';

const DEFAULT_COUNTRY = countries.find((c) => c.iso2 === 'KE') ?? countries[0];

// Reached from the Today tab's "+" — a walk-in customer is physically
// present, so this just picks from the live service menu and starts the job
// immediately (no date/time picking, uses right now). Separate from
// ScheduleAppointmentScreen ("Calendar" tab's "+" / tapping an open slot),
// which is for booking someone in for later. Customer name/phone/email is
// still saved to useCustomersStore so it's recognized next time, same as
// scheduling.
export function StartWalkInScreen() {
  const router = useRouter();
  const ownedBusiness = useOwnedBusinessStore((s) => s.business);
  const serviceCategories = useBusinessOnboardingStore((s) => s.serviceCategories);
  const services = useBusinessOnboardingStore((s) => s.services);
  const invitations = useBusinessOnboardingStore((s) => s.invitations);
  const addBooking = useBookingsStore((s) => s.addBooking);
  const saveCustomer = useCustomersStore((s) => s.saveCustomer);

  const staffMembers = useMemo(
    () => invitations.filter((i) => i.role === 'staff' && i.status !== 'declined'),
    [invitations],
  );

  const [customerName, setCustomerName] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [rawPhone, setRawPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assignedStaffId, setAssignedStaffId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedIds.includes(s.serviceId)),
    [services, selectedIds],
  );
  const totalAmount = selectedServices.reduce((sum, s) => sum + s.price.amount, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const currency = selectedServices[0]?.price.currency ?? 'KES';

  const toggleService = (serviceId: string) => {
    setSelectedIds((current) =>
      current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    );
  };

  if (!ownedBusiness) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <BackButton onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const canSubmit = selectedServices.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    const serviceLines: BookingServiceLine[] = selectedServices.map((service) => ({
      serviceId: service.serviceId,
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price,
      quantity: 1,
    }));

    const trimmedName = customerName.trim();
    const customerPhone = rawPhone.length >= 4 ? normalizePhoneNumber(rawPhone, country) : null;
    const customerEmail = email.trim() || null;

    if (trimmedName || customerPhone || customerEmail) {
      await saveCustomer(ownedBusiness.businessId, {
        name: trimmedName || 'Walk-in customer',
        phone: customerPhone,
        email: customerEmail,
      });
    }

    const assignedStaff = staffMembers.find((m) => m.invitationId === assignedStaffId);

    const booking = await createWalkInBooking({
      businessId: ownedBusiness.businessId,
      businessName: ownedBusiness.name,
      customerName: trimmedName || 'Walk-in customer',
      customerPhone,
      customerEmail,
      services: serviceLines,
      durationMinutes: totalDuration,
      totalAmount: { amount: totalAmount, currency },
      staffId: assignedStaff?.invitationId ?? null,
      staffName: assignedStaff?.name ?? assignedStaff?.phone ?? assignedStaff?.email ?? 'Walk-in',
    });

    addBooking(booking);
    setIsSubmitting(false);
    router.replace(`/appointment/${booking.bookingId}`);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>New walk-in</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.sectionLabel}>Customer</Text>
          <Text style={styles.sectionHint}>Saved to your customer list for next time.</Text>
        </View>
        <Input
          label="Name (optional)"
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Walk-in customer"
        />
        <PhoneInput
          label="Phone (optional)"
          country={country}
          onCountryChange={setCountry}
          value={rawPhone}
          onChangeText={setRawPhone}
        />
        <Input
          label="Email (optional)"
          value={email}
          onChangeText={setEmail}
          placeholder="jane@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {staffMembers.length > 0 ? (
          <StaffPicker label="Assign to" staffMembers={staffMembers} value={assignedStaffId} onChange={setAssignedStaffId} />
        ) : null}

        <Text style={styles.sectionLabel}>Select services</Text>

        {serviceCategories.length === 0 ? (
          <Text style={styles.emptyHint}>No services yet — add some from the Business tab first.</Text>
        ) : (
          serviceCategories.map((category) => {
            const categoryServices = services.filter((s) => s.categoryId === category.categoryId);
            if (categoryServices.length === 0) return null;
            return (
              <View key={category.categoryId} style={styles.categoryCard}>
                <Text style={styles.categoryName}>{category.name}</Text>
                {categoryServices.map((service) => {
                  const selected = selectedIds.includes(service.serviceId);
                  return (
                    <Pressable
                      key={service.serviceId}
                      style={styles.serviceRow}
                      onPress={() => toggleService(service.serviceId)}
                    >
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <Text style={styles.serviceMeta}>
                          {service.durationMinutes} min · {service.price.currency} {service.price.amount}
                        </Text>
                      </View>
                      {selected ? <CheckmarkIcon size={18} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.footer}>
        {selectedServices.length > 0 ? (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {currency} {totalAmount}
            </Text>
          </View>
        ) : null}
        <Button label={isSubmitting ? 'Starting…' : 'Start service'} disabled={!canSubmit} onPress={handleSubmit} />
      </View>
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
  sectionLabel: {
    ...typography.label,
    color: colors.text.primary,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  categoryCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  categoryName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  serviceMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    gap: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  totalValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
});

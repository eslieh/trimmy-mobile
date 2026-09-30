import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PhoneInput } from '../../components/PhoneInput';
import { StaffPicker } from '../../components/StaffPicker';
import { CheckmarkIcon } from '../../components/icons/CheckmarkIcon';
import { createScheduledBooking } from '../../api/booking';
import { useBookingsStore } from '../../store/useBookingsStore';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { useCustomersStore } from '../../store/useCustomersStore';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { countries } from '../../data/countries';
import { normalizePhoneNumber } from '../../utils/phone';
import { getTimeSlots, getUpcomingDays } from '../../utils/availability';
import { formatBookingDate } from '../../utils/date';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import type { BookingServiceLine } from '../../types/booking';
import { showApiError } from '../../utils/showApiError';
import { useBusinessContext } from '../../hooks/useBusinessContext';

const DEFAULT_COUNTRY = countries.find((c) => c.iso2 === 'KE') ?? countries[0];

// Reached from the Calendar tab's "+" (no date/time preset — pick from
// scratch), by tapping an open slot on a Calendar day (date/time already
// chosen — shows as a locked summary with a "Change" link instead of the
// full picker, Google Calendar-style), or from a customer's detail screen's
// "New appointment" (customerName/Phone/Email preset instead — phone is
// recovered from its stored E.164 string via parsePhoneNumberFromString,
// same approach as EditBusinessInfoScreen). Separate from StartWalkInScreen
// ("now" — the customer is already physically present); this books someone
// in for later, so the appointment stays 'confirmed' until check-in.
export function ScheduleAppointmentScreen() {
  const router = useRouter();
  const {
    date: presetDate,
    time: presetTime,
    customerName: presetCustomerName,
    customerPhone: presetCustomerPhone,
    customerEmail: presetCustomerEmail,
  } = useLocalSearchParams<{
    date?: string;
    time?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  }>();
  // Owner or front desk (see hooks/useBusinessContext).
  const business = useBusinessContext();
  const serviceCategories = useMemo(() => business?.serviceCategories ?? [], [business]);
  const services = useMemo(() => business?.services ?? [], [business]);
  const addBooking = useBookingsStore((s) => s.addBooking);
  const saveCustomer = useCustomersStore((s) => s.saveCustomer);

  const staffMembers = useMemo(() => business?.staff ?? [], [business]);

  const presetParsedPhone = presetCustomerPhone ? parsePhoneNumberFromString(presetCustomerPhone) : undefined;
  const presetCountry =
    (presetParsedPhone?.country && countries.find((c) => c.iso2 === presetParsedPhone.country)) || DEFAULT_COUNTRY;

  const [customerName, setCustomerName] = useState(presetCustomerName ?? '');
  const [country, setCountry] = useState(presetCountry);
  const [rawPhone, setRawPhone] = useState(presetParsedPhone?.nationalNumber?.toString() ?? '');
  const [email, setEmail] = useState(presetCustomerEmail ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(presetDate ?? null);
  const [selectedTime, setSelectedTime] = useState<string | null>(presetTime ?? null);
  const [pickerLocked, setPickerLocked] = useState(Boolean(presetDate && presetTime));
  const [assignedStaffId, setAssignedStaffId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedIds.includes(s.serviceId)),
    [services, selectedIds],
  );
  const totalAmount = selectedServices.reduce((sum, s) => sum + s.price.amount, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const currency = selectedServices[0]?.price.currency ?? 'KES';

  const days = useMemo(
    () => (business?.workingHours ? getUpcomingDays(business.workingHours, 14) : []),
    [business],
  );
  const timeSlots = useMemo(
    () =>
      business?.workingHours && selectedDate
        ? getTimeSlots(business.workingHours, selectedDate, totalDuration)
        : [],
    [business, selectedDate, totalDuration],
  );

  const toggleService = (serviceId: string) => {
    setSelectedIds((current) =>
      current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    );
  };

  if (!business) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <BackButton onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const trimmedName = customerName.trim();
  const canSubmit =
    selectedServices.length > 0 &&
    trimmedName.length > 0 &&
    selectedDate !== null &&
    selectedTime !== null &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedDate || !selectedTime) return;
    setIsSubmitting(true);

    const serviceLines: BookingServiceLine[] = selectedServices.map((service) => ({
      serviceId: service.serviceId,
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price,
      quantity: 1,
    }));

    const customerPhone = rawPhone.length >= 4 ? normalizePhoneNumber(rawPhone, country) : null;
    const customerEmail = email.trim() || null;

    // Bookings with a phone add the customer server-side; only someone
    // entered without a phone needs saving explicitly.
    if (!customerPhone) {
      await saveCustomer(business.businessId, { name: trimmedName, phone: null, email: customerEmail });
    }

    const assignedStaff = staffMembers.find((m) => m.staffId === assignedStaffId);

    try {
      const booking = await createScheduledBooking(
        {
          businessId: business.businessId,
          customerName: trimmedName,
          customerPhone,
          customerEmail,
          services: serviceLines.map((line) => ({ serviceId: line.serviceId, quantity: line.quantity })),
          date: selectedDate,
          time: selectedTime,
          staffId: assignedStaff?.staffId ?? null,
        },
        {
          businessName: business.name,
          staffName: assignedStaff ? assignedStaff.name : 'Any available',
          lines: serviceLines,
        },
      );
      addBooking(booking);
      router.back();
    } catch (err) {
      // e.g. outside working hours, in the past, or 409 slot_unavailable.
      showApiError("Couldn't schedule the appointment", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Schedule appointment</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.sectionLabel}>Customer</Text>
          <Text style={styles.sectionHint}>Saved to your customer list for next time.</Text>
        </View>
        <Input label="Name" value={customerName} onChangeText={setCustomerName} placeholder="Jane Doe" />
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

        <View>
          <Text style={styles.sectionLabel}>Date & time</Text>

          {pickerLocked && selectedDate && selectedTime ? (
            <View style={styles.lockedRow}>
              <Text style={styles.lockedText}>
                {formatBookingDate(selectedDate)} · {selectedTime}
              </Text>
              <Pressable onPress={() => setPickerLocked(false)} hitSlop={8}>
                <Text style={styles.changeLink}>Change</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
                {days.map((day) => {
                  const selected = day.date === selectedDate;
                  return (
                    <Pressable
                      key={day.date}
                      disabled={!day.isOpen}
                      style={[
                        styles.dayPill,
                        selected && styles.dayPillSelected,
                        !day.isOpen && styles.dayPillDisabled,
                      ]}
                      onPress={() => {
                        setSelectedDate(day.date);
                        setSelectedTime(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.dayWeekday,
                          selected && styles.dayTextSelected,
                          !day.isOpen && styles.dayTextDisabled,
                        ]}
                      >
                        {day.weekdayLabel}
                      </Text>
                      <Text
                        style={[
                          styles.dayNumber,
                          selected && styles.dayTextSelected,
                          !day.isOpen && styles.dayTextDisabled,
                        ]}
                      >
                        {day.dayNumber}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {selectedDate ? (
                timeSlots.length === 0 ? (
                  <Text style={styles.emptyHint}>
                    {selectedServices.length === 0
                      ? 'Select services first to see available times.'
                      : 'No time slots left on this day — try another date.'}
                  </Text>
                ) : (
                  <View style={styles.timeGrid}>
                    {timeSlots.map((slot) => {
                      const selected = slot === selectedTime;
                      return (
                        <Pressable
                          key={slot}
                          style={[styles.timeSlot, selected && styles.timeSlotSelected]}
                          onPress={() => {
                            setSelectedTime(slot);
                            setPickerLocked(true);
                          }}
                        >
                          <Text style={[styles.timeSlotText, selected && styles.timeSlotTextSelected]}>{slot}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )
              ) : null}
            </>
          )}
        </View>

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
        <Button
          label={isSubmitting ? 'Saving…' : 'Schedule appointment'}
          disabled={!canSubmit}
          onPress={handleSubmit}
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
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  lockedText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  changeLink: {
    ...typography.bodyMedium,
    color: colors.brand.purple,
  },
  dayScroll: {
    flexGrow: 0,
    marginTop: spacing.sm,
    marginHorizontal: -spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
  dayPill: {
    width: 52,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  dayPillSelected: {
    borderColor: colors.brand.purple,
    backgroundColor: colors.brand.purple,
  },
  dayPillDisabled: {
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.secondary,
  },
  dayWeekday: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  dayNumber: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginTop: 2,
  },
  dayTextSelected: {
    color: colors.white,
  },
  dayTextDisabled: {
    color: colors.text.tertiary,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  timeSlot: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  timeSlotSelected: {
    borderColor: colors.brand.purple,
    backgroundColor: colors.brand.purple,
  },
  timeSlotText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  timeSlotTextSelected: {
    color: colors.white,
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

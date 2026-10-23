import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../../components/AuthScreenLayout';
import { Button } from '../../../components/Button';
import { getAvailability, getAvailabilityDays, type AvailabilityDay, type AvailabilitySlot } from '../../../api/availability';
import { getApiErrorCode, getApiErrorMessage } from '../../../api/client';
import { rescheduleBooking } from '../../../api/booking';
import { useBookingsStore } from '../../../store/useBookingsStore';
import { useBookingDraftStore } from '../../../store/useBookingDraftStore';
import { colors, radii, spacing, typography } from '../../../theme';

const TOTAL_STEPS = 4;
const DAYS_AHEAD = 14;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Dates are business-local YYYY-MM-DD; noon keeps the weekday right in any
// device timezone.
function dayLabels(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return { weekdayLabel: WEEKDAYS[d.getDay()], dayNumber: d.getDate() };
}

// Days and start times come from the server (get-availability-days /
// get-availability), which knows staff schedules, booking settings and
// existing bookings — the app no longer computes slots from working hours.
export function SelectDateTimeScreen() {
  const router = useRouter();
  // reschedule=<bookingId>: moving an existing booking (Appointment Detail →
  // Reschedule, BK-61) instead of making a new one — Continue saves the new
  // time directly rather than going on to Review.
  const { businessId, reschedule } = useLocalSearchParams<{ businessId: string; reschedule?: string }>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [slotsVersion, setSlotsVersion] = useState(0);

  const draftServices = useBookingDraftStore((s) => s.services);
  const staffId = useBookingDraftStore((s) => s.staffId);
  const date = useBookingDraftStore((s) => s.date);
  const time = useBookingDraftStore((s) => s.time);
  const setDateTime = useBookingDraftStore((s) => s.setDateTime);

  const [days, setDays] = useState<AvailabilityDay[] | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[] | null>(null);
  const [error, setError] = useState('');

  const serviceIdsKey = draftServices.map((s) => s.serviceId).join(',');
  const query = useMemo(
    () => ({ serviceIds: draftServices.map((s) => s.serviceId), staffId }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serviceIdsKey, staffId],
  );

  useEffect(() => {
    setDays(null);
    setError('');
    getAvailabilityDays(businessId, query, DAYS_AHEAD)
      .then((res) => {
        setDays(res.days);
        setDurationMinutes(res.durationMinutes);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load available days.")));
  }, [businessId, query]);

  const selectedDate = date ?? days?.find((d) => d.hasSlots)?.date ?? null;

  useEffect(() => {
    if (!selectedDate) return;
    setSlots(null);
    getAvailability(businessId, selectedDate, query)
      .then((res) => {
        setSlots(res.slots);
        // A previously picked time that's no longer offered (taken since,
        // or staff changed) must not carry through to Review.
        if (time && !res.slots.some((slot) => slot.time === time)) setDateTime(selectedDate, '');
      })
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load times.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, selectedDate, query, slotsVersion]);

  const handlePickDate = (dateKey: string) => {
    setDateTime(dateKey, '');
  };

  const handleSaveReschedule = async () => {
    if (!reschedule || !selectedDate || !time) return;
    setSaving(true);
    setSaveError('');
    try {
      const moved = await rescheduleBooking(reschedule, { date: selectedDate, time, staffId: staffId ?? undefined });
      useBookingsStore.getState().upsertBooking(moved);
      router.back();
    } catch (err) {
      if (getApiErrorCode(err) === 'slot_unavailable') {
        // Taken meanwhile — reload this day's times and pick again.
        setDateTime(selectedDate, '');
        setSlotsVersion((v) => v + 1);
      }
      setSaveError(getApiErrorMessage(err, "Couldn't move your appointment."));
    } finally {
      setSaving(false);
    }
  };

  const handlePickTime = (timeValue: string) => {
    if (selectedDate) setDateTime(selectedDate, timeValue);
  };

  if (!days) {
    return (
      <AuthScreenLayout title="Pick a date & time" progress={2 / TOTAL_STEPS} onBack={() => router.back()}>
        {error ? <Text style={styles.emptyText}>{error}</Text> : <ActivityIndicator color={colors.text.secondary} />}
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      title="Pick a date & time"
      subtitle={durationMinutes ? `Takes about ${durationMinutes} min in total.` : undefined}
      progress={2 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <>
          {saveError ? <Text style={styles.emptyText}>{saveError}</Text> : null}
          <Button
            label={reschedule ? (saving ? 'Saving…' : 'Move appointment') : 'Continue'}
            disabled={!selectedDate || !time || saving}
            onPress={reschedule ? handleSaveReschedule : () => router.push(`/business/${businessId}/book/review`)}
          />
        </>
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
        {days.map((day) => {
          const selected = day.date === selectedDate;
          const bookable = day.hasSlots;
          const { weekdayLabel, dayNumber } = dayLabels(day.date);
          return (
            <Pressable
              key={day.date}
              disabled={!bookable}
              style={[styles.dayPill, selected && styles.dayPillSelected, !bookable && styles.dayPillDisabled]}
              onPress={() => handlePickDate(day.date)}
            >
              <Text style={[styles.dayWeekday, selected && styles.dayTextSelected, !bookable && styles.dayTextDisabled]}>
                {weekdayLabel}
              </Text>
              <Text style={[styles.dayNumber, selected && styles.dayTextSelected, !bookable && styles.dayTextDisabled]}>
                {dayNumber}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionTitle}>Available times</Text>
      {error ? (
        <Text style={styles.emptyText}>{error}</Text>
      ) : !selectedDate ? (
        <Text style={styles.emptyText}>No open times in the next two weeks — try another staff member.</Text>
      ) : !slots ? (
        <ActivityIndicator color={colors.text.secondary} />
      ) : slots.length === 0 ? (
        <Text style={styles.emptyText}>No time slots left on this day — try another date.</Text>
      ) : (
        <View style={styles.timeGrid}>
          {slots.map((slot) => {
            const selected = slot.time === time;
            return (
              <Pressable
                key={slot.time}
                style={[styles.timeSlot, selected && styles.timeSlotSelected]}
                onPress={() => handlePickTime(slot.time)}
              >
                <Text style={[styles.timeSlotText, selected && styles.timeSlotTextSelected]}>{slot.time}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  dayScroll: {
    flexGrow: 0,
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
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
});

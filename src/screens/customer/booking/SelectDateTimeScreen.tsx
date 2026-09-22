import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../../components/AuthScreenLayout';
import { Button } from '../../../components/Button';
import { getBusinessProfile } from '../../../api/discovery';
import { useBookingDraftStore } from '../../../store/useBookingDraftStore';
import { getTimeSlots, getUpcomingDays } from '../../../utils/availability';
import { colors, radii, spacing, typography } from '../../../theme';
import type { BusinessProfile } from '../../../types/discovery';

const TOTAL_STEPS = 4;

export function SelectDateTimeScreen() {
  const router = useRouter();
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  const draftServices = useBookingDraftStore((s) => s.services);
  const date = useBookingDraftStore((s) => s.date);
  const time = useBookingDraftStore((s) => s.time);
  const setDateTime = useBookingDraftStore((s) => s.setDateTime);

  useEffect(() => {
    getBusinessProfile(businessId).then(setProfile);
  }, [businessId]);

  const totalDuration = useMemo(
    () => draftServices.reduce((sum, service) => sum + service.durationMinutes * service.quantity, 0),
    [draftServices],
  );

  const days = useMemo(() => (profile ? getUpcomingDays(profile.workingHours, 10) : []), [profile]);

  const selectedDate = date ?? days.find((d) => d.isOpen)?.date ?? null;

  const timeSlots = useMemo(
    () => (profile && selectedDate ? getTimeSlots(profile.workingHours, selectedDate, totalDuration) : []),
    [profile, selectedDate, totalDuration],
  );

  const handlePickDate = (dateKey: string) => {
    setDateTime(dateKey, '');
  };

  const handlePickTime = (timeValue: string) => {
    if (selectedDate) setDateTime(selectedDate, timeValue);
  };

  if (!profile) {
    return (
      <AuthScreenLayout title="Pick a date & time" progress={2 / TOTAL_STEPS} onBack={() => router.back()}>
        <ActivityIndicator color={colors.text.secondary} />
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      title="Pick a date & time"
      subtitle={`Takes about ${totalDuration} min in total.`}
      progress={2 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <Button
          label="Continue"
          disabled={!selectedDate || !time}
          onPress={() => router.push(`/business/${businessId}/book/review`)}
        />
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
        {days.map((day) => {
          const selected = day.date === selectedDate;
          return (
            <Pressable
              key={day.date}
              disabled={!day.isOpen}
              style={[styles.dayPill, selected && styles.dayPillSelected, !day.isOpen && styles.dayPillDisabled]}
              onPress={() => handlePickDate(day.date)}
            >
              <Text style={[styles.dayWeekday, selected && styles.dayTextSelected, !day.isOpen && styles.dayTextDisabled]}>
                {day.weekdayLabel}
              </Text>
              <Text style={[styles.dayNumber, selected && styles.dayTextSelected, !day.isOpen && styles.dayTextDisabled]}>
                {day.dayNumber}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionTitle}>Available times</Text>
      {timeSlots.length === 0 ? (
        <Text style={styles.emptyText}>
          {selectedDate ? 'No time slots left on this day — try another date.' : 'Choose a date to see times.'}
        </Text>
      ) : (
        <View style={styles.timeGrid}>
          {timeSlots.map((slot) => {
            const selected = slot === time;
            return (
              <Pressable
                key={slot}
                style={[styles.timeSlot, selected && styles.timeSlotSelected]}
                onPress={() => handlePickTime(slot)}
              >
                <Text style={[styles.timeSlotText, selected && styles.timeSlotTextSelected]}>{slot}</Text>
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

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { TimePickerField } from '../../components/TimePickerField';
import { Button } from '../../components/Button';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { colors, radii, spacing, typography } from '../../theme';
import type { DayHours, WeeklyHours } from '../../types/business';

const TOTAL_STEPS = 11;

const DAYS: { key: keyof WeeklyHours; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

// Pre-filled sensible default so most owners can just accept and continue —
// same "one-tap accept or customize" philosophy as the policy defaults.
const DEFAULT_HOURS: WeeklyHours = {
  monday: { open: '09:00', close: '19:00' },
  tuesday: { open: '09:00', close: '19:00' },
  wednesday: { open: '09:00', close: '19:00' },
  thursday: { open: '09:00', close: '19:00' },
  friday: { open: '09:00', close: '20:00' },
  saturday: { open: '09:00', close: '20:00' },
  sunday: null,
};

const FALLBACK_HOURS: DayHours = { open: '09:00', close: '19:00' };

export function WorkingHoursScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';
  const draftHours = useBusinessOnboardingStore((s) => s.business?.workingHours);
  const submitWorkingHours = useBusinessOnboardingStore((s) => s.submitWorkingHours);
  const isSubmitting = useBusinessOnboardingStore((s) => s.isSubmitting);
  const error = useBusinessOnboardingStore((s) => s.error);

  const [hours, setHours] = useState<WeeklyHours>(draftHours ?? DEFAULT_HOURS);

  const toggleDay = (key: keyof WeeklyHours) => {
    setHours((current) => ({
      ...current,
      [key]: current[key] ? null : FALLBACK_HOURS,
    }));
  };

  const updateDayField = (key: keyof WeeklyHours, field: 'open' | 'close', value: string) => {
    setHours((current) => {
      const day = current[key];
      if (!day) return current;
      return { ...current, [key]: { ...day, [field]: value } };
    });
  };

  const handleContinue = async () => {
    // The store keeps the error for the inline message — stay on this step.
    try {
      await submitWorkingHours(hours);
    } catch {
      return;
    }
    if (isEditMode) {
      router.back();
    } else {
      router.push('/business-services');
    }
  };

  return (
    <AuthScreenLayout
      title="Set your working hours"
      subtitle="Customers can only book during these times. You can change this anytime."
      progress={isEditMode ? undefined : 6 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={isSubmitting ? 'Saving…' : isEditMode ? 'Save' : 'Continue'}
            disabled={isSubmitting}
            onPress={handleContinue}
          />
        </>
      }
    >
      {DAYS.map(({ key, label }) => {
        const day = hours[key];
        return (
          <View key={key} style={styles.dayRow}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{label}</Text>
              <Pressable
                onPress={() => toggleDay(key)}
                style={[styles.pill, day ? styles.pillSelected : styles.pillUnselected]}
              >
                <Text style={[styles.pillText, day ? styles.pillTextSelected : styles.pillTextUnselected]}>
                  {day ? 'Open' : 'Closed'}
                </Text>
              </Pressable>
            </View>

            {day ? (
              <View style={styles.timeRow}>
                <TimePickerField
                  label="Opens"
                  value={day.open}
                  onChange={(value) => updateDayField(key, 'open', value)}
                />
                <TimePickerField
                  label="Closes"
                  value={day.close}
                  onChange={(value) => updateDayField(key, 'close', value)}
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  dayRow: {
    gap: spacing.sm,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  pillSelected: {
    backgroundColor: colors.pill.selectedBg,
  },
  pillUnselected: {
    backgroundColor: colors.pill.unselectedBg,
  },
  pillText: {
    ...typography.caption,
  },
  pillTextSelected: {
    color: colors.pill.selectedText,
  },
  pillTextUnselected: {
    color: colors.pill.unselectedText,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
  },
});

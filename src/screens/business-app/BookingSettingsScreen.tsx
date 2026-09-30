import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { getApiErrorMessage } from '../../api/client';
import { colors, radii, spacing, typography } from '../../theme';
import type { BookingSettings } from '../../types/business';

// The server's allowed start-time grids (must divide an hour evenly).
const SLOT_INTERVALS = [5, 10, 15, 20, 30, 60];

// Same defaults the server applies until the owner changes anything.
const DEFAULT_SETTINGS: BookingSettings = {
  timezone: 'Africa/Nairobi',
  slotIntervalMinutes: 15,
  bufferMinutes: 0,
  minLeadMinutes: 30,
  maxDaysAhead: 30,
};

// Manage Business → Booking rules. These drive the slots customers see
// (get-availability): the start-time grid, a buffer kept free after each
// booking, how soon the earliest slot can be, and how far ahead people can
// book. Only changed fields are sent.
export function BookingSettingsScreen() {
  const router = useRouter();
  const business = useBusinessOnboardingStore((s) => s.business);
  const saveBookingSettings = useBusinessOnboardingStore((s) => s.saveBookingSettings);
  const current = business?.bookingSettings ?? DEFAULT_SETTINGS;

  const [slotInterval, setSlotInterval] = useState(current.slotIntervalMinutes);
  const [bufferText, setBufferText] = useState(String(current.bufferMinutes));
  const [leadText, setLeadText] = useState(String(current.minLeadMinutes));
  const [daysAheadText, setDaysAheadText] = useState(String(current.maxDaysAhead));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!business) return null;

  const next = {
    slotIntervalMinutes: slotInterval,
    bufferMinutes: Number(bufferText),
    minLeadMinutes: Number(leadText),
    maxDaysAhead: Number(daysAheadText),
  };
  const valid =
    Number.isInteger(next.bufferMinutes) &&
    next.bufferMinutes >= 0 &&
    Number.isInteger(next.minLeadMinutes) &&
    next.minLeadMinutes >= 0 &&
    Number.isInteger(next.maxDaysAhead) &&
    next.maxDaysAhead >= 1;
  const patch = Object.fromEntries(
    Object.entries(next).filter(([key, value]) => current[key as keyof BookingSettings] !== value),
  ) as Partial<BookingSettings>;
  const hasChanges = Object.keys(patch).length > 0;

  const handleSave = async () => {
    if (!valid || !hasChanges) return;
    setSaving(true);
    setError('');
    try {
      await saveBookingSettings(business.businessId, patch);
      router.back();
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't save booking rules."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Booking rules"
      subtitle={`Times are in ${current.timezone}.`}
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label={saving ? 'Saving…' : 'Save'} disabled={!valid || !hasChanges || saving} onPress={handleSave} />
        </>
      }
    >
      <View style={styles.section}>
        <Text style={styles.label}>Start times every</Text>
        <View style={styles.pillRow}>
          {SLOT_INTERVALS.map((minutes) => {
            const selected = minutes === slotInterval;
            return (
              <Pressable
                key={minutes}
                style={[styles.pill, selected && styles.pillSelected]}
                onPress={() => setSlotInterval(minutes)}
              >
                <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{minutes} min</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Input
        label="Buffer after each booking (minutes)"
        value={bufferText}
        onChangeText={setBufferText}
        keyboardType="number-pad"
        helperText="Time kept free for cleanup before the next appointment."
      />
      <Input
        label="Earliest booking (minutes from now)"
        value={leadText}
        onChangeText={setLeadText}
        keyboardType="number-pad"
        helperText="How much notice you need before a booking."
      />
      <Input
        label="Book up to (days ahead)"
        value={daysAheadText}
        onChangeText={setDaysAheadText}
        keyboardType="number-pad"
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.pill.unselectedBg,
  },
  pillSelected: {
    backgroundColor: colors.pill.selectedBg,
  },
  pillText: {
    ...typography.bodyMedium,
    color: colors.pill.unselectedText,
  },
  pillTextSelected: {
    color: colors.pill.selectedText,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
    marginBottom: 8,
  },
});

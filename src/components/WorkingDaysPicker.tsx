import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import type { WeeklyHours } from '../types/business';

const DAY_OPTIONS: { key: keyof WeeklyHours; label: string }[] = [
  { key: 'monday', label: 'Mo' },
  { key: 'tuesday', label: 'Tu' },
  { key: 'wednesday', label: 'We' },
  { key: 'thursday', label: 'Th' },
  { key: 'friday', label: 'Fr' },
  { key: 'saturday', label: 'Sa' },
  { key: 'sunday', label: 'Su' },
];

interface WorkingDaysPickerProps {
  label: string;
  value: (keyof WeeklyHours)[] | null; // null = follows the business's own working days
  onChange: (value: (keyof WeeklyHours)[] | null) => void;
}

// Which weekdays a team member works — a lighter concept than a full
// per-member WeeklyHours (exact open/close times), which would duplicate
// the business hours editor's complexity for something S4 (staff.md's
// "Availability" story, not built yet) is meant to cover in more detail.
// null means "follows the business's own working days" (the default);
// toggling any specific day switches to an explicit custom list.
export function WorkingDaysPicker({ label, value, onChange }: WorkingDaysPickerProps) {
  const isCustom = value !== null;

  const toggleDay = (day: keyof WeeklyHours) => {
    const current = value ?? [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    onChange(next);
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Pressable onPress={() => onChange(isCustom ? null : [])} hitSlop={8}>
          <Text style={styles.toggleLink}>{isCustom ? 'Follow business hours' : 'Set custom days'}</Text>
        </Pressable>
      </View>

      {isCustom ? (
        <View style={styles.dayRow}>
          {DAY_OPTIONS.map((option) => {
            const selected = value.includes(option.key);
            return (
              <Pressable
                key={option.key}
                style={[styles.dayPill, selected && styles.dayPillSelected]}
                onPress={() => toggleDay(option.key)}
              >
                <Text style={[styles.dayPillText, selected && styles.dayPillTextSelected]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={styles.followingHint}>Works whenever the business is open.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
  },
  toggleLink: {
    ...typography.caption,
    color: colors.brand.purple,
  },
  dayRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.pill.unselectedBg,
  },
  dayPillSelected: {
    backgroundColor: colors.pill.selectedBg,
  },
  dayPillText: {
    ...typography.caption,
    color: colors.pill.unselectedText,
  },
  dayPillTextSelected: {
    color: colors.pill.selectedText,
  },
  followingHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
});

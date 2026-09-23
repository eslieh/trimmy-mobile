import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import type { TeamInvitation } from '../types/team';

interface StaffPickerProps {
  label: string;
  staffMembers: TeamInvitation[];
  value: string | null; // invitationId, or null = "Any available"
  onChange: (value: string | null) => void;
}

// Who's actually doing the service — shared by StartWalkInScreen and
// ScheduleAppointmentScreen. Optional: leaving it on "Any available" is
// fine, same as online bookings' staffId can be null. Only offered when
// the business actually has staff invited (see callers) — nothing to pick
// from for a solo business.
export function StaffPicker({ label, staffMembers, value, onChange }: StaffPickerProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        <Pressable style={[styles.pill, value === null && styles.pillSelected]} onPress={() => onChange(null)}>
          <Text style={[styles.pillText, value === null && styles.pillTextSelected]}>Any available</Text>
        </Pressable>
        {staffMembers.map((member) => {
          const selected = value === member.invitationId;
          return (
            <Pressable
              key={member.invitationId}
              style={[styles.pill, selected && styles.pillSelected]}
              onPress={() => onChange(member.invitationId)}
            >
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                {member.name || member.phone || member.email}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  scroll: {
    flexGrow: 0,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.pill.unselectedBg,
    marginRight: spacing.sm,
    justifyContent: 'center',
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
});

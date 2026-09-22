import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../../components/AuthScreenLayout';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { CheckmarkIcon } from '../../../components/icons/CheckmarkIcon';
import { RatingLabel } from '../../../components/RatingLabel';
import { getBusinessProfile } from '../../../api/discovery';
import { useBookingDraftStore } from '../../../store/useBookingDraftStore';
import { colors, radii, spacing, typography } from '../../../theme';
import type { BusinessProfile } from '../../../types/discovery';

const TOTAL_STEPS = 4;

// First step of the booking flow (C2). The service selection itself already
// happened on BusinessServicesScreen — its "Continue" seeds the draft store
// with the chosen services before pushing here.
export function SelectStaffScreen() {
  const router = useRouter();
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  const staffId = useBookingDraftStore((s) => s.staffId);
  // staffId alone can't tell "nothing picked yet" apart from "Any available"
  // picked (both are null) — staffName is '' only in the former case.
  const staffName = useBookingDraftStore((s) => s.staffName);
  const setStaff = useBookingDraftStore((s) => s.setStaff);
  const draftServices = useBookingDraftStore((s) => s.services);

  useEffect(() => {
    getBusinessProfile(businessId).then(setProfile);
  }, [businessId]);

  useEffect(() => {
    // Landed here without a live draft (e.g. deep link / reload) — nothing
    // to book, bounce back to the business profile. Mount-only check: this
    // screen stays mounted in the background for the rest of the flow
    // (native-stack keeps pushed screens alive), and useBookingDraftStore's
    // reset() (called when the flow finishes) clears `services` — reacting
    // to that from a backgrounded screen would fire a stray router.replace
    // racing the confirmation screen's own navigation and corrupt router
    // state. Only the entry check matters, so this must not re-run later.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (draftServices.length === 0) {
      router.replace(`/business/${businessId}`);
    }
  }, []);

  const hasSelection = staffName !== '';

  if (!profile) {
    return (
      <AuthScreenLayout title="Choose a staff member" progress={1 / TOTAL_STEPS} onBack={() => router.back()}>
        <ActivityIndicator color={colors.text.secondary} />
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      title="Choose a staff member"
      subtitle="Or let us pick anyone available."
      progress={1 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <Button
          label="Continue"
          disabled={!hasSelection}
          onPress={() => router.push(`/business/${businessId}/book/datetime`)}
        />
      }
    >
      <Pressable
        style={[styles.row, staffId === null && hasSelection && styles.rowSelected]}
        onPress={() => setStaff(null, 'Any available')}
      >
        <View style={styles.anyAvatar}>
          <Text style={styles.anyAvatarText}>?</Text>
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>Any available</Text>
          <Text style={styles.rowMeta}>Fastest booking, first free staff member</Text>
        </View>
        {staffId === null && hasSelection ? <CheckmarkIcon size={18} color={colors.brand.purple} /> : null}
      </Pressable>

      {profile.staff.map((member) => {
        const selected = staffId === member.staffId;
        return (
          <Pressable
            key={member.staffId}
            style={[styles.row, selected && styles.rowSelected]}
            onPress={() => setStaff(member.staffId, member.name)}
          >
            <Avatar name={member.name} uri={member.avatarUrl} size={44} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{member.name}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.rowMeta}>{member.role} ·</Text>
                <RatingLabel rating={member.rating} textStyle={styles.rowMeta} />
              </View>
            </View>
            {selected ? <CheckmarkIcon size={18} color={colors.brand.purple} /> : null}
          </Pressable>
        );
      })}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  rowSelected: {
    borderColor: colors.brand.purple,
    backgroundColor: colors.background.secondary,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  rowMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  anyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anyAvatarText: {
    ...typography.h3,
    color: colors.text.secondary,
  },
});

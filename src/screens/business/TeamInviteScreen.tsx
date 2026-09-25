import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import type { TeamRole } from '../../types/team';
import { showApiError } from '../../utils/showApiError';

const TOTAL_STEPS = 11;

const ROLE_LABEL: Record<TeamRole, string> = {
  front_desk: 'Front Desk',
  staff: 'Staff',
};

export function TeamInviteScreen() {
  const router = useRouter();
  const invitations = useBusinessOnboardingStore((s) => s.invitations);
  const error = useBusinessOnboardingStore((s) => s.error);

  const [addInviteVisible, setAddInviteVisible] = useState(false);

  const handleContinue = () => {
    router.push('/business-review');
  };

  return (
    <AuthScreenLayout
      title="Invite your team"
      subtitle="Add Front Desk or Staff members by email or phone. You can always do this later from Settings."
      progress={10.5 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Continue" onPress={handleContinue} />
        </>
      }
    >
      {invitations.map((invite) => (
        <View key={invite.invitationId} style={styles.inviteRow}>
          <View style={styles.inviteInfo}>
            <Text style={styles.inviteContact}>{invite.email ?? invite.phone}</Text>
            <Text style={styles.inviteMeta}>
              {ROLE_LABEL[invite.role]} · Pending
            </Text>
          </View>
        </View>
      ))}

      <Button label="+ Add invite" variant="secondary" onPress={() => setAddInviteVisible(true)} />

      <AddInviteSheet visible={addInviteVisible} onClose={() => setAddInviteVisible(false)} />
    </AuthScreenLayout>
  );
}

interface AddInviteSheetProps {
  visible: boolean;
  onClose: () => void;
}

function AddInviteSheet({ visible, onClose }: AddInviteSheetProps) {
  const sendTeamInvite = useBusinessOnboardingStore((s) => s.sendTeamInvite);
  const isSubmitting = useBusinessOnboardingStore((s) => s.isSubmitting);

  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');
  const [contactValue, setContactValue] = useState('');
  const [role, setRole] = useState<TeamRole>('front_desk');

  const canSubmit = contactValue.trim().length > 0;

  const reset = () => {
    setContactValue('');
    setContactMethod('email');
    setRole('front_desk');
  };

  const handleSend = async () => {
    // Keep the sheet open on failure — the screen's inline error sits behind it.
    try {
      await sendTeamInvite({
        email: contactMethod === 'email' ? contactValue.trim() : undefined,
        phone: contactMethod === 'phone' ? contactValue.trim() : undefined,
        role,
      });
    } catch (err) {
      showApiError("Couldn't send invite", err);
      return;
    }
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>Invite a team member</Text>

          <View style={styles.pillRow}>
            <Pressable
              onPress={() => {
                setContactMethod('email');
                setContactValue('');
              }}
              style={[styles.pill, contactMethod === 'email' && styles.pillSelected]}
            >
              <Text style={[styles.pillText, contactMethod === 'email' && styles.pillTextSelected]}>Email</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setContactMethod('phone');
                setContactValue('');
              }}
              style={[styles.pill, contactMethod === 'phone' && styles.pillSelected]}
            >
              <Text style={[styles.pillText, contactMethod === 'phone' && styles.pillTextSelected]}>Phone</Text>
            </Pressable>
          </View>

          <Input
            label={contactMethod === 'email' ? 'Email address' : 'Phone number'}
            value={contactValue}
            onChangeText={setContactValue}
            placeholder={contactMethod === 'email' ? 'jane@example.com' : '+254712345678'}
            keyboardType={contactMethod === 'email' ? 'email-address' : 'phone-pad'}
            autoCapitalize="none"
            autoFocus
          />

          <View>
            <Text style={styles.fieldLabel}>Role</Text>
            <View style={styles.pillRow}>
              {(Object.keys(ROLE_LABEL) as TeamRole[]).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setRole(option)}
                  style={[styles.pill, role === option && styles.pillSelected]}
                >
                  <Text style={[styles.pillText, role === option && styles.pillTextSelected]}>
                    {ROLE_LABEL[option]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Button
            label={isSubmitting ? 'Sending…' : 'Send invite'}
            disabled={!canSubmit || isSubmitting}
            onPress={handleSend}
            style={styles.sheetButton}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    ...shadows.card,
  },
  inviteInfo: {
    flex: 1,
  },
  inviteContact: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  inviteMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
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
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  sheetTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  sheetButton: {
    marginTop: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
  },
});

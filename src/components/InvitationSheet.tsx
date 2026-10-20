import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from './Button';
import { listMyInvitations, respondToInvitation } from '../api/team';
import { useAuth } from '../contexts/AuthContext';
import { onRealtime } from '../realtime/events';
import { useAppTransitionStore } from '../store/useAppTransitionStore';
import { useOwnedBusinessStore } from '../store/useOwnedBusinessStore';
import { restoreOwnedBusiness } from '../utils/restoreOwnedBusiness';
import { showApiError } from '../utils/showApiError';
import { switchMode } from '../utils/switchMode';
import { TEAM_ROLE_LABEL } from '../utils/team';
import { colors, radii, spacing, typography } from '../theme';
import type { MyInvitation } from '../types/team';

// A team invitation, offered once in the app as a bottom sheet instead of a
// stop on the way in at login. Only in the customer app (never in the middle
// of someone's work in another mode) and never over the logo transition.
// "Not now" hides it for this session; it stays listed in Profile
// (components/PendingInvitations). Accepting opens the new workplace.
export function InvitationSheet() {
  const router = useRouter();
  const { user } = useAuth();
  const activeMode = useOwnedBusinessStore((s) => s.activeMode);
  const transitioning = useAppTransitionStore((s) => s.message !== null);
  const [invitations, setInvitations] = useState<MyInvitation[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) {
      setInvitations([]);
      setDismissed(new Set());
      return;
    }
    const load = () =>
      listMyInvitations()
        .then(setInvitations)
        .catch(() => {});
    load();
    // A new invitation arriving while they're in the app.
    return onRealtime((n) => {
      if (!n || n.type === 'team_invitation') load();
    });
  }, [userId]);

  const invite = invitations.find((i) => !dismissed.has(i.invitationId));
  const visible = Boolean(invite) && activeMode === 'customer' && !transitioning;

  const dismiss = (id: string) => setDismissed((current) => new Set(current).add(id));
  const remove = (id: string) => setInvitations((current) => current.filter((i) => i.invitationId !== id));

  const respond = async (action: 'accept' | 'decline') => {
    if (!invite || busy) return;
    setBusy(action);
    try {
      await respondToInvitation(invite.invitationId, action);
      remove(invite.invitationId);
      if (action === 'accept') {
        await restoreOwnedBusiness().catch(() => {});
        const frontDesk = invite.role === 'front_desk';
        if (useOwnedBusinessStore.getState().staffSession) {
          switchMode(router, frontDesk ? 'front_desk' : 'staff', { message: `Opening ${invite.businessName}…` });
        }
      }
    } catch (err) {
      showApiError("Couldn't respond to this invitation", err);
    } finally {
      setBusy(null);
    }
  };

  if (!invite) return null;
  const role = TEAM_ROLE_LABEL[invite.role].toLowerCase();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => dismiss(invite.invitationId)}>
      <Pressable style={styles.overlay} onPress={() => dismiss(invite.invitationId)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grabber} />
          <Text style={styles.eyebrow}>Team invitation</Text>
          <Text style={styles.title}>Join {invite.businessName} on Trimmy</Text>
          <Text style={styles.body}>
            {invite.businessName} has invited you to join their team as {role}. You'll get your schedule
            {invite.role === 'staff' ? ', earnings and payouts' : ', walk-ins and checkout'} right here in the app.
          </Text>
          <Button
            label={busy === 'accept' ? 'Joining…' : 'Accept invitation'}
            disabled={busy !== null}
            onPress={() => respond('accept')}
          />
          <Button
            label={busy === 'decline' ? 'Declining…' : 'Decline'}
            variant="secondary"
            disabled={busy !== null}
            onPress={() => respond('decline')}
          />
          <Pressable onPress={() => dismiss(invite.invitationId)} hitSlop={8} style={styles.later}>
            <Text style={styles.laterText}>Not now — it'll stay in your Profile</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.default,
    marginBottom: spacing.sm,
  },
  eyebrow: {
    ...typography.label,
    color: colors.brand.purple,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  body: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  later: {
    alignSelf: 'center',
    paddingTop: spacing.sm,
  },
  laterText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
});

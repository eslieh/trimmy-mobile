import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from './Button';
import { listMyInvitations, respondToInvitation } from '../api/team';
import { useAuth } from '../contexts/AuthContext';
import { restoreOwnedBusiness } from '../utils/restoreOwnedBusiness';
import { showApiError } from '../utils/showApiError';
import { TEAM_ROLE_LABEL } from '../utils/team';
import { colors, radii, shadows, spacing, typography } from '../theme';
import type { MyInvitation } from '../types/team';

// Team invitations waiting for the signed-in user (list-my-invitations),
// with Accept / Decline. Shown on Get Started and the Profile tab, so a
// customer who's been invited sees it wherever they land. Accepting makes
// them staff / front desk there: restoreOwnedBusiness picks up the new
// workplace, so "Open my schedule" / "Open front desk" appear right away.
//
// The server currently matches invites to the user's phone number only, so
// someone without a phone on their account is told to add one.
export function PendingInvitations({ onAccepted }: { onAccepted?: (invite: MyInvitation) => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<MyInvitation[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user) return;
    listMyInvitations()
      .then(setInvitations)
      .catch(() => setInvitations([]));
  }, [user]);

  useFocusEffect(load);

  const handleRespond = async (invite: MyInvitation, action: 'accept' | 'decline') => {
    setRespondingId(invite.invitationId);
    try {
      await respondToInvitation(invite.invitationId, action);
      setInvitations((current) => current.filter((i) => i.invitationId !== invite.invitationId));
      if (action === 'accept') {
        await restoreOwnedBusiness().catch(() => {});
        onAccepted?.(invite);
      }
    } catch (err) {
      showApiError("Couldn't respond to this invitation", err);
    } finally {
      setRespondingId(null);
    }
  };

  if (!user) return null;

  if (!user.phone) {
    return (
      <Pressable style={styles.card} onPress={() => router.push('/account/edit-profile')}>
        <Text style={styles.cardTitle}>Been invited to a team?</Text>
        <Text style={styles.cardBody}>
          Team invitations are sent to your phone number. <Text style={styles.link}>Add your phone</Text> to see them.
        </Text>
      </Pressable>
    );
  }

  return (
    <>
      {invitations.map((invite) => (
        <View key={invite.invitationId} style={styles.card}>
          <Text style={styles.cardTitle}>{invite.businessName}</Text>
          <Text style={styles.cardBody}>
            Invited you to join as <Text style={styles.cardBodyStrong}>{TEAM_ROLE_LABEL[invite.role]}</Text>
          </Text>
          <View style={styles.cardActions}>
            <Button
              label="Decline"
              variant="secondary"
              disabled={respondingId === invite.invitationId}
              onPress={() => handleRespond(invite, 'decline')}
              style={styles.cardActionButton}
            />
            <Button
              label="Accept"
              disabled={respondingId === invite.invitationId}
              onPress={() => handleRespond(invite, 'accept')}
              style={styles.cardActionButton}
            />
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardBody: {
    ...typography.body,
    color: colors.text.secondary,
  },
  cardBodyStrong: {
    color: colors.text.primary,
  },
  link: {
    color: colors.brand.purple,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cardActionButton: {
    flex: 1,
  },
});

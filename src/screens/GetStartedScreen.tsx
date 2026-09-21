import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../components/Button';
import { listMyInvitations, respondToInvitation } from '../api/team';
import { colors, radii, shadows, spacing, typography } from '../theme';
import type { MyInvitation, TeamRole } from '../types/team';

const ROLE_LABEL: Record<TeamRole, string> = {
  front_desk: 'Front Desk',
  staff: 'Staff',
};

// Lands here right after signup. Resolves the "what kind of user is this"
// question from reference/TASKS.md: check for a pending team invite first
// (they're joining someone else's business), otherwise offer to enroll a
// business or continue as a customer.
export function GetStartedScreen() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<MyInvitation[] | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => {
    listMyInvitations().then(setInvitations);
  }, []);

  const handleRespond = async (invitationId: string, action: 'accept' | 'decline') => {
    setRespondingId(invitationId);
    try {
      await respondToInvitation(invitationId, action);
      setInvitations((current) => current?.filter((invite) => invite.invitationId !== invitationId) ?? null);
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Welcome to Trimyy</Text>
        <Text style={styles.subtitle}>Let's get you to the right place.</Text>

        {invitations === null ? (
          <ActivityIndicator style={styles.invitationsLoading} color={colors.text.secondary} />
        ) : (
          invitations.map((invite) => (
            <View key={invite.invitationId} style={styles.card}>
              <Text style={styles.cardTitle}>{invite.businessName}</Text>
              <Text style={styles.cardBody}>
                Invited you to join as <Text style={styles.cardBodyStrong}>{ROLE_LABEL[invite.role]}</Text>
              </Text>
              <View style={styles.cardActions}>
                <Button
                  label="Decline"
                  variant="secondary"
                  disabled={respondingId === invite.invitationId}
                  onPress={() => handleRespond(invite.invitationId, 'decline')}
                  style={styles.cardActionButton}
                />
                <Button
                  label="Accept"
                  disabled={respondingId === invite.invitationId}
                  onPress={() => handleRespond(invite.invitationId, 'accept')}
                  style={styles.cardActionButton}
                />
              </View>
            </View>
          ))
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Own a business?</Text>
          <Text style={styles.cardBody}>List your business on Trimyy and start taking bookings today.</Text>
          <Button
            label="Enroll your business today"
            onPress={() => router.push('/business-name')}
            style={styles.enrollButton}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Continue browsing"
          variant="secondary"
          onPress={() => {
            router.dismissAll();
            router.replace('/');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    gap: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  invitationsLoading: {
    marginVertical: spacing.lg,
  },
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
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cardActionButton: {
    flex: 1,
  },
  enrollButton: {
    marginTop: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
});

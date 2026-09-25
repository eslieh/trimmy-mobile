import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Avatar } from '../../components/Avatar';
import { BadgeIcon } from '../../components/icons/BadgeIcon';
import { ChevronRightIcon } from '../../components/icons/ChevronRightIcon';
import { PlusIcon } from '../../components/icons/PlusIcon';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { showApiError } from '../../utils/showApiError';
import { usePayoutsStore } from '../../store/usePayoutsStore';
import { INVITATION_STATUS_COLOR, INVITATION_STATUS_LABEL, TEAM_ROLE_LABEL, teamMemberDisplayName } from '../../utils/team';
import { colors, radii, shadows, spacing, typography } from '../../theme';

function formatMoney(amount: number): string {
  return `KSh ${amount.toLocaleString('en-US')}`;
}

// Its own tab (business-app)/team.tsx, visible only for teamMode 'team' —
// promoted from a row inside Manage Business, per explicit request, since
// team management is central enough to a team business's daily operation
// to deserve a tab, not be buried a level deeper. An invitation IS the
// roster record — see types/team.ts — so the member grid just lists
// useBusinessOnboardingStore's invitations array, pending and accepted
// alike, sorted so pending ones (which need the owner's attention) come
// first. Rendered as a 2-column photo grid (Avatar's deterministic initials
// placeholder, since no member has an actual photo yet) rather than a plain
// list, per explicit request.
//
// The Payouts section at top is O4 (business-owner.md) — per explicit
// request, a global queue visible the moment the owner opens Team, not
// something buried inside each member's detail screen. See
// PayoutDetailScreen for the accept/reject actions themselves.
export function TeamScreen() {
  const router = useRouter();
  const business = useBusinessOnboardingStore((s) => s.business);
  const invitations = useBusinessOnboardingStore((s) => s.invitations);
  const payouts = usePayoutsStore((s) => s.payouts);
  const loadTeamMembers = useBusinessOnboardingStore((s) => s.loadTeamMembers);

  // The server's roster is the source of truth — pending and accepted,
  // including members added from another device.
  const businessId = business?.businessId;
  useEffect(() => {
    if (businessId) loadTeamMembers(businessId).catch((err) => showApiError("Couldn't load your team", err));
  }, [businessId, loadTeamMembers]);

  const pendingPayouts = useMemo(
    () =>
      business
        ? payouts
            .filter((p) => p.businessId === business.businessId && p.status === 'pending')
            .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt))
        : [],
    [payouts, business],
  );

  if (!business) {
    return <SafeAreaView style={styles.flex} edges={['top']} />;
  }

  const sorted = [...invitations].sort((a, b) => {
    if (a.status === b.status) return b.sentAt.localeCompare(a.sentAt);
    return a.status === 'pending' ? -1 : b.status === 'pending' ? 1 : 0;
  });

  const nameForInvitation = (invitationId: string) => {
    const invitation = invitations.find((i) => i.invitationId === invitationId);
    return invitation ? teamMemberDisplayName(invitation) : 'Team member';
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/team-invite')} hitSlop={4}>
          <PlusIcon size={18} color={colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.payoutsCard}>
          <View style={styles.payoutsHeader}>
            <Text style={styles.payoutsTitle}>Payouts</Text>
            <Pressable onPress={() => router.push('/payouts')} hitSlop={8}>
              <Text style={styles.viewAllLink}>View all</Text>
            </Pressable>
          </View>

          {pendingPayouts.length === 0 ? (
            <Text style={styles.emptyHint}>No pending payout requests.</Text>
          ) : (
            <View style={styles.payoutsList}>
              {pendingPayouts.map((payout) => (
                <Pressable
                  key={payout.payoutId}
                  style={styles.payoutRow}
                  onPress={() => router.push(`/payouts/${payout.payoutId}`)}
                >
                  <Text style={styles.payoutRowName} numberOfLines={1}>
                    {nameForInvitation(payout.invitationId)}
                  </Text>
                  <Text style={styles.payoutRowAmount}>{formatMoney(payout.amount)}</Text>
                  <ChevronRightIcon size={16} color={colors.text.tertiary} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <BadgeIcon size={40} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No team members yet</Text>
            <Text style={styles.emptyBody}>Invite front desk staff or stylists to help run the business.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {sorted.map((invitation) => {
              const displayName = teamMemberDisplayName(invitation);
              return (
                <Pressable
                  key={invitation.invitationId}
                  style={styles.card}
                  onPress={() => router.push(`/team/${invitation.invitationId}`)}
                >
                  <Avatar name={displayName} size={56} />
                  <Text style={styles.memberName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={styles.memberRole}>{TEAM_ROLE_LABEL[invitation.role]}</Text>
                  <Text style={[styles.statusBadge, { color: INVITATION_STATUS_COLOR[invitation.status] }]}>
                    {INVITATION_STATUS_LABEL[invitation.status]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.primary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  list: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  payoutsCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  payoutsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payoutsTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  viewAllLink: {
    ...typography.bodyMedium,
    color: colors.brand.purple,
  },
  payoutsList: {
    gap: spacing.sm,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  payoutRowName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  payoutRowAmount: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '47%',
    alignItems: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    ...shadows.card,
  },
  memberName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  memberRole: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statusBadge: {
    ...typography.caption,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

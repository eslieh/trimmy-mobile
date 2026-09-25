import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Avatar } from '../../components/Avatar';
import { BackButton } from '../../components/BackButton';
import { WalletIcon } from '../../components/icons/WalletIcon';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { usePayoutsStore } from '../../store/usePayoutsStore';
import { PAYOUT_STATUS_COLOR, PAYOUT_STATUS_LABEL } from '../../utils/payout';
import { teamMemberDisplayName } from '../../utils/team';
import { colors, radii, shadows, spacing, typography } from '../../theme';

function formatMoney(amount: number): string {
  return `KSh ${amount.toLocaleString('en-US')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Reached from Team's "View all" link — every payout request ever made
// across the team, any status, newest first. PayoutDetailScreen's
// accept/reject actions live one tap away from here too, not just from the
// pending queue on the Team tab.
export function PayoutHistoryScreen() {
  const router = useRouter();
  const ownedBusiness = useOwnedBusinessStore((s) => s.business);
  const invitations = useBusinessOnboardingStore((s) => s.invitations);
  const payouts = usePayoutsStore((s) => s.payouts);

  const businessPayouts = useMemo(
    () =>
      ownedBusiness
        ? [...payouts]
            .filter((p) => p.businessId === ownedBusiness.businessId)
            .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
        : [],
    [payouts, ownedBusiness],
  );

  const nameForInvitation = (invitationId: string) => {
    const invitation = invitations.find((i) => i.invitationId === invitationId);
    return invitation ? teamMemberDisplayName(invitation) : 'Team member';
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Payout history</Text>
      </View>

      {businessPayouts.length === 0 ? (
        <View style={styles.empty}>
          <WalletIcon size={40} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No payout requests yet</Text>
          <Text style={styles.emptyBody}>Requests your team makes from their earnings will show up here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {businessPayouts.map((payout) => {
            const displayName = nameForInvitation(payout.invitationId);
            return (
              <Pressable
                key={payout.payoutId}
                style={styles.row}
                onPress={() => router.push(`/payouts/${payout.payoutId}`)}
              >
                <Avatar name={displayName} size={40} />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={styles.rowDate}>{formatDate(payout.requestedAt)}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowAmount}>{formatMoney(payout.amount)}</Text>
                  <Text style={[styles.rowStatus, { color: PAYOUT_STATUS_COLOR[payout.status] }]}>
                    {PAYOUT_STATUS_LABEL[payout.status]}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
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
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  list: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    ...shadows.card,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  rowDate: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rowAmount: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  rowStatus: {
    ...typography.caption,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
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

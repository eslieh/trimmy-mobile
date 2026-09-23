import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Avatar } from '../../components/Avatar';
import { BadgeIcon } from '../../components/icons/BadgeIcon';
import { PlusIcon } from '../../components/icons/PlusIcon';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { INVITATION_STATUS_COLOR, INVITATION_STATUS_LABEL, TEAM_ROLE_LABEL } from '../../utils/team';
import { colors, radii, shadows, spacing, typography } from '../../theme';

// Its own tab (business-app)/team.tsx, visible only for teamMode 'team' —
// promoted from a row inside Manage Business, per explicit request, since
// team management is central enough to a team business's daily operation
// to deserve a tab, not be buried a level deeper. An invitation IS the
// roster record — see types/team.ts — so this just lists
// useBusinessOnboardingStore's invitations array, pending and accepted
// alike, sorted so pending ones (which need the owner's attention) come
// first. Rendered as a 2-column photo grid (Avatar's deterministic initials
// placeholder, since no member has an actual photo yet) rather than a plain
// list, per explicit request.
export function TeamScreen() {
  const router = useRouter();
  const business = useBusinessOnboardingStore((s) => s.business);
  const invitations = useBusinessOnboardingStore((s) => s.invitations);

  if (!business) {
    return <SafeAreaView style={styles.flex} edges={['top']} />;
  }

  const sorted = [...invitations].sort((a, b) => {
    if (a.status === b.status) return b.sentAt.localeCompare(a.sentAt);
    return a.status === 'pending' ? -1 : b.status === 'pending' ? 1 : 0;
  });

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/team-invite')} hitSlop={4}>
          <PlusIcon size={18} color={colors.text.primary} />
        </Pressable>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.empty}>
          <BadgeIcon size={40} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No team members yet</Text>
          <Text style={styles.emptyBody}>Invite front desk staff or stylists to help run the business.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.grid}>
            {sorted.map((invitation) => {
              const displayName = invitation.name || invitation.phone || invitation.email || 'Team member';
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

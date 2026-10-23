import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarIcon } from '../../components/icons/CalendarIcon';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { PendingInvitations } from '../../components/PendingInvitations';
import { AccountSection } from '../../components/AccountSection';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { IconBubble } from '../../components/ui/IconBubble';
import { ChevronRightIcon } from '../../components/icons/ChevronRightIcon';
import { NotificationBell } from '../../components/NotificationBell';
import Svg, { Path } from 'react-native-svg';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { nextSetupRoute } from '../../utils/restoreOwnedBusiness';
import { switchMode } from '../../utils/switchMode';

export function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const ownedBusiness = useOwnedBusinessStore((s) => s.business);
  const staffSession = useOwnedBusinessStore((s) => s.staffSession);
  // An unfinished business setup, restored from the server after login.
  const setupBusiness = useBusinessOnboardingStore((s) => s.business);
  const draft = !ownedBusiness && setupBusiness?.status === 'draft' ? setupBusiness : null;

  const displayName = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Guest' : 'Guest';

  // The floating switch: their own business first, else where they work.
  const workspace = ownedBusiness
    ? { label: `Switch to ${ownedBusiness.name}`, open: () => switchMode(router, 'business', { message: `Opening ${ownedBusiness.name}…` }) }
    : staffSession
      ? {
          label: staffSession.role === 'front_desk' ? 'Open front desk' : 'Open my schedule',
          open: () =>
            switchMode(router, staffSession.role === 'front_desk' ? 'front_desk' : 'staff', {
              message: `Opening ${staffSession.businessName}…`,
            }),
        }
      : null;

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, workspace && styles.scrollContentWithPill]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Profile</Text>
            <NotificationBell />
          </View>
          <View style={styles.identity}>
            {user ? <Avatar name={displayName} uri={user.avatar_url} size={56} /> : null}
            <View style={styles.identityText}>
              <Text style={styles.name}>{displayName}</Text>
              {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Invitations from businesses; the invitation sheet also offers them once. */}
          <PendingInvitations />

          {user && !ownedBusiness ? (
            <View style={styles.businessCard}>
              <View style={styles.businessEyebrowRow}>
                <View style={styles.eyebrowDot} />
                <Text style={styles.businessEyebrow}>TRIMMY FOR BUSINESS</Text>
              </View>
              {draft ? (
                <>
                  <Text style={styles.businessTitle}>Finish setting up {draft.name}</Text>
                  <Text style={styles.businessBody}>Your progress is saved. Pick up where you left off.</Text>
                  <Button
                    label="Continue setup"
                    onPress={() => router.push(nextSetupRoute(draft.onboardingStep, draft.teamMode))}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.businessTitle}>Run your salon or barbershop on Trimmy</Text>
                  <Text style={styles.businessBody}>
                    Take bookings and M-Pesa payments, manage your team and see your earnings, all in one place.
                  </Text>
                  <Button label="Set up your business" onPress={() => router.push('/business-name')} />
                </>
              )}
            </View>
          ) : null}

          {user ? (
            <View style={styles.group}>
              <Pressable style={[styles.row, styles.rowLast]} onPress={() => router.push('/activity')}>
                <IconBubble size={36}>
                  <CalendarIcon size={17} color={colors.brand.pink} />
                </IconBubble>
                <Text style={styles.rowLabel}>My appointments</Text>
                <ChevronRightIcon size={16} color={colors.text.tertiary} />
              </Pressable>
            </View>
          ) : null}

          <AccountSection />
        </View>
      </ScrollView>

      {workspace ? (
        <View pointerEvents="box-none" style={styles.pillWrap}>
          <Pressable style={styles.pill} onPress={workspace.open} accessibilityRole="button">
            <SwitchIcon />
            <Text style={styles.pillText}>{workspace.label}</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// Two arrows, one up one down: "switch".
function SwitchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M7 4v14M7 4L4 7M7 4l3 3M17 20V6M17 20l-3-3M17 20l3-3" stroke={colors.white} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  identityText: {
    flex: 1,
  },
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContentWithPill: {
    paddingBottom: 96,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // The landing's soft pink card: tinted, no border or shadow.
  businessCard: {
    borderRadius: 28,
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.brand.accentSoft,
  },
  businessEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.pink,
  },
  businessEyebrow: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 0.6,
    color: colors.brand.accentForeground,
  },
  businessTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  businessBody: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  pillWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.lg,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.button.primaryBg,
    ...shadows.raised,
  },
  pillText: {
    ...typography.button,
    color: colors.button.primaryText,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  name: {
    ...typography.h3,
    color: colors.text.primary,
  },
  email: {
    ...typography.body,
    color: colors.text.secondary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  group: {
    borderRadius: radii.xxl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  logoutLabel: {
    color: colors.feedback.danger,
  },
});

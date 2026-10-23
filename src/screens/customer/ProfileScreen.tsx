import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarIcon } from '../../components/icons/CalendarIcon';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { PendingInvitations } from '../../components/PendingInvitations';
import { AccountSection } from '../../components/AccountSection';
import { Avatar } from '../../components/Avatar';
import { IconBubble } from '../../components/ui/IconBubble';
import { BusinessIcon } from '../../components/icons/BusinessIcon';
import { ChevronRightIcon } from '../../components/icons/ChevronRightIcon';
import { NotificationBell } from '../../components/NotificationBell';
import Svg, { Path } from 'react-native-svg';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { nextSetupRoute } from '../../utils/restoreOwnedBusiness';
import { switchMode } from '../../utils/switchMode';
import { StarIcon } from '../../components/icons/StarIcon';

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

          {user ? (
            <View style={styles.group}>
              <Pressable style={styles.row} onPress={() => router.push('/activity')}>
                <IconBubble size={36}>
                  <CalendarIcon size={17} color={colors.brand.pink} />
                </IconBubble>
                <Text style={styles.rowLabel}>My appointments</Text>
                <ChevronRightIcon size={16} color={colors.text.tertiary} />
              </Pressable>
              <Pressable style={[styles.row, styles.rowLast]} onPress={() => router.push('/account/reviews')}>
                <IconBubble size={36}>
                  <StarIcon size={17} color={colors.brand.pink} />
                </IconBubble>
                <Text style={styles.rowLabel}>My reviews</Text>
                <ChevronRightIcon size={16} color={colors.text.tertiary} />
              </Pressable>
            </View>
          ) : null}

          {/* Low-key, near the bottom: most people here are customers. */}
          <AccountSection
            extra={
              user && !ownedBusiness
                ? draft
                  ? {
                      label: `Finish setting up ${draft.name}`,
                      hint: 'Your progress is saved',
                      icon: <BusinessIcon size={17} color={colors.brand.pink} />,
                      onPress: () => router.push(nextSetupRoute(draft.onboardingStep, draft.teamMode)),
                    }
                  : {
                      label: 'List your business',
                      hint: 'Take bookings and M-Pesa payments on Trimmy',
                      icon: <BusinessIcon size={17} color={colors.brand.pink} />,
                      onPress: () => router.push('/business-name'),
                    }
                : undefined
            }
          />
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

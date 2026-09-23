import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { UserIcon } from '../../components/icons/UserIcon';
import { CalendarIcon } from '../../components/icons/CalendarIcon';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { seedOwnedBusinessForTesting } from '../../utils/devSeed';
import { colors, radii, shadows, spacing, typography } from '../../theme';

type Row = {
  key: string;
  label: string;
  icon?: ReactNode;
  onPress?: () => void;
};

export function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const setOwnedBusiness = useOwnedBusinessStore((s) => s.setOwnedBusiness);
  const setActiveMode = useOwnedBusinessStore((s) => s.setActiveMode);

  const handleLogout = async () => {
    await logout();
    router.dismissAll();
    router.replace('/');
  };

  // The real path into business mode is publishing a business through the
  // full setup wizard (ReviewPublishScreen sets the owned business there).
  // If nothing's been published yet this session, this seeds from a mock
  // discovery business instead (same businessId real customer bookings
  // already use) — a stand-in for "you don't have a listing yet" rather
  // than a dead end, since there's no real backend to check against.
  // Two variants (solo/team) so both tab-bar shapes are reachable for
  // testing — see (business-app)/_layout.tsx for how they differ (team
  // hides Today/Calendar). Team lands on Earnings rather than Today, since
  // Today isn't a visible tab in team mode.
  const handleSwitchToHosting = (teamMode: 'solo' | 'team') => {
    setOwnedBusiness(seedOwnedBusinessForTesting(teamMode === 'solo' ? 0 : 1, teamMode));
    setActiveMode('business');
    router.dismissAll();
    router.replace(teamMode === 'solo' ? '/today' : '/earnings');
  };

  const displayName = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Guest' : 'Guest';

  const accountRows: Row[] = [
    { key: 'profile', label: 'Profile', icon: <UserIcon size={20} /> },
    { key: 'messages', label: 'Messages' },
    { key: 'appointments', label: 'My appointments', icon: <CalendarIcon size={20} />, onPress: () => router.push('/activity') },
    { key: 'forms', label: 'Forms' },
    { key: 'settings', label: 'Settings' },
  ];

  const supportRows: Row[] = [
    { key: 'support', label: 'Support' },
    { key: 'language', label: 'Language' },
  ];

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.name}>{displayName}</Text>
        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
      </View>

      <View style={styles.content}>
        <View style={styles.testingSection}>
          <Text style={styles.testingLabel}>Testing: switch mode</Text>
          <View style={styles.testingButtonRow}>
            <Pressable style={styles.switchButton} onPress={() => handleSwitchToHosting('solo')}>
              <Text style={styles.switchButtonText}>Business (solo)</Text>
            </Pressable>
            <Pressable style={styles.switchButton} onPress={() => handleSwitchToHosting('team')}>
              <Text style={styles.switchButtonText}>Business (team)</Text>
            </Pressable>
          </View>
          <Text style={styles.testingHint}>
            Staff and Front Desk aren't built as their own experience yet — there's nothing distinct to
            switch into for those roles.
          </Text>
        </View>

        <RowGroup rows={accountRows} />
        <RowGroup rows={supportRows} />

        <View style={styles.group}>
          <Pressable style={[styles.row, styles.rowLast]} onPress={handleLogout}>
            <Text style={[styles.rowLabel, styles.logoutLabel]}>Log out</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function RowGroup({ rows }: { rows: Row[] }) {
  return (
    <View style={styles.group}>
      {rows.map((row, index) => (
        <Pressable
          key={row.key}
          style={[styles.row, index === rows.length - 1 && styles.rowLast]}
          onPress={row.onPress}
          disabled={!row.onPress}
        >
          {row.icon}
          <Text style={styles.rowLabel}>{row.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
  testingSection: {
    gap: spacing.sm,
  },
  testingLabel: {
    ...typography.label,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  testingButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  switchButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.button.primaryBg,
    ...shadows.raised,
  },
  switchButtonText: {
    ...typography.button,
    color: colors.button.primaryText,
  },
  testingHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  group: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  logoutLabel: {
    color: colors.feedback.danger,
  },
});

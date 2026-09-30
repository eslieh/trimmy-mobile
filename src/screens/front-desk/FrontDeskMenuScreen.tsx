import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { colors, radii, shadows, spacing, typography } from '../../theme';

// Front desk's Menu tab: who's signed in and where, the two work queues
// (unassigned "Any available" bookings, refunds owed), switch to browsing,
// log out. Same shape as StaffMenuScreen.
export function FrontDeskMenuScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const staffSession = useOwnedBusinessStore((s) => s.staffSession);
  const setActiveMode = useOwnedBusinessStore((s) => s.setActiveMode);

  const displayName = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Guest' : 'Guest';

  const handleSwitchToBrowsing = () => {
    setActiveMode('customer');
    router.dismissAll();
    router.replace('/explore');
  };

  const handleLogout = async () => {
    await logout();
    router.dismissAll();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        <Text style={styles.name}>{displayName}</Text>
        {staffSession ? <Text style={styles.business}>Front desk · {staffSession.businessName}</Text> : null}
      </View>

      <View style={styles.content}>
        <View style={styles.group}>
          <Pressable style={styles.row} onPress={() => router.push('/manage-business/unassigned')}>
            <Text style={styles.rowLabel}>Unassigned bookings</Text>
          </Pressable>
          <Pressable style={[styles.row, styles.rowLast]} onPress={() => router.push('/manage-business/refunds')}>
            <Text style={styles.rowLabel}>Refunds owed</Text>
          </Pressable>
        </View>

        <Pressable style={styles.switchButton} onPress={handleSwitchToBrowsing}>
          <Text style={styles.switchButtonText}>Switch to browsing</Text>
        </Pressable>

        <View style={styles.group}>
          <Pressable style={[styles.row, styles.rowLast]} onPress={handleLogout}>
            <Text style={[styles.rowLabel, styles.logoutLabel]}>Log out</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
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
  business: {
    ...typography.body,
    color: colors.text.secondary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  switchButton: {
    alignSelf: 'center',
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

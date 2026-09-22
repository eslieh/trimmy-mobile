import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { colors, radii, shadows, spacing, typography } from '../../theme';

// Business-owner session's Menu tab — account-level only (name/email
// header, "Switch to browsing", Log out). Business management now lives in
// its own "Business" tab, not here — see TASKS.md for why it moved.
export function BusinessMenuScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const ownedBusiness = useOwnedBusinessStore((s) => s.business);
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
        {ownedBusiness ? <Text style={styles.business}>{ownedBusiness.name}</Text> : null}
      </View>

      <View style={styles.content}>
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

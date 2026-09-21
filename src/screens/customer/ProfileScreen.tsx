import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { UserIcon } from '../../components/icons/UserIcon';
import { HeartIcon } from '../../components/icons/HeartIcon';
import { CalendarIcon } from '../../components/icons/CalendarIcon';
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

  const handleLogout = async () => {
    await logout();
    router.dismissAll();
    router.replace('/');
  };

  const displayName = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Guest' : 'Guest';

  const accountRows: Row[] = [
    { key: 'profile', label: 'Profile', icon: <UserIcon size={20} /> },
    { key: 'favourites', label: 'Favourites', icon: <HeartIcon size={20} />, onPress: () => router.push('/favorites') },
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
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.name}>{displayName}</Text>
        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
      </View>

      <View style={styles.content}>
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
    gap: spacing.lg,
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

import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { LEGAL } from '../config/env';
import { useAuth } from '../contexts/AuthContext';
import { colors, radii, shadows, spacing, typography } from '../theme';

type Row = { key: string; label: string; onPress: () => void; danger?: boolean };

// The account part of every mode's Profile / Menu (customer, business, staff,
// front desk), so managing your account never depends on which app you're
// in: your details, password, notifications, help, the legal documents the
// stores require, logging out and deleting the account.
export function AccountSection() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const openLink = (url: string) => {
    // In-app browser: keeps them in Trimmy and works on every phone.
    WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => {}));
  };

  const contactSupport = () => {
    const url = `mailto:${LEGAL.supportEmail}?subject=${encodeURIComponent('Trimmy help')}`;
    Linking.openURL(url).catch(() => Alert.alert('Contact support', `Email us at ${LEGAL.supportEmail}`));
  };

  const handleLogout = () => {
    Alert.alert('Log out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          if (router.canDismiss()) router.dismissAll();
          router.replace('/');
        },
      },
    ]);
  };

  const go = (href: Href) => () => router.push(href);

  const account: Row[] = user
    ? [
        { key: 'profile', label: 'Personal details', onPress: go('/account/edit-profile') },
        { key: 'password', label: 'Password & security', onPress: go('/account/change-password') },
        { key: 'notifications', label: 'Notifications', onPress: go('/account/notifications') },
      ]
    : [];
  const support: Row[] = [
    { key: 'help', label: 'Help & support', onPress: contactSupport },
    { key: 'privacy', label: 'Privacy policy', onPress: () => openLink(LEGAL.privacyPolicyUrl) },
    { key: 'terms', label: 'Terms of service', onPress: () => openLink(LEGAL.termsUrl) },
  ];
  const session: Row[] = [
    { key: 'logout', label: 'Log out', onPress: handleLogout, danger: true },
    ...(user ? [{ key: 'delete', label: 'Delete account', onPress: go('/account/delete-account'), danger: true }] : []),
  ];

  return (
    <View style={styles.section}>
      {account.length ? <Group title="Account" rows={account} /> : null}
      <Group title="Support & legal" rows={support} />
      <Group rows={session} />
    </View>
  );
}

function Group({ title, rows }: { title?: string; rows: Row[] }) {
  return (
    <View style={styles.groupWrap}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      <View style={styles.group}>
        {rows.map((row, index) => (
          <Pressable
            key={row.key}
            style={({ pressed }) => [styles.row, index === rows.length - 1 && styles.rowLast, pressed && styles.rowPressed]}
            onPress={row.onPress}
            accessibilityRole="button"
          >
            <Text style={[styles.rowLabel, row.danger && styles.danger]}>{row.label}</Text>
            {row.danger ? null : <ChevronRightIcon size={16} color={colors.text.tertiary} />}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  groupWrap: {
    gap: spacing.sm,
  },
  groupTitle: {
    ...typography.label,
    color: colors.text.tertiary,
    marginLeft: spacing.xs,
  },
  group: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    backgroundColor: colors.background.tertiary,
  },
  rowLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  danger: {
    color: colors.feedback.danger,
  },
});

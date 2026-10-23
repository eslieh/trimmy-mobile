import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { ReactNode } from 'react';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { BellIcon } from './icons/BellIcon';
import { InfoIcon } from './icons/InfoIcon';
import { ListIcon } from './icons/ListIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import { UserIcon } from './icons/UserIcon';
import { IconBubble } from './ui/IconBubble';
import { LEGAL } from '../config/env';
import { useAuth } from '../contexts/AuthContext';
import { colors, radii, spacing, typography } from '../theme';

type Row = { key: string; label: string; onPress: () => void; danger?: boolean; icon?: ReactNode };

const ICON = { size: 17, color: colors.brand.pink };

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
        { key: 'profile', label: 'Personal details', onPress: go('/account/edit-profile'), icon: <UserIcon {...ICON} /> },
        { key: 'password', label: 'Password & security', onPress: go('/account/change-password'), icon: <ShieldIcon {...ICON} /> },
        { key: 'notifications', label: 'Notifications', onPress: go('/account/notifications'), icon: <BellIcon {...ICON} /> },
      ]
    : [];
  const support: Row[] = [
    { key: 'help', label: 'Help & support', onPress: contactSupport, icon: <InfoIcon {...ICON} /> },
    { key: 'privacy', label: 'Privacy policy', onPress: () => openLink(LEGAL.privacyPolicyUrl), icon: <ShieldIcon {...ICON} /> },
    { key: 'terms', label: 'Terms of service', onPress: () => openLink(LEGAL.termsUrl), icon: <ListIcon {...ICON} /> },
  ];
  const session: Row[] = [{ key: 'logout', label: 'Log out', onPress: handleLogout, danger: true }];

  return (
    <View style={styles.section}>
      {account.length ? <Group title="Account" rows={account} /> : null}
      <Group title="Support & legal" rows={support} />
      <Group rows={session} />
      {/* Well clear of Log out so it's never hit by mistake. */}
      {user ? (
        <Pressable
          style={({ pressed }) => [styles.deleteLink, pressed && styles.deleteLinkPressed]}
          onPress={go('/account/delete-account')}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={styles.deleteLabel}>Delete account</Text>
        </Pressable>
      ) : null}
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
            {row.icon ? <IconBubble size={36}>{row.icon}</IconBubble> : null}
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
    color: colors.text.secondary,
    marginLeft: spacing.xs,
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
  rowPressed: {
    backgroundColor: colors.brand.accentSoft,
  },
  rowLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  danger: {
    color: colors.feedback.danger,
  },
  deleteLink: {
    alignSelf: 'center',
    marginTop: spacing.xxxl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  deleteLinkPressed: {
    opacity: 0.5,
  },
  deleteLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    textDecorationLine: 'underline',
  },
});

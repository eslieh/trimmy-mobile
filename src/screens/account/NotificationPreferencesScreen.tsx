import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BackButton } from '../../components/BackButton';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type ChannelSwitches,
  type NotificationCategory,
  type NotificationChannel,
  type NotificationPreferences,
} from '../../api/notifications';
import { getApiErrorMessage } from '../../api/client';
import { showApiError } from '../../utils/showApiError';
import { colors, radii, shadows, spacing, typography } from '../../theme';

const CATEGORY_COPY: Record<NotificationCategory, { title: string; hint: string }> = {
  bookings: { title: 'Your bookings', hint: 'Confirmations, changes, cancellations and receipts' },
  reminders: { title: 'Reminders', hint: 'Before each appointment' },
  business: { title: 'Business', hint: 'New bookings, cancellations and assignments where you work' },
  payouts: { title: 'Payouts & wallet', hint: 'Payout requests, answers and wallet changes' },
  team: { title: 'Team invitations', hint: 'When a business invites you to join' },
};
const ORDER: NotificationCategory[] = ['bookings', 'reminders', 'business', 'payouts', 'team'];
const CHANNEL_LABEL: Record<NotificationChannel, string> = { push: 'Push', sms: 'SMS', email: 'Email' };
const MISSING_CONTACT: Partial<Record<NotificationChannel, string>> = {
  sms: 'Add a phone number to your profile to get texts',
  email: 'Add an email to your profile to get emails',
};
const ALL_ON: ChannelSwitches = { push: true, sms: true, email: true };

// Everything always shows in the in-app inbox; this picks the extra
// channels per category (and which reminders). The server says which
// categories apply (e.g. Business only once you run or work at one) and
// which channels can reach you; push stays hidden until it's switched on.
// Each switch saves straight away and flips back if the save fails.
export function NotificationPreferencesScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    getNotificationPreferences()
      .then(setPrefs)
      .catch((err) => setLoadError(getApiErrorMessage(err, "Couldn't load your settings.")));
  }, []);

  const save = (next: NotificationPreferences, patch: Parameters<typeof updateNotificationPreferences>[0]) => {
    if (!prefs) return;
    const previous = prefs;
    setPrefs(next);
    updateNotificationPreferences(patch)
      .then(setPrefs)
      .catch((err) => {
        setPrefs(previous);
        showApiError("Couldn't save that change", err);
      });
  };

  const toggleChannel = (category: NotificationCategory, channel: NotificationChannel, value: boolean) => {
    if (!prefs) return;
    const current = prefs.categories[category] ?? ALL_ON;
    save({ ...prefs, categories: { ...prefs.categories, [category]: { ...current, [channel]: value } } }, {
      categories: { [category]: { [channel]: value } },
    });
  };

  const toggleReminder = (key: 'dayBefore' | 'twoHoursBefore', value: boolean) => {
    if (!prefs) return;
    save({ ...prefs, reminders: { ...prefs.reminders, [key]: value } }, { reminders: { [key]: value } });
  };

  // An older server only sends `reminders`: show those, with SMS / push.
  const available = prefs?.availableChannels ?? { push: true, sms: true, email: false };
  const channels = (['push', 'sms', 'email'] as NotificationChannel[]).filter(
    (c) => c !== 'push' || available.push,
  );
  const categories = prefs?.categories
    ? ORDER.filter((c) => prefs.categories[c])
    : (['reminders'] as NotificationCategory[]);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Notification settings</Text>
      </View>

      {loadError ? (
        <Text style={[styles.hint, styles.message]}>{loadError}</Text>
      ) : !prefs ? (
        <ActivityIndicator style={styles.loading} color={colors.text.secondary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.intro}>
            Everything always shows in your Trimmy notifications. Choose where else you hear about it.
          </Text>

          {categories.map((category) => {
            const switches = category === 'reminders' && !prefs.categories?.reminders
              ? { push: prefs.reminders.push, sms: prefs.reminders.sms, email: prefs.reminders.email }
              : prefs.categories[category] ?? ALL_ON;
            return (
              <View key={category} style={styles.group}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{CATEGORY_COPY[category].title}</Text>
                  <Text style={styles.hint}>{CATEGORY_COPY[category].hint}</Text>
                </View>

                {category === 'reminders' ? (
                  <>
                    <SwitchRow
                      label="Day before"
                      value={prefs.reminders.dayBefore}
                      onChange={(v) => toggleReminder('dayBefore', v)}
                    />
                    <SwitchRow
                      label="2 hours before"
                      hint="With directions to the business"
                      value={prefs.reminders.twoHoursBefore}
                      onChange={(v) => toggleReminder('twoHoursBefore', v)}
                    />
                  </>
                ) : null}

                {channels.map((channel, index) => {
                  const reachable = available[channel];
                  return (
                    <SwitchRow
                      key={channel}
                      label={CHANNEL_LABEL[channel]}
                      hint={reachable ? undefined : MISSING_CONTACT[channel]}
                      value={reachable && switches[channel]}
                      disabled={!reachable}
                      last={index === channels.length - 1}
                      onChange={(v) => toggleChannel(category, channel, v)}
                    />
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SwitchRow({
  label,
  hint,
  value,
  onChange,
  disabled = false,
  last = false,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.rowText}>
        <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} accessibilityLabel={label} />
    </View>
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
  loading: {
    marginTop: spacing.xxxl,
  },
  message: {
    paddingHorizontal: spacing.xxl,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  intro: {
    ...typography.body,
    color: colors.text.secondary,
  },
  group: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.lg,
    ...shadows.card,
  },
  groupHeader: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: 2,
  },
  groupTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  labelDisabled: {
    color: colors.text.tertiary,
  },
  hint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

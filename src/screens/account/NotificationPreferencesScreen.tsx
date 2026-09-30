import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type ReminderPreferences,
} from '../../api/notifications';
import { getApiErrorMessage } from '../../api/client';
import { showApiError } from '../../utils/showApiError';
import { colors, spacing, typography } from '../../theme';

const ROWS: { key: keyof ReminderPreferences; label: string; hint: string }[] = [
  { key: 'dayBefore', label: 'Day before', hint: 'A reminder 24 hours before your appointment' },
  { key: 'twoHoursBefore', label: '2 hours before', hint: 'With directions to the business' },
  { key: 'sms', label: 'By SMS', hint: 'Send reminders as text messages' },
  { key: 'push', label: 'By push notification', hint: 'Send reminders to this app' },
];

// C5 "configurable" reminders. Only reminders can be turned off —
// confirmations and cancellations by the business are always sent. Each
// switch saves straight away (PATCH only that field), and flips back if the
// save fails.
export function NotificationPreferencesScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<ReminderPreferences | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    getNotificationPreferences()
      .then((res) => setPrefs(res.reminders))
      .catch((err) => setLoadError(getApiErrorMessage(err, "Couldn't load your preferences.")));
  }, []);

  const toggle = (key: keyof ReminderPreferences, value: boolean) => {
    if (!prefs) return;
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value });
    updateNotificationPreferences({ [key]: value })
      .then((res) => setPrefs(res.reminders))
      .catch((err) => {
        setPrefs(previous);
        showApiError("Couldn't save that change", err);
      });
  };

  return (
    <AuthScreenLayout
      title="Notifications"
      subtitle="Choose which appointment reminders you get. Booking confirmations and changes are always sent."
      onBack={() => router.back()}
    >
      {loadError ? (
        <Text style={styles.hint}>{loadError}</Text>
      ) : !prefs ? (
        <ActivityIndicator color={colors.text.secondary} />
      ) : (
        ROWS.map((row) => (
          <View key={row.key} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.hint}>{row.hint}</Text>
            </View>
            <Switch value={prefs[row.key]} onValueChange={(value) => toggle(row.key, value)} />
          </View>
        ))
      )}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  hint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

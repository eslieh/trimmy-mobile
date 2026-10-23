import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { DatePickerField } from '../../components/DatePickerField';
import { Input } from '../../components/Input';
import { getDaySummary, submitDaySummary, type DaySummary } from '../../api/daySummary';
import { getApiErrorMessage } from '../../api/client';
import { useBusinessContext } from '../../hooks/useBusinessContext';
import { colors, radii, shadows, spacing, typography } from '../../theme';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function money(amount: number): string {
  return `KSh ${amount.toLocaleString('en-US')}`;
}

// F4 end-of-day summary (owner or front desk): the day's visits, the cash
// drawer (by method, and separately by kind — the same money split two
// ways, so never summed), refunds paid back, anything still unpaid, and a
// note submitted to the owner. Opened from the front desk / owner menus, or
// from the owner's "day summary submitted" push (?date=).
export function DaySummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const business = useBusinessContext();
  const [date, setDate] = useState(params.date ?? todayKey());
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const businessId = business?.businessId;
  const load = useCallback(() => {
    if (!businessId) return;
    setSummary(null);
    setError('');
    getDaySummary(businessId, date)
      .then((s) => {
        setSummary(s);
        setNotes(s.submission.notes ?? '');
      })
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load the day summary.")));
  }, [businessId, date]);

  useFocusEffect(load);

  const handleSubmit = async () => {
    if (!businessId) return;
    setSubmitting(true);
    setError('');
    try {
      setSummary(await submitDaySummary(businessId, date, notes));
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't submit the day summary."));
    } finally {
      setSubmitting(false);
    }
  };

  const submitted = summary?.submission.submittedAt;

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Day summary</Text>
      </View>

      {/* Fields and the button below stay above the keyboard (Android is edge-to-edge). */}
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <DatePickerField label="Day" value={date} onChange={setDate} maximumDate={new Date()} />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!summary && !error ? <ActivityIndicator color={colors.text.secondary} /> : null}

          {summary ? (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Visits</Text>
                <Row label="Appointments" value={String(summary.appointments)} />
                <Row label="Walk-ins" value={String(summary.walkIns)} />
                <Row label="Completed" value={String(summary.completed)} />
                <Row label="No-shows" value={String(summary.noShows)} />
                <Row label="Cancelled" value={String(summary.cancelled)} />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Collected</Text>
                <Row label={`Cash (${summary.collected.cash.count})`} value={money(summary.collected.cash.amount)} />
                <Row label={`M-Pesa (${summary.collected.mpesa.count})`} value={money(summary.collected.mpesa.amount)} />
                <Text style={styles.hint}>Of which</Text>
                <Row
                  label={`Deposits (${summary.collected.depositsCollected.count})`}
                  value={money(summary.collected.depositsCollected.amount)}
                />
                <Row
                  label={`Balance payments (${summary.collected.balancePayments.count})`}
                  value={money(summary.collected.balancePayments.amount)}
                />
                {summary.collected.tips && summary.collected.tips.amount > 0 ? (
                  // In the till, but the staff's: already credited to their wallets.
                  <Row
                    label={`Tips for staff (${summary.collected.tips.count})`}
                    value={money(summary.collected.tips.amount)}
                  />
                ) : null}
                {summary.refundsPaid.count > 0 ? (
                  <Row
                    label={`Refunds paid back (${summary.refundsPaid.count})`}
                    value={`− ${money(summary.refundsPaid.amount)}`}
                  />
                ) : null}
              </View>

              {summary.unpaid.length > 0 ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Not paid yet</Text>
                  {summary.unpaid.map((visit) => (
                    <Pressable key={visit.bookingId} onPress={() => router.push(`/appointment/${visit.bookingId}`)}>
                      <Row label={`${visit.time} · ${visit.customerName}`} value={money(visit.balanceDue.amount)} />
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Submit to owner</Text>
                {submitted ? (
                  <Text style={styles.hint}>
                    Submitted {new Date(submitted).toLocaleString()}
                    {summary.submission.submittedBy ? ` by ${summary.submission.submittedBy}` : ''}
                  </Text>
                ) : null}
                <Input
                  label="Notes (optional)"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. KSh 200 short due to change"
                  multiline
                />
                <Button
                  label={submitting ? 'Submitting…' : submitted ? 'Update submission' : 'Submit to owner'}
                  disabled={submitting}
                  onPress={handleSubmit}
                />
              </View>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  content: {
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowLabel: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  rowValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  hint: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  error: {
    ...typography.body,
    color: colors.feedback.danger,
  },
});

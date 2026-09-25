import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BarChart } from '../../components/charts/BarChart';
import { DonutChart } from '../../components/charts/DonutChart';
import { DatePickerField } from '../../components/DatePickerField';
import { TransactionList } from '../../components/TransactionList';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useBookingsStore } from '../../store/useBookingsStore';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { usePayoutsStore } from '../../store/usePayoutsStore';
import { PAYOUT_STATUS_COLOR, PAYOUT_STATUS_LABEL } from '../../utils/payout';
import {
  buildCustomDateRange,
  getAppointmentStats,
  getEarningsBuckets,
  getPaymentMethodBreakdown,
  getPresetDateRange,
  getServicesBreakdown,
  getTransactionLines,
  type EarningsRange,
} from '../../utils/earnings';
import { colors, radii, shadows, spacing, typography } from '../../theme';

const RANGE_OPTIONS: { value: EarningsRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom' },
];

const PAYMENT_METHOD_COLOR = {
  mpesa: colors.brand.purple,
  cash: colors.brand.pink,
} as const;

const PAYMENT_METHOD_LABEL = {
  mpesa: 'M-Pesa',
  cash: 'Cash',
} as const;

function todayKey(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMoney(amount: number): string {
  return `KSh ${amount.toLocaleString('en-US')}`;
}

function formatRequestDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Wide enough to cover "lifetime" without a dedicated all-time DateRange
// concept in utils/earnings.ts — reuses the same getAppointmentStats this
// screen already calls for the range-toggle section.
const LIFETIME_RANGE = { start: new Date(2000, 0, 1), end: new Date(2100, 0, 1) };

// S2 (earnings tracking) + S3 (payout request, wallet model) folded into
// one tab, per explicit request, rather than a separate Payouts tab — S3
// has no O4 (owner approval) counterpart built yet, so it wouldn't stand on
// its own. The wallet balance accumulates continuously (lifetime commission
// earned minus everything ever requested, any status) rather than being a
// fixed "today's commission, once a day" amount — a request reserves that
// amount against the balance immediately, not just once paid, so the same
// earnings can't be requested twice while a request is still pending. The
// charts/range-toggle section below deliberately mirrors EarningsScreen/
// TeamMemberDetailScreen's earnings section exactly, just scoped to "my"
// bookings via staffSession.invitationId instead of a businessId or a
// member being viewed by the owner.
export function StaffEarningsScreen() {
  const router = useRouter();
  const staffSession = useOwnedBusinessStore((s) => s.staffSession);
  const allServices = useBusinessOnboardingStore((s) => s.services);
  const invitation = useBusinessOnboardingStore((s) =>
    s.invitations.find((i) => i.invitationId === staffSession?.invitationId),
  );
  const bookings = useBookingsStore((s) => s.bookings);
  const payouts = usePayoutsStore((s) => s.payouts);
  const requestPayoutNow = usePayoutsStore((s) => s.requestPayoutNow);

  const [range, setRange] = useState<EarningsRange>('today');
  const [customStart, setCustomStart] = useState(todayKey);
  const [customEnd, setCustomEnd] = useState(todayKey);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSheetVisible, setRequestSheetVisible] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');

  const myBookings = useMemo(
    () =>
      staffSession
        ? bookings.filter((b) => b.businessId === staffSession.businessId && b.staffId === staffSession.invitationId)
        : [],
    [bookings, staffSession],
  );

  const myPayouts = useMemo(
    () =>
      staffSession
        ? payouts
            .filter((p) => p.invitationId === staffSession.invitationId)
            .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
        : [],
    [payouts, staffSession],
  );

  const dateRange = useMemo(
    () => (range === 'custom' ? buildCustomDateRange(customStart, customEnd) : getPresetDateRange(range)),
    [range, customStart, customEnd],
  );

  const buckets = useMemo(() => getEarningsBuckets(myBookings, dateRange), [myBookings, dateRange]);
  const paymentBreakdown = useMemo(() => getPaymentMethodBreakdown(myBookings, dateRange), [myBookings, dateRange]);
  const servicesBreakdown = useMemo(
    () => getServicesBreakdown(allServices, myBookings, dateRange),
    [allServices, myBookings, dateRange],
  );
  const stats = useMemo(() => getAppointmentStats(myBookings, dateRange), [myBookings, dateRange]);
  const transactions = useMemo(() => getTransactionLines(myBookings, dateRange), [myBookings, dateRange]);

  const lifetimeStats = useMemo(() => getAppointmentStats(myBookings, LIFETIME_RANGE), [myBookings]);
  const commissionPercent = invitation?.commissionPercent ?? 0;
  const lifetimeCommission = Math.round(lifetimeStats.totalRevenue * (commissionPercent / 100));
  // Rejected requests release their reserved amount back to the balance —
  // only pending/paid ones actually hold funds against it.
  const totalRequested = myPayouts
    .filter((p) => p.status !== 'rejected')
    .reduce((sum, p) => sum + p.amount, 0);
  const availableBalance = Math.max(0, lifetimeCommission - totalRequested);

  if (!staffSession) {
    return <SafeAreaView style={styles.flex} edges={['top']} />;
  }

  const requestValue = parseInt(requestAmount, 10);
  const canRequest = !Number.isNaN(requestValue) && requestValue > 0 && requestValue <= availableBalance;

  const openRequestSheet = () => {
    setRequestAmount(availableBalance > 0 ? String(availableBalance) : '');
    setRequestSheetVisible(true);
  };

  const handleRequestPayout = async () => {
    if (!canRequest || isRequesting) return;
    setIsRequesting(true);
    await requestPayoutNow({
      businessId: staffSession.businessId,
      invitationId: staffSession.invitationId,
      amount: requestValue,
    });
    setIsRequesting(false);
    setRequestSheetVisible(false);
    setRequestAmount('');
  };

  const donutSegments = paymentBreakdown.map((slice) => ({
    label: PAYMENT_METHOD_LABEL[slice.method],
    value: slice.amount,
    color: PAYMENT_METHOD_COLOR[slice.method],
  }));
  const bookedServices = servicesBreakdown.filter((s) => s.bookingsCount > 0);
  const maxServiceAmount = Math.max(...servicesBreakdown.map((s) => s.amount), 1);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.payoutCard}>
          <Text style={styles.payoutLabel}>Wallet balance</Text>
          <Text style={styles.payoutValue}>{formatMoney(availableBalance)}</Text>
          <Text style={styles.payoutHint}>
            {formatMoney(lifetimeCommission)} earned · {formatMoney(totalRequested)} requested
          </Text>
          <Button
            label="Request payout"
            variant="secondary"
            disabled={availableBalance <= 0}
            onPress={openRequestSheet}
            style={styles.payoutButton}
          />

          {myPayouts.length > 0 ? (
            <View style={styles.payoutHistory}>
              {myPayouts.map((payout) => (
                <View key={payout.payoutId} style={styles.payoutHistoryEntry}>
                  <View style={styles.payoutHistoryRow}>
                    <Text style={styles.payoutHistoryDate}>{formatRequestDate(payout.requestedAt)}</Text>
                    <Text style={styles.payoutHistoryAmount}>{formatMoney(payout.amount)}</Text>
                    <Text style={[styles.payoutHistoryStatus, { color: PAYOUT_STATUS_COLOR[payout.status] }]}>
                      {PAYOUT_STATUS_LABEL[payout.status]}
                    </Text>
                  </View>
                  {payout.status === 'rejected' && payout.rejectionReason ? (
                    <Text style={styles.payoutRejectionReason}>Reason: {payout.rejectionReason}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map((option) => {
            const selected = option.value === range;
            return (
              <Pressable
                key={option.value}
                style={[styles.rangePill, selected && styles.rangePillSelected]}
                onPress={() => setRange(option.value)}
              >
                <Text style={[styles.rangePillText, selected && styles.rangePillTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {range === 'custom' ? (
          <View style={styles.customRow}>
            <DatePickerField label="From" value={customStart} onChange={setCustomStart} maximumDate={new Date()} />
            <DatePickerField label="To" value={customEnd} onChange={setCustomEnd} maximumDate={new Date()} />
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Your work</Text>
          <Text style={styles.heroValue}>{formatMoney(stats.totalRevenue)}</Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {formatMoney(Math.round(stats.totalRevenue * (commissionPercent / 100)))}
              </Text>
              <Text style={styles.heroStatLabel}>Your split</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{stats.completed}</Text>
              <Text style={styles.heroStatLabel}>Completed</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{formatMoney(stats.avgTicket)}</Text>
              <Text style={styles.heroStatLabel}>Avg ticket</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Revenue trend</Text>
          {stats.totalRevenue === 0 ? (
            <Text style={styles.emptyHint}>No paid appointments yet in this range.</Text>
          ) : (
            <BarChart data={buckets} />
          )}
        </View>

        {donutSegments.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment methods</Text>
            <View style={styles.donutRow}>
              <DonutChart
                segments={donutSegments}
                centerValue={formatMoney(stats.totalRevenue)}
                centerLabel="total"
              />
              <View style={styles.legend}>
                {paymentBreakdown.map((slice) => (
                  <View key={slice.method} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: PAYMENT_METHOD_COLOR[slice.method] }]} />
                    <View style={styles.legendTextGroup}>
                      <Text style={styles.legendLabel}>{PAYMENT_METHOD_LABEL[slice.method]}</Text>
                      <Text style={styles.legendValue}>
                        {formatMoney(slice.amount)} · {slice.count} paid
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {bookedServices.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Services performed</Text>
            <View style={styles.serviceList}>
              {bookedServices.map((service) => {
                const widthPercent = (service.amount / maxServiceAmount) * 100;
                return (
                  <View key={service.serviceId} style={styles.serviceRow}>
                    <View style={styles.serviceRowHeader}>
                      <Text style={styles.serviceName} numberOfLines={1}>
                        {service.name}
                      </Text>
                      <Text style={styles.serviceAmount}>{formatMoney(service.amount)}</Text>
                    </View>
                    <View style={styles.serviceBarTrack}>
                      <View style={[styles.serviceBarFill, { width: `${widthPercent}%` }]} />
                    </View>
                    <Text style={styles.serviceMeta}>
                      {service.bookingsCount} booking{service.bookingsCount === 1 ? '' : 's'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transactions</Text>
          <TransactionList
            transactions={transactions}
            isCustomRange={range === 'custom'}
            onPressTransaction={(bookingId) => router.push(`/appointment/${bookingId}`)}
          />
        </View>
      </ScrollView>

      <Modal
        visible={requestSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRequestSheetVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setRequestSheetVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Request payout</Text>
            <Text style={styles.sheetSubtitle}>Available: {formatMoney(availableBalance)}</Text>
            <Input
              label="Amount (KSh)"
              value={requestAmount}
              onChangeText={setRequestAmount}
              keyboardType="number-pad"
              autoFocus
            />
            <Button
              label={isRequesting ? 'Requesting…' : 'Request payout'}
              disabled={!canRequest || isRequesting}
              onPress={handleRequestPayout}
              style={styles.sheetButton}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  payoutCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.card,
  },
  payoutLabel: {
    ...typography.label,
    color: colors.text.secondary,
  },
  payoutValue: {
    ...typography.h2,
    color: colors.text.primary,
  },
  payoutHint: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  payoutButton: {
    marginTop: spacing.sm,
  },
  payoutHistory: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    gap: spacing.sm,
  },
  payoutHistoryEntry: {
    gap: 2,
  },
  payoutHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  payoutRejectionReason: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  payoutHistoryDate: {
    ...typography.caption,
    color: colors.text.tertiary,
    width: 48,
  },
  payoutHistoryAmount: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  payoutHistoryStatus: {
    ...typography.caption,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  sheetTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  sheetSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: -spacing.sm,
  },
  sheetButton: {
    marginTop: spacing.sm,
  },
  rangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rangePill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.pill.unselectedBg,
  },
  rangePillSelected: {
    backgroundColor: colors.pill.selectedBg,
  },
  rangePillText: {
    ...typography.bodyMedium,
    color: colors.pill.unselectedText,
  },
  rangePillTextSelected: {
    color: colors.pill.selectedText,
  },
  customRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.text.primary,
    padding: spacing.xl,
    gap: spacing.xs,
    ...shadows.card,
  },
  heroLabel: {
    ...typography.body,
    color: 'rgba(255,255,255,0.7)',
  },
  heroValue: {
    ...typography.h1,
    color: colors.white,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  heroStat: {
    gap: 2,
    flex: 1,
  },
  heroStatValue: {
    ...typography.bodyMedium,
    color: colors.white,
  },
  heroStatLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
  },
  card: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.card,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  legend: {
    flex: 1,
    gap: spacing.md,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendTextGroup: {
    gap: 2,
  },
  legendLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  legendValue: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  serviceList: {
    gap: spacing.md,
  },
  serviceRow: {
    gap: spacing.xs,
  },
  serviceRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  serviceName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  serviceAmount: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  serviceBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background.tertiary,
    overflow: 'hidden',
  },
  serviceBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.brand.purple,
  },
  serviceMeta: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
});

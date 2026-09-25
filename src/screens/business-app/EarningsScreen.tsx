import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BarChart } from '../../components/charts/BarChart';
import { DonutChart } from '../../components/charts/DonutChart';
import { DatePickerField } from '../../components/DatePickerField';
import { TransactionList } from '../../components/TransactionList';
import { useBookingsStore } from '../../store/useBookingsStore';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
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

// Read-only analytics over useBookingsStore — no new data source, just
// aggregation (see src/utils/earnings.ts) over what Charge customer/Today/
// Calendar already write. Custom react-native-svg charts, not a charting
// library (none was installed, and this keeps the same hand-drawn visual
// language as the rest of the app). Defaults to "Today" on open — that's
// the question an owner checking in mid-shift actually has.
export function EarningsScreen() {
  const router = useRouter();
  const ownedBusiness = useOwnedBusinessStore((s) => s.business);
  const allServices = useBusinessOnboardingStore((s) => s.services);
  const bookings = useBookingsStore((s) => s.bookings);
  const [range, setRange] = useState<EarningsRange>('today');
  const [customStart, setCustomStart] = useState(todayKey);
  const [customEnd, setCustomEnd] = useState(todayKey);

  const businessBookings = useMemo(
    () => (ownedBusiness ? bookings.filter((b) => b.businessId === ownedBusiness.businessId) : []),
    [bookings, ownedBusiness],
  );

  const dateRange = useMemo(
    () => (range === 'custom' ? buildCustomDateRange(customStart, customEnd) : getPresetDateRange(range)),
    [range, customStart, customEnd],
  );

  const buckets = useMemo(() => getEarningsBuckets(businessBookings, dateRange), [businessBookings, dateRange]);
  const paymentBreakdown = useMemo(
    () => getPaymentMethodBreakdown(businessBookings, dateRange),
    [businessBookings, dateRange],
  );
  const servicesBreakdown = useMemo(
    () => getServicesBreakdown(allServices, businessBookings, dateRange),
    [allServices, businessBookings, dateRange],
  );
  const stats = useMemo(() => getAppointmentStats(businessBookings, dateRange), [businessBookings, dateRange]);
  const transactions = useMemo(
    () => getTransactionLines(businessBookings, dateRange),
    [businessBookings, dateRange],
  );

  if (!ownedBusiness) {
    return <SafeAreaView style={styles.flex} edges={['top']} />;
  }

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
          <Text style={styles.heroLabel}>Total earned</Text>
          <Text style={styles.heroValue}>{formatMoney(stats.totalRevenue)}</Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{stats.completed}</Text>
              <Text style={styles.heroStatLabel}>Completed</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{formatMoney(stats.avgTicket)}</Text>
              <Text style={styles.heroStatLabel}>Avg ticket</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{stats.noShow + stats.cancelled}</Text>
              <Text style={styles.heroStatLabel}>No-show/cancelled</Text>
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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Services</Text>
          {servicesBreakdown.length === 0 ? (
            <Text style={styles.emptyHint}>No services yet — add some from the Business tab.</Text>
          ) : (
            <View style={styles.serviceList}>
              {bookedServices.length === 0 ? (
                <Text style={styles.emptyHint}>None of your services have a paid appointment in this range yet.</Text>
              ) : null}
              {servicesBreakdown.map((service) => {
                const widthPercent = (service.amount / maxServiceAmount) * 100;
                return (
                  <View key={service.serviceId} style={styles.serviceRow}>
                    <View style={styles.serviceRowHeader}>
                      <Text style={styles.serviceName} numberOfLines={1}>
                        {service.name}
                      </Text>
                      <Text style={service.amount > 0 ? styles.serviceAmount : styles.serviceAmountMuted}>
                        {service.amount > 0 ? formatMoney(service.amount) : 'Not booked'}
                      </Text>
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
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transactions</Text>
          <TransactionList
            transactions={transactions}
            isCustomRange={range === 'custom'}
            onPressTransaction={(bookingId) => router.push(`/appointment/${bookingId}`)}
          />
        </View>
      </ScrollView>
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
    gap: spacing.lg,
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
  serviceAmountMuted: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
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

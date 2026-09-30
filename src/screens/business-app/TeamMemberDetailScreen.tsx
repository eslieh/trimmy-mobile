import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { DatePickerField } from '../../components/DatePickerField';
import { Input } from '../../components/Input';
import { WorkingDaysPicker } from '../../components/WorkingDaysPicker';
import { TransactionList } from '../../components/TransactionList';
import { BarChart } from '../../components/charts/BarChart';
import { DonutChart } from '../../components/charts/DonutChart';
import { useBookingsStore } from '../../store/useBookingsStore';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { getStaffServices, setStaffServices, type StaffServices } from '../../api/team';
import { getStaffPayoutBalance } from '../../api/payouts';
import type { PayoutBalance } from '../../types/payout';
import {
  INVITATION_STATUS_COLOR,
  INVITATION_STATUS_LABEL,
  TEAM_ROLE_LABEL,
  teamMemberDisplayName,
} from '../../utils/team';
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
import type { WeeklyHours } from '../../types/business';
import { showApiError } from '../../utils/showApiError';
import { dateRangeKeys, useSyncBusinessBookings } from '../../hooks/useSyncBusinessBookings';

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

// Reached from the Team screen. Contact info is read-only here (set at
// invite time); commission split and working days are editable, since
// those are the two things an owner actually adjusts after someone's
// already on the team. "Mark as joined" is a testing convenience, not real
// auth — see useBusinessOnboardingStore's markTeamMemberActiveForTesting.
// Earnings section deliberately mirrors EarningsScreen (same range toggle,
// same charts, same aggregation functions from utils/earnings.ts) just
// pre-filtered to this member's assigned bookings — see StartWalkInScreen/
// ScheduleAppointmentScreen's "Assign to" picker for how a booking ends up
// tied to a specific member (booking.staffId === invitation.staffId — null until they accept).
export function TeamMemberDetailScreen() {
  const router = useRouter();
  const { invitationId } = useLocalSearchParams<{ invitationId: string }>();
  const business = useBusinessOnboardingStore((s) => s.business);
  const allServices = useBusinessOnboardingStore((s) => s.services);
  const invitation = useBusinessOnboardingStore((s) => s.invitations.find((i) => i.invitationId === invitationId));
  const updateTeamMemberNow = useBusinessOnboardingStore((s) => s.updateTeamMemberNow);
  const removeTeamMemberNow = useBusinessOnboardingStore((s) => s.removeTeamMemberNow);
  const markTeamMemberActiveForTesting = useBusinessOnboardingStore((s) => s.markTeamMemberActiveForTesting);
  const bookings = useBookingsStore((s) => s.bookings);

  const [commissionPercent, setCommissionPercent] = useState(() => String(invitation?.commissionPercent ?? 40));
  const [workingDays, setWorkingDays] = useState<(keyof WeeklyHours)[] | null>(invitation?.workingDays ?? null);
  // Services they perform — keyed by staffId, so only loadable once the
  // invitation is accepted. savedServices is what the server has.
  const [savedServices, setSavedServices] = useState<StaffServices | null>(null);
  const [staffServices, setStaffServicesDraft] = useState<StaffServices | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [range, setRange] = useState<EarningsRange>('today');
  const [customStart, setCustomStart] = useState(todayKey);
  const [customEnd, setCustomEnd] = useState(todayKey);

  const staffId = invitation?.staffId ?? null;
  const businessId = business?.businessId;
  // Their wallet (commission on paid bookings minus payouts), from the server.
  const [wallet, setWallet] = useState<PayoutBalance | null>(null);
  useEffect(() => {
    if (!businessId || !staffId) return;
    getStaffPayoutBalance(businessId, staffId).then(setWallet).catch(() => {});
  }, [businessId, staffId]);

  useEffect(() => {
    if (!businessId || !staffId) return;
    getStaffServices(businessId, staffId)
      .then((loaded) => {
        setSavedServices(loaded);
        setStaffServicesDraft(loaded);
      })
      .catch((err) => showApiError("Couldn't load their services", err));
  }, [businessId, staffId]);

  const memberBookings = useMemo(
    () => (business && invitation ? bookings.filter((b) => invitation.staffId !== null && b.businessId === business.businessId && b.staffId === invitation.staffId) : []),
    [bookings, business, invitation],
  );

  const dateRange = useMemo(
    () => (range === 'custom' ? buildCustomDateRange(customStart, customEnd) : getPresetDateRange(range)),
    [range, customStart, customEnd],
  );
  const [syncFrom, syncTo] = dateRangeKeys(dateRange);
  useSyncBusinessBookings(business?.businessId, syncFrom, syncTo);

  const buckets = useMemo(() => getEarningsBuckets(memberBookings, dateRange), [memberBookings, dateRange]);
  const paymentBreakdown = useMemo(
    () => getPaymentMethodBreakdown(memberBookings, dateRange),
    [memberBookings, dateRange],
  );
  const servicesBreakdown = useMemo(
    () => getServicesBreakdown(allServices, memberBookings, dateRange),
    [allServices, memberBookings, dateRange],
  );
  const stats = useMemo(() => getAppointmentStats(memberBookings, dateRange), [memberBookings, dateRange]);
  const transactions = useMemo(() => getTransactionLines(memberBookings, dateRange), [memberBookings, dateRange]);

  if (!business || !invitation) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <BackButton onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const commissionValue = parseInt(commissionPercent, 10);
  const memberChanged =
    commissionValue !== invitation.commissionPercent ||
    JSON.stringify(workingDays) !== JSON.stringify(invitation.workingDays);
  const servicesChanged =
    staffServices !== null &&
    savedServices !== null &&
    (staffServices.allServices !== savedServices.allServices ||
      [...staffServices.serviceIds].sort().join() !== [...savedServices.serviceIds].sort().join());
  const canSave =
    (memberChanged || servicesChanged) && !Number.isNaN(commissionValue) && commissionValue >= 0 && commissionValue <= 100;

  // Tapping a specific service switches off "All services"; tapping "All
  // services" clears the specific picks.
  const toggleService = (serviceId: string) => {
    setStaffServicesDraft((current) => {
      if (!current) return current;
      const base = current.allServices ? [] : current.serviceIds;
      const serviceIds = base.includes(serviceId) ? base.filter((id) => id !== serviceId) : [...base, serviceId];
      return { allServices: false, serviceIds };
    });
  };
  const commissionAmount = Math.round(stats.totalRevenue * ((invitation.commissionPercent ?? 0) / 100));

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    try {
      if (memberChanged) {
        await updateTeamMemberNow(business.businessId, invitation, { commissionPercent: commissionValue, workingDays });
      }
      if (servicesChanged && staffId && staffServices) {
        const saved = await setStaffServices(business.businessId, staffId, staffServices);
        setSavedServices(saved);
        setStaffServicesDraft(saved);
      }
    } catch (err) {
      showApiError("Couldn't save changes", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      await removeTeamMemberNow(business.businessId, invitation.invitationId);
      router.back();
    } catch (err) {
      showApiError("Couldn't remove team member", err);
      setIsRemoving(false);
    }
  };

  const donutSegments = paymentBreakdown.map((slice) => ({
    label: PAYMENT_METHOD_LABEL[slice.method],
    value: slice.amount,
    color: PAYMENT_METHOD_COLOR[slice.method],
  }));
  const bookedServices = servicesBreakdown.filter((s) => s.bookingsCount > 0);
  const maxServiceAmount = Math.max(...servicesBreakdown.map((s) => s.amount), 1);

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Team member</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.contactHeader}>
            <Text style={styles.memberName}>
              {teamMemberDisplayName(invitation)}
            </Text>
            <Text style={[styles.statusBadge, { color: INVITATION_STATUS_COLOR[invitation.status] }]}>
              {INVITATION_STATUS_LABEL[invitation.status]}
            </Text>
          </View>
          <Text style={styles.contactLine}>{TEAM_ROLE_LABEL[invitation.role]}</Text>
          {invitation.phone ? <Text style={styles.contactLine}>{invitation.phone}</Text> : null}
          {invitation.email ? <Text style={styles.contactLine}>{invitation.email}</Text> : null}
        </View>

        <View>
          <Text style={styles.sectionLabel}>Earnings</Text>
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
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Revenue from this member</Text>
          <Text style={styles.heroValue}>{formatMoney(stats.totalRevenue)}</Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{formatMoney(commissionAmount)}</Text>
              <Text style={styles.heroStatLabel}>Their commission ({invitation.commissionPercent}%)</Text>
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
            <Text style={styles.emptyHint}>No paid appointments assigned to them yet in this range.</Text>
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

        {wallet ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Wallet</Text>
            <Text style={styles.serviceName}>KSh {wallet.available.toLocaleString('en-US')} available</Text>
            <Text style={styles.emptyHint}>
              KSh {wallet.earned.toLocaleString('en-US')} earned · KSh {wallet.paid.toLocaleString('en-US')} paid out
              {wallet.pending > 0 ? ` · KSh ${wallet.pending.toLocaleString('en-US')} requested` : ''}
            </Text>
          </View>
        ) : null}

        <Input
          label="Commission split (%)"
          value={commissionPercent}
          onChangeText={setCommissionPercent}
          keyboardType="number-pad"
          helperText="Share of each completed service's price this member earns."
        />

        <WorkingDaysPicker label="Working days" value={workingDays} onChange={setWorkingDays} />

        <View>
          <Text style={styles.sectionLabel}>Services they perform</Text>
          {!staffId ? (
            <Text style={styles.emptyHint}>You can choose their services once they accept the invite.</Text>
          ) : !staffServices ? null : (
            <View style={styles.servicePills}>
              <Pressable
                style={[styles.rangePill, staffServices.allServices && styles.rangePillSelected]}
                onPress={() => setStaffServicesDraft({ allServices: true, serviceIds: [] })}
              >
                <Text style={[styles.rangePillText, staffServices.allServices && styles.rangePillTextSelected]}>
                  All services
                </Text>
              </Pressable>
              {allServices.map((service) => {
                const selected = !staffServices.allServices && staffServices.serviceIds.includes(service.serviceId);
                return (
                  <Pressable
                    key={service.serviceId}
                    style={[styles.rangePill, selected && styles.rangePillSelected]}
                    onPress={() => toggleService(service.serviceId)}
                  >
                    <Text style={[styles.rangePillText, selected && styles.rangePillTextSelected]}>{service.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <Button label={isSaving ? 'Saving…' : 'Save changes'} disabled={!canSave || isSaving} onPress={handleSave} />

        {invitation.status === 'pending' ? (
          <Button
            label="Mark as joined (testing)"
            variant="secondary"
            onPress={() => markTeamMemberActiveForTesting(invitation.invitationId)}
          />
        ) : null}

        <Button
          label={invitation.status === 'pending' ? 'Cancel invite' : 'Remove from team'}
          variant="secondary"
          disabled={isRemoving}
          onPress={handleRemove}
          style={styles.removeButton}
        />
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
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  card: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.card,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  memberName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  statusBadge: {
    ...typography.bodyMedium,
  },
  contactLine: {
    ...typography.body,
    color: colors.text.secondary,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
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
    marginTop: spacing.md,
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
  servicePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  removeButton: {
    marginTop: spacing.sm,
  },
});

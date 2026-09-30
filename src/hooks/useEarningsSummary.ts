import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getEarningsSummary, type EarningsSummary } from '../api/earnings';
import { getApiErrorMessage } from '../api/client';
import { dateRangeKeys } from './useSyncBusinessBookings';
import type { DateRange } from '../utils/earnings';

// Loads the server's earnings summary for a screen's range (Earnings,
// Member Detail with staffId, the staff app's own Earnings), refreshing on
// focus and whenever the range changes. Preset ranges only show the newest
// 10 transactions, so only those are fetched; a custom range gets them all.
export function useEarningsSummary(
  businessId: string | undefined,
  range: DateRange,
  options: { staffId?: string; allTransactions?: boolean } = {},
) {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [error, setError] = useState('');
  const [from, to] = dateRangeKeys(range);
  const { staffId, allTransactions } = options;

  const load = useCallback(() => {
    if (!businessId) return;
    setError('');
    getEarningsSummary(businessId, { from, to, staffId, transactionsLimit: allTransactions ? undefined : 10 })
      .then(setSummary)
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load earnings.")));
  }, [businessId, from, to, staffId, allTransactions]);

  useFocusEffect(load);

  return { summary, error, refresh: load };
}

// The summary in the shapes the charts/lists already take (the ones
// utils/earnings.ts used to produce), with empty defaults while loading.
// Deleted services come back with serviceId null; give them a stable key.
export function earningsViews(summary: EarningsSummary | null) {
  return {
    buckets: summary?.buckets ?? [],
    paymentBreakdown: summary?.paymentMethods ?? [],
    servicesBreakdown: (summary?.services ?? []).map((row) => ({
      ...row,
      serviceId: row.serviceId ?? `deleted:${row.name}`,
    })),
    stats: {
      completed: summary?.completed ?? 0,
      noShow: summary?.noShow ?? 0,
      cancelled: summary?.cancelled ?? 0,
      totalRevenue: summary?.totalRevenue ?? 0,
      avgTicket: summary?.avgTicket ?? 0,
    },
    transactions: (summary?.transactions ?? []).map((line) => ({ ...line, serviceId: line.serviceId ?? '' })),
  };
}

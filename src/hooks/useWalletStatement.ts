import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { WalletStatement } from '../types/payout';

// Pages through a wallet statement (newest first), reloading from the top
// whenever the screen comes into focus or `fetchPage` changes.
export function useWalletStatement(fetchPage: ((offset: number) => Promise<WalletStatement>) | null) {
  const [entries, setEntries] = useState<WalletStatement['entries']>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    (offset: number) => {
      if (!fetchPage) return;
      setLoading(true);
      return fetchPage(offset)
        .then((page) => {
          setEntries((current) => (offset === 0 ? page.entries : [...current, ...page.entries]));
          setNextOffset(page.nextOffset);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [fetchPage],
  );

  const reload = useCallback(() => load(0), [load]);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return {
    entries,
    loading,
    hasMore: nextOffset !== null,
    loadMore: () => nextOffset !== null && load(nextOffset),
    reload,
  };
}

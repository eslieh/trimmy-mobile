import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, spacing, typography } from '../theme';
import type { WalletEntry } from '../types/payout';

interface WalletStatementListProps {
  entries: WalletEntry[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  showBusiness?: boolean; // a wallet spanning several businesses
  // Long-press an adjustment (tip / bonus / deduction / advance), e.g. the
  // owner's Void.
  onLongPressAdjustment?: (entry: WalletEntry) => void;
}

function money(amount: number): string {
  const sign = amount < 0 ? '−' : amount > 0 ? '+' : '';
  return `${sign}KSh ${Math.abs(amount).toLocaleString('en-US')}`;
}

// The wallet statement (get-wallet-statement): newest first, each line's
// signed effect and the balance right after it.
export function WalletStatementList({
  entries,
  hasMore,
  loading,
  onLoadMore,
  showBusiness,
  onLongPressAdjustment,
}: WalletStatementListProps) {
  if (entries.length === 0 && !loading) {
    return <Text style={styles.empty}>No wallet activity yet.</Text>;
  }

  return (
    <View>
      {entries.map((entry) => {
        const isAdjustment = !!entry.adjustmentId;
        return (
          <Pressable
            key={entry.entryId}
            style={styles.row}
            disabled={!isAdjustment || !onLongPressAdjustment}
            onLongPress={() => onLongPressAdjustment?.(entry)}
          >
            <View style={styles.info}>
              <Text style={styles.description}>{entry.description}</Text>
              <Text style={styles.meta}>
                {new Date(entry.at).toLocaleDateString()}
                {showBusiness ? ` · ${entry.businessName}` : ''}
                {entry.type === 'payout' && entry.payoutStatus ? ` · ${entry.payoutStatus}` : ''}
              </Text>
              {entry.note && entry.type !== 'tip' ? <Text style={styles.meta}>{entry.note}</Text> : null}
            </View>
            <View style={styles.amounts}>
              <Text style={[styles.amount, entry.amount < 0 && styles.negative]}>{money(entry.amount)}</Text>
              <Text style={styles.meta}>KSh {entry.balanceAfter.toLocaleString('en-US')}</Text>
            </View>
          </Pressable>
        );
      })}
      {hasMore ? (
        <Button label={loading ? 'Loading…' : 'Load more'} variant="secondary" disabled={loading} onPress={onLoadMore} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  description: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  meta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  amounts: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amount: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  negative: {
    color: colors.feedback.danger,
  },
  empty: {
    ...typography.body,
    color: colors.text.secondary,
  },
});

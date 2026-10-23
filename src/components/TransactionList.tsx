import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { colors, spacing, typography } from '../theme';
import type { TransactionLine } from '../utils/earnings';

const DEFAULT_VISIBLE_COUNT = 10;

function formatDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMoney(amount: number): string {
  return `KSh ${amount.toLocaleString('en-US')}`;
}

interface TransactionListProps {
  transactions: TransactionLine[];
  isCustomRange: boolean; // custom range = the owner/staff deliberately asked for this window, so show everything in it rather than capping at 10
  onPressTransaction: (bookingId: string) => void;
}

// Shared by EarningsScreen, TeamMemberDetailScreen, and StaffEarningsScreen
// — the line-by-line ledger underneath the charts (one row per service
// performed: date/time, customer, service, amount). Capped to the 10 most
// recent for a preset range (Today/Week/Month/Year) since those are meant
// to be a quick pulse-check, not a full export; a Custom range is the
// explicit "show me everything in this window" request, so it isn't capped.
// Tapping a row goes to the existing AppointmentDetailScreen (customer
// contact, full service/price breakdown, payment method + M-Pesa reference)
// rather than a separate transaction-detail screen — that screen already
// has everything this needs.
export function TransactionList({ transactions, isCustomRange, onPressTransaction }: TransactionListProps) {
  if (transactions.length === 0) {
    return <Text style={styles.emptyHint}>No paid transactions in this range yet.</Text>;
  }

  const visible = isCustomRange ? transactions : transactions.slice(0, DEFAULT_VISIBLE_COUNT);
  const hiddenCount = transactions.length - visible.length;

  return (
    <View style={styles.list}>
      {visible.map((line, index) => (
        <Pressable
          key={`${line.bookingId}_${line.serviceId}_${index}`}
          style={styles.row}
          onPress={() => onPressTransaction(line.bookingId)}
        >
          <View style={styles.rowMain}>
            <Text style={styles.customerName} numberOfLines={1}>
              {line.customerName}
            </Text>
            <Text style={styles.amount}>{formatMoney(line.amount)}</Text>
            <ChevronRightIcon size={16} color={colors.text.tertiary} />
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {line.serviceName} · {formatDate(line.date)}, {line.time}
          </Text>
        </Pressable>
      ))}
      {hiddenCount > 0 ? (
        <Text style={styles.moreHint}>
          Showing {visible.length} of {transactions.length} — pick a custom date range to see the rest.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    gap: 2,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  customerName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  amount: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  meta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  moreHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
});

import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar } from '../../components/Avatar';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { usePayoutsStore } from '../../store/usePayoutsStore';
import { PAYOUT_STATUS_COLOR, PAYOUT_STATUS_LABEL } from '../../utils/payout';
import { teamMemberDisplayName } from '../../utils/team';
import { colors, radii, shadows, spacing, typography } from '../../theme';

function formatMoney(amount: number): string {
  return `KSh ${amount.toLocaleString('en-US')}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type SheetMode = 'none' | 'accept' | 'reject';

// Reached from Team's Payouts queue or PayoutHistoryScreen — the O4
// (business-owner.md) approve/reject actions. "Accept & Send" is
// deliberately framed as a manual attestation, not a money-moving action:
// Trimyy has no real payment rail, so the owner pays the staff member
// themselves (M-Pesa/cash) and this just records that they did. Rejecting
// asks for a reason, shown back to the staff member on their own payout
// history (StaffEarningsScreen).
export function PayoutDetailScreen() {
  const router = useRouter();
  const { payoutId } = useLocalSearchParams<{ payoutId: string }>();
  const invitations = useBusinessOnboardingStore((s) => s.invitations);
  const payout = usePayoutsStore((s) => s.payouts.find((p) => p.payoutId === payoutId));
  const respondToPayoutNow = usePayoutsStore((s) => s.respondToPayoutNow);

  const [sheetMode, setSheetMode] = useState<SheetMode>('none');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!payout) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <BackButton onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const invitation = invitations.find((i) => i.invitationId === payout.invitationId);
  const displayName = invitation ? teamMemberDisplayName(invitation) : 'Team member';

  const closeSheet = () => {
    if (isSubmitting) return;
    setSheetMode('none');
    setRejectionReason('');
  };

  const handleAccept = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await respondToPayoutNow(payout, 'approve');
    setIsSubmitting(false);
    setSheetMode('none');
  };

  const handleReject = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await respondToPayoutNow(payout, 'reject', rejectionReason.trim() || undefined);
    setIsSubmitting(false);
    setSheetMode('none');
    setRejectionReason('');
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Payout request</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.memberRow}>
            <Avatar name={displayName} size={44} />
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{displayName}</Text>
              <Text style={styles.requestedAt}>Requested {formatDateTime(payout.requestedAt)}</Text>
            </View>
          </View>
          <Text style={styles.amount}>{formatMoney(payout.amount)}</Text>
          <Text style={[styles.statusBadge, { color: PAYOUT_STATUS_COLOR[payout.status] }]}>
            {PAYOUT_STATUS_LABEL[payout.status]}
          </Text>

          {payout.status === 'paid' && payout.respondedAt ? (
            <Text style={styles.resolvedNote}>Marked as sent {formatDateTime(payout.respondedAt)}</Text>
          ) : null}
          {payout.status === 'rejected' ? (
            <View style={styles.rejectedNote}>
              {payout.respondedAt ? (
                <Text style={styles.resolvedNote}>Rejected {formatDateTime(payout.respondedAt)}</Text>
              ) : null}
              {payout.rejectionReason ? (
                <Text style={styles.resolvedNote}>Reason: {payout.rejectionReason}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {payout.status === 'pending' ? (
          <>
            <Button label="Accept & send" onPress={() => setSheetMode('accept')} />
            <Button
              label="Reject"
              variant="secondary"
              onPress={() => setSheetMode('reject')}
              style={styles.rejectButton}
            />
          </>
        ) : null}
      </ScrollView>

      <Modal visible={sheetMode !== 'none'} transparent animationType="slide" onRequestClose={closeSheet}>
        <Pressable style={styles.overlay} onPress={closeSheet}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {sheetMode === 'accept' ? (
              <>
                <Text style={styles.sheetTitle}>Send {formatMoney(payout.amount)}?</Text>
                <Text style={styles.sheetBody}>
                  This confirms you've already sent {formatMoney(payout.amount)} to {displayName} yourself — via
                  M-Pesa or cash. Trimyy doesn't move money automatically. Their wallet balance has already
                  reserved this amount since they requested it.
                </Text>
                <Button
                  label={isSubmitting ? 'Confirming…' : "I've sent it — mark as paid"}
                  disabled={isSubmitting}
                  onPress={handleAccept}
                  style={styles.sheetButton}
                />
              </>
            ) : (
              <>
                <Text style={styles.sheetTitle}>Reject this request?</Text>
                <Input
                  label="Reason (optional)"
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  placeholder="Let them know why"
                  multiline
                  numberOfLines={3}
                />
                <Button
                  label={isSubmitting ? 'Rejecting…' : 'Confirm rejection'}
                  variant="secondary"
                  disabled={isSubmitting}
                  onPress={handleReject}
                  style={styles.sheetButton}
                />
              </>
            )}
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
    gap: spacing.sm,
    ...shadows.card,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  memberInfo: {
    gap: 2,
  },
  memberName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  requestedAt: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  amount: {
    ...typography.h1,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  statusBadge: {
    ...typography.bodyMedium,
  },
  resolvedNote: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  rejectedNote: {
    gap: 2,
  },
  rejectButton: {
    marginTop: 0,
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
  sheetBody: {
    ...typography.body,
    color: colors.text.secondary,
  },
  sheetButton: {
    marginTop: spacing.sm,
  },
});

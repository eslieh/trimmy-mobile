import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { Button } from './Button';
import { Input } from './Input';
import { markBookingRefunded } from '../api/booking';
import { getApiErrorMessage } from '../api/client';
import { colors, radii, spacing, typography } from '../theme';
import type { Booking } from '../types/booking';

interface MarkRefundedSheetProps {
  booking: Booking | null; // null = hidden
  onClose: () => void;
  onRefunded: (booking: Booking) => void;
}

// Owner / front desk: record that the business has paid back a refund it
// owed (deposits sit in the business's own account, so refunds are sent by
// hand — BK-60). The M-Pesa code of the refund is optional.
export function MarkRefundedSheet({ booking, onClose, onRefunded }: MarkRefundedSheetProps) {
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setReference('');
    setError('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!booking) return;
    setSaving(true);
    setError('');
    try {
      const updated = await markBookingRefunded(booking.bookingId, reference.trim() || undefined);
      setReference('');
      onRefunded(updated);
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't mark this refund as sent."));
    } finally {
      setSaving(false);
    }
  };

  const amount = booking?.refund?.amount.amount;

  return (
    <Modal visible={booking !== null} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.overlay} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Mark refunded</Text>
          <Text style={styles.body}>
            {booking ? `Confirm you've sent KES ${amount ?? 0} back to ${booking.customerName}.` : ''}
          </Text>
          <Input
            label="M-Pesa code of the refund (optional)"
            value={reference}
            onChangeText={setReference}
            placeholder="SJK4R2T8QX"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label={saving ? 'Saving…' : 'Mark refunded'} disabled={saving} onPress={handleConfirm} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    gap: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  body: {
    ...typography.body,
    color: colors.text.secondary,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
  },
});

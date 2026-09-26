import { useState } from 'react';
import { startBookingPayment } from '../../../api/booking';
import { getApiErrorCode, getApiErrorMessage } from '../../../api/client';
import { USE_MOCK_BOOKING_PAYMENT } from '../../../config/env';
import { depositFailureMessage } from '../../../utils/depositPayment';
import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../../components/AuthScreenLayout';
import { Button } from '../../../components/Button';
import { PhoneInput } from '../../../components/PhoneInput';
import { useAuth } from '../../../contexts/AuthContext';
import { useBookingDraftStore } from '../../../store/useBookingDraftStore';
import { countries } from '../../../data/countries';
import { normalizePhoneNumber } from '../../../utils/phone';
import { formatCountdown, useCountdown } from '../../../hooks/useCountdown';
import { colors, spacing, typography } from '../../../theme';

const TOTAL_STEPS = 4;
const DEFAULT_COUNTRY = countries.find((c) => c.iso2 === 'KE') ?? countries[0];

export function PaymentMethodScreen() {
  const router = useRouter();
  // failure: set when STK Pending sends the customer back after a failed or
  // timed-out prompt (depositPayment.failureReason).
  const { businessId, failure } = useLocalSearchParams<{ businessId: string; failure?: string }>();
  const { user } = useAuth();
  const setPaymentPhone = useBookingDraftStore((s) => s.setPaymentPhone);
  const bookingId = useBookingDraftStore((s) => s.currentBooking?.bookingId);
  const depositAmount = useBookingDraftStore((s) => s.currentBooking?.depositAmount ?? null);
  // The server holds the slot until expiresAt; after that it's released
  // (booking cancelled, cancelReason payment_expired).
  const expiresAt = useBookingDraftStore((s) => s.currentBooking?.expiresAt ?? null);
  const secondsLeft = useCountdown(expiresAt);
  const expired = secondsLeft === 0;

  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [rawPhone, setRawPhone] = useState(user?.phone?.replace(/^\+\d+/, '') ?? '');

  const [sending, setSending] = useState(false);
  const [error, setError] = useState(failure ? `${depositFailureMessage(failure)} You can try again.` : '');

  const goToPending = () => router.replace(`/business/${businessId}/book/pending`);

  const handleSendStkPush = async () => {
    const phone = normalizePhoneNumber(rawPhone, country);
    setPaymentPhone(phone);
    if (USE_MOCK_BOOKING_PAYMENT || !bookingId) {
      goToPending();
      return;
    }

    setSending(true);
    setError('');
    try {
      await startBookingPayment(bookingId, phone);
      goToPending();
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'payment_in_progress' || code === 'already_paid' || code === 'no_deposit_due') {
        // A prompt is already out, or it's already settled — the pending
        // screen's polling will pick up the outcome either way.
        goToPending();
      } else if (code === 'hold_expired') {
        setError('Your slot hold has expired. Pick a time again to book.');
      } else {
        setError(getApiErrorMessage(err, "Couldn't send the M-Pesa prompt. Please try again."));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Pay your deposit"
      subtitle={
        depositAmount
          ? `We'll send an M-Pesa prompt to this number for KSh ${depositAmount.amount}.`
          : "We'll send an M-Pesa prompt to this number."
      }
      progress={4 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        expired ? (
          <Button label="Pick another time" onPress={() => router.replace(`/business/${businessId}/book/datetime`)} />
        ) : (
          <>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label={sending ? 'Sending…' : failure ? 'Send a new prompt' : 'Send STK Push'}
              disabled={rawPhone.length < 4 || sending}
              onPress={handleSendStkPush}
            />
          </>
        )
      }
    >
      {secondsLeft !== null ? (
        <Text style={[styles.hold, expired && styles.holdExpired]}>
          {expired
            ? 'Your slot hold has expired. Pick a time again to book.'
            : `We're holding this slot for you for ${formatCountdown(secondsLeft)}.`}
        </Text>
      ) : null}
      <PhoneInput
        label="M-Pesa phone number"
        country={country}
        onCountryChange={setCountry}
        value={rawPhone}
        onChangeText={setRawPhone}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  hold: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  holdExpired: {
    color: colors.feedback.danger,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
    marginBottom: spacing.sm,
  },
});

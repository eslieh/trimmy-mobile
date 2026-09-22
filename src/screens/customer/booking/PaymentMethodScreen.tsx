import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../../components/AuthScreenLayout';
import { Button } from '../../../components/Button';
import { PhoneInput } from '../../../components/PhoneInput';
import { useAuth } from '../../../contexts/AuthContext';
import { useBookingDraftStore } from '../../../store/useBookingDraftStore';
import { countries } from '../../../data/countries';
import { normalizePhoneNumber } from '../../../utils/phone';

const TOTAL_STEPS = 4;
const DEFAULT_COUNTRY = countries.find((c) => c.iso2 === 'KE') ?? countries[0];

export function PaymentMethodScreen() {
  const router = useRouter();
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const { user } = useAuth();
  const setPaymentPhone = useBookingDraftStore((s) => s.setPaymentPhone);
  const depositAmount = useBookingDraftStore((s) => s.currentBooking?.depositAmount ?? null);

  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [rawPhone, setRawPhone] = useState(user?.phone?.replace(/^\+\d+/, '') ?? '');

  const handleSendStkPush = () => {
    setPaymentPhone(normalizePhoneNumber(rawPhone, country));
    router.push(`/business/${businessId}/book/pending`);
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
      footer={<Button label="Send STK Push" disabled={rawPhone.length < 4} onPress={handleSendStkPush} />}
    >
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

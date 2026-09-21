import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { PhoneInput } from '../../components/PhoneInput';
import { Button } from '../../components/Button';
import { countries } from '../../data/countries';
import { normalizePhoneNumber } from '../../utils/phone';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';

const TOTAL_STEPS = 11;
const DEFAULT_COUNTRY = countries.find((c) => c.iso2 === 'KE') ?? countries[0];

export function BusinessPhoneScreen() {
  const router = useRouter();
  const updateDraft = useBusinessOnboardingStore((s) => s.updateDraft);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [rawPhone, setRawPhone] = useState('');

  return (
    <AuthScreenLayout
      title="What's your business phone?"
      subtitle="Customers and staff will use this to reach you."
      progress={3 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <Button
          label="Continue"
          disabled={rawPhone.length < 4}
          onPress={() => {
            updateDraft({ phone: normalizePhoneNumber(rawPhone, country) });
            router.push('/business-location');
          }}
        />
      }
    >
      <PhoneInput
        label="Business phone"
        country={country}
        onCountryChange={setCountry}
        value={rawPhone}
        onChangeText={setRawPhone}
      />
    </AuthScreenLayout>
  );
}

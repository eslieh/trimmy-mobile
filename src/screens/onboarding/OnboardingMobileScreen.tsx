import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { PhoneInput } from '../../components/PhoneInput';
import { Button } from '../../components/Button';
import { countries } from '../../data/countries';
import { normalizePhoneNumber } from '../../utils/phone';

const TOTAL_STEPS = 5;
const DEFAULT_COUNTRY = countries.find((c) => c.iso2 === 'US') ?? countries[0];

export function OnboardingMobileScreen() {
  const router = useRouter();
  const { email, password } = useLocalSearchParams<{ email: string; password: string }>();
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [rawNumber, setRawNumber] = useState('');

  return (
    <AuthScreenLayout
      title="What's your mobile number?"
      subtitle="We'll use this to send booking updates and reminders."
      progress={3 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <Button
          label="Continue"
          disabled={rawNumber.length < 4}
          onPress={() =>
            router.push({
              pathname: '/onboarding-name',
              params: {
                email,
                password,
                mobile: normalizePhoneNumber(rawNumber, country),
              },
            })
          }
        />
      }
    >
      <PhoneInput
        label="Mobile number"
        country={country}
        onCountryChange={setCountry}
        value={rawNumber}
        onChangeText={setRawNumber}
      />
    </AuthScreenLayout>
  );
}

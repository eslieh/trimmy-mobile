import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { PhoneInput } from '../../components/PhoneInput';
import { Button } from '../../components/Button';
import { RootStackParamList } from '../../navigation/types';
import { countries } from '../../data/countries';
import { normalizePhoneNumber } from '../../utils/phone';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingMobile'>;

const TOTAL_STEPS = 4;
const DEFAULT_COUNTRY = countries.find((c) => c.iso2 === 'US') ?? countries[0];

export function OnboardingMobileScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [rawNumber, setRawNumber] = useState('');

  return (
    <AuthScreenLayout
      title="What's your mobile number?"
      subtitle="We'll use this to send booking updates and reminders."
      progress={3 / TOTAL_STEPS}
      onBack={() => navigation.goBack()}
      footer={
        <Button
          label="Continue"
          disabled={rawNumber.length < 4}
          onPress={() =>
            navigation.navigate('OnboardingName', {
              email,
              mobile: normalizePhoneNumber(rawNumber, country),
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

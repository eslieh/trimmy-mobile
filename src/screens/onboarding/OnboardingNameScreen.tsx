import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingName'>;

const TOTAL_STEPS = 4;

export function OnboardingNameScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  return (
    <AuthScreenLayout
      title="What's your name?"
      subtitle="This is how you'll appear to your stylist."
      progress={4 / TOTAL_STEPS}
      onBack={() => navigation.goBack()}
      footer={
        <Button
          label="Continue"
          disabled={!firstName.trim() || !lastName.trim()}
          onPress={() =>
            navigation.navigate('Success', {
              title: "You're all set!",
              subtitle: 'Your account is ready to go.',
              ctaLabel: 'Get started',
              nextRoute: 'Welcome',
            })
          }
        />
      }
    >
      <Input label="First name" value={firstName} onChangeText={setFirstName} placeholder="Jane" autoCapitalize="words" />
      <Input label="Last name" value={lastName} onChangeText={setLastName} placeholder="Doe" autoCapitalize="words" />
    </AuthScreenLayout>
  );
}

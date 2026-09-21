import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

const TOTAL_STEPS = 5;

export function OnboardingPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [password, setPassword] = useState('');

  return (
    <AuthScreenLayout
      title="Create a password"
      subtitle="Use at least 8 characters. You'll use this to log in next time."
      progress={2 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <Button
          label="Continue"
          disabled={password.length < 8}
          onPress={() => router.push({ pathname: '/onboarding-verification', params: { email, password } })}
        />
      }
    >
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        secureTextEntry
        autoFocus
      />
    </AuthScreenLayout>
  );
}

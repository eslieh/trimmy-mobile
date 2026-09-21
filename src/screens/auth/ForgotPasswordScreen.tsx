import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  return (
    <AuthScreenLayout
      title="Forgot password?"
      subtitle="Enter the email linked to your account and we'll send you a code to reset your password."
      onBack={() => router.back()}
      footer={
        <Button
          label="Send code"
          disabled={!email.trim()}
          onPress={() => router.push({ pathname: '/forgot-password-verification', params: { email: email.trim() } })}
        />
      }
    >
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </AuthScreenLayout>
  );
}

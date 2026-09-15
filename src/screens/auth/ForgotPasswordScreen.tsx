import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');

  return (
    <AuthScreenLayout
      title="Forgot password?"
      subtitle="Enter the email linked to your account and we'll send you a code to reset your password."
      onBack={() => navigation.goBack()}
      footer={
        <Button
          label="Send code"
          disabled={!email.trim()}
          onPress={() => navigation.navigate('ForgotPasswordVerification', { email: email.trim() })}
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

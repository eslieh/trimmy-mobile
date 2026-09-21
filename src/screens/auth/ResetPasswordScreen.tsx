import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { colors, typography } from '../../theme';

export function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    router.push({
      pathname: '/success',
      params: {
        title: 'Password updated',
        subtitle: 'You can now log in with your new password.',
        ctaLabel: 'Back to log in',
        nextRoute: '/login',
      },
    });
  };

  return (
    <AuthScreenLayout
      title="Set a new password"
      subtitle="Your new password must be different from previously used passwords."
      onBack={() => router.back()}
      footer={
        <Button label="Reset password" disabled={!password || !confirmPassword} onPress={handleSubmit} />
      }
    >
      <Input label="New password" value={password} onChangeText={setPassword} placeholder="Enter new password" secureTextEntry />
      <Input
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Re-enter new password"
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
  },
});

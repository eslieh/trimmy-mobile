import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { colors, typography } from '../../theme';
import { authApi } from '../../api/auth';
import { getApiErrorMessage } from '../../api/client';

export function ResetPasswordScreen() {
  const router = useRouter();
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(email!, otp!, password);
      router.push({
        pathname: '/success',
        params: {
          title: 'Password updated',
          subtitle: 'You can now log in with your new password.',
          ctaLabel: 'Back to log in',
          nextRoute: '/login',
        },
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Set a new password"
      subtitle="Your new password must be different from previously used passwords."
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={loading ? 'Resetting...' : 'Reset password'}
            disabled={!password || !confirmPassword || loading}
            onPress={handleSubmit}
          />
        </>
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
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
    marginBottom: 8,
  },
});

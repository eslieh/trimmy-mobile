import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { colors, typography } from '../../theme';

const TOTAL_STEPS = 5;

export function OnboardingNameScreen() {
  const router = useRouter();
  const { email, password, mobile } = useLocalSearchParams<{ email: string; password: string; mobile: string }>();
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    setLoading(true);
    setError('');
    try {
      await register({
        email,
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: mobile || undefined,
      });
      router.push({
        pathname: '/success',
        params: {
          title: "You're all set!",
          subtitle: 'Your account is ready to go. Check your email for a verification code.',
          ctaLabel: 'Get started',
          nextRoute: '/get-started',
        },
      });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(detail?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="What's your name?"
      subtitle="This is how you'll appear to your stylist."
      progress={5 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={loading ? 'Creating account...' : 'Continue'}
            disabled={!firstName.trim() || !lastName.trim() || loading}
            onPress={handleContinue}
          />
        </>
      }
    >
      <Input label="First name" value={firstName} onChangeText={setFirstName} placeholder="Jane" autoCapitalize="words" />
      <Input label="Last name" value={lastName} onChangeText={setLastName} placeholder="Doe" autoCapitalize="words" />
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

import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { colors, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingName'>;

const TOTAL_STEPS = 4;

export function OnboardingNameScreen({ navigation, route }: Props) {
  const { email, password, mobile } = route.params;
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
      navigation.navigate('Success', {
        title: "You're all set!",
        subtitle: 'Your account is ready to go. Check your email for a verification code.',
        ctaLabel: 'Get started',
        nextRoute: 'GetStarted',
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
      progress={4 / TOTAL_STEPS}
      onBack={() => navigation.goBack()}
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

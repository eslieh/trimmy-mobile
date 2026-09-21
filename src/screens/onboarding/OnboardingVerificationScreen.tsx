import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { OtpInput } from '../../components/OtpInput';
import { Button } from '../../components/Button';
import { colors, spacing, typography } from '../../theme';

const CODE_LENGTH = 6;
const TOTAL_STEPS = 5;

export function OnboardingVerificationScreen() {
  const router = useRouter();
  const { email, password } = useLocalSearchParams<{ email: string; password: string }>();
  const [code, setCode] = useState('');

  return (
    <AuthScreenLayout
      title="Verify your email"
      subtitle={`Enter the 6-digit code we sent to ${email}`}
      progress={3 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <Button
          label="Continue"
          disabled={code.length !== CODE_LENGTH}
          onPress={() => router.push({ pathname: '/onboarding-mobile', params: { email, password } })}
        />
      }
    >
      <OtpInput length={CODE_LENGTH} value={code} onChangeText={setCode} />
      <Pressable hitSlop={8} style={styles.resend}>
        <Text style={styles.resendText}>
          Didn't get a code? <Text style={styles.resendTextStrong}>Resend</Text>
        </Text>
      </Pressable>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  resend: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  resendText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  resendTextStrong: {
    ...typography.bodyMedium,
    color: colors.brand.purple,
  },
});

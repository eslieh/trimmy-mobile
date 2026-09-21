import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { OtpInput } from '../../components/OtpInput';
import { Button } from '../../components/Button';
import { colors, spacing, typography } from '../../theme';
import { authApi } from '../../api/auth';

const CODE_LENGTH = 6;
const TOTAL_STEPS = 5;

export function OnboardingVerificationScreen() {
  const router = useRouter();
  const { email, password } = useLocalSearchParams<{ email: string; password: string }>();
  const [code, setCode] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResend = async () => {
    setResending(true);
    setResendMessage('');
    try {
      const result = await authApi.resendOtp(email!, 'verification');
      setResendMessage(result.message);
    } catch {
      setResendMessage('Failed to resend code. Try again.');
    } finally {
      setResending(false);
    }
  };

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
      {resendMessage ? (
        <View style={styles.resendMessage}>
          <Text style={styles.resendMessageText}>{resendMessage}</Text>
        </View>
      ) : (
        <Pressable hitSlop={8} style={styles.resend} onPress={handleResend} disabled={resending}>
          <Text style={styles.resendText}>
            {resending ? 'Sending...' : "Didn't get a code? "}
            {!resending && <Text style={styles.resendTextStrong}>Resend</Text>}
          </Text>
        </Pressable>
      )}
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
  resendMessage: {
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  resendMessageText: {
    ...typography.caption,
    color: '#166534',
  },
});

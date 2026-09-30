import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { OtpInput } from '../../components/OtpInput';
import { Button } from '../../components/Button';
import { colors, spacing, typography } from '../../theme';
import { authApi } from '../../api/auth';
import { getApiErrorMessage } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

const CODE_LENGTH = 6;
const TOTAL_STEPS = 5;

export function OnboardingVerificationScreen() {
  const router = useRouter();
  // `from`: 'signup' (just registered) or 'login' (login returned
  // not_verified — the server already re-sent a code in that case).
  const { email, from } = useLocalSearchParams<{ email: string; from?: 'signup' | 'login' }>();
  const { verifyEmail } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      await verifyEmail(email!, code);
      router.push({
        pathname: '/success',
        params:
          from === 'login'
            ? {
                title: 'Welcome back',
                subtitle: 'Your email is verified and you are logged in.',
                ctaLabel: 'Done',
                nextRoute: '/',
              }
            : {
                title: "You're all set!",
                subtitle: 'Your account is ready to go.',
                ctaLabel: 'Get started',
                nextRoute: '/get-started',
              },
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid or expired code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMessage('');
    try {
      const result = await authApi.resendOtp(email!, 'verification');
      setResendMessage(result.message);
    } catch (err) {
      setResendMessage(getApiErrorMessage(err, 'Failed to resend code. Try again.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Verify your email"
      subtitle={`Enter the 6-digit code we sent to ${email}`}
      progress={from === 'login' ? undefined : 5 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={loading ? 'Verifying...' : 'Continue'}
            disabled={code.length !== CODE_LENGTH || loading}
            onPress={handleVerify}
          />
        </>
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
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
    marginBottom: 8,
  },
});

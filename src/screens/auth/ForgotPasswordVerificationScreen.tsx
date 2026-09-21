import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { OtpInput } from '../../components/OtpInput';
import { Button } from '../../components/Button';
import { colors, spacing, typography } from '../../theme';

const CODE_LENGTH = 6;

export function ForgotPasswordVerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');

  return (
    <AuthScreenLayout
      title="Enter the code"
      subtitle={`We sent a 6-digit code to ${email}`}
      onBack={() => router.back()}
      footer={
        <Button
          label="Continue"
          disabled={code.length !== CODE_LENGTH}
          onPress={() => router.push({ pathname: '/reset-password', params: { email } })}
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

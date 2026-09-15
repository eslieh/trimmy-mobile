import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { OtpInput } from '../../components/OtpInput';
import { Button } from '../../components/Button';
import { RootStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPasswordVerification'>;

const CODE_LENGTH = 6;

export function ForgotPasswordVerificationScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [code, setCode] = useState('');

  return (
    <AuthScreenLayout
      title="Enter the code"
      subtitle={`We sent a 6-digit code to ${email}`}
      onBack={() => navigation.goBack()}
      footer={
        <Button
          label="Continue"
          disabled={code.length !== CODE_LENGTH}
          onPress={() => navigation.navigate('ResetPassword', { email })}
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

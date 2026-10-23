import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { PhoneInput } from '../../components/PhoneInput';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { countries } from '../../data/countries';
import { normalizePhoneNumber } from '../../utils/phone';
import { colors, spacing, typography } from '../../theme';
import { authApi, type RecoveryContact } from '../../api/auth';
import { getApiErrorMessage } from '../../api/client';

type Method = 'email' | 'phone';
const DEFAULT_COUNTRY = countries.find((c) => c.iso2 === 'KE') ?? countries[0];

// Account recovery: a code by email, or by SMS to a phone the account has
// verified (phone signups). The next screens carry whichever was used.
export function ForgotPasswordScreen() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>('email');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [rawPhone, setRawPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ready = method === 'email' ? Boolean(email.trim()) : rawPhone.length >= 6;

  const handleSendCode = async () => {
    const contact: RecoveryContact =
      method === 'email' ? { email: email.trim() } : { phone: normalizePhoneNumber(rawPhone, country) };
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(contact);
      router.push({ pathname: '/forgot-password-verification', params: contact });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Forgot password?"
      subtitle={
        method === 'email'
          ? "Enter the email linked to your account and we'll send you a code to reset your password."
          : "Enter the phone number you signed up with and we'll text you a code."
      }
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label={loading ? 'Sending...' : 'Send code'} disabled={!ready || loading} onPress={handleSendCode} />
        </>
      }
    >
      <View style={styles.tabs}>
        <SegmentedTabs<Method>
          options={[
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
          ]}
          value={method}
          onChange={(next) => {
            setMethod(next);
            setError('');
          }}
        />
      </View>
      {method === 'email' ? (
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : (
        <PhoneInput
          label="Phone number"
          country={country}
          onCountryChange={setCountry}
          value={rawPhone}
          onChangeText={setRawPhone}
        />
      )}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  tabs: {
    marginBottom: spacing.lg,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
    marginBottom: 8,
  },
});

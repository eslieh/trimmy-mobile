import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Divider } from '../../components/Divider';
import { GoogleIcon } from '../../components/icons/GoogleIcon';
import { AppleIcon } from '../../components/icons/AppleIcon';
import { PhoneIcon } from '../../components/icons/PhoneIcon';
import { authApi } from '../../api/auth';
import { getApiErrorMessage } from '../../api/client';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { seedOwnedBusinessForTesting } from '../../utils/devSeed';
import { colors, spacing, typography } from '../../theme';

export function WelcomeScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const google = useGoogleSignIn();
  const setOwnedBusiness = useOwnedBusinessStore((s) => s.setOwnedBusiness);
  const setActiveMode = useOwnedBusinessStore((s) => s.setActiveMode);

  // One email field for both paths: existing accounts go to Login (email
  // prefilled), new ones start sign-up.
  const handleContinue = async () => {
    const trimmed = email.trim();
    setChecking(true);
    setError('');
    try {
      const { exists } = await authApi.checkEmail(trimmed);
      router.push(
        exists
          ? { pathname: '/login', params: { email: trimmed } }
          : { pathname: '/onboarding-password', params: { email: trimmed } },
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setChecking(false);
    }
  };

  // Google is real sign-in (useGoogleSignIn). Apple/phone OAuth don't exist
  // yet, so those two stay role-testing shortcuts per explicit request:
  // Apple → business (solo), phone → business (team). Neither reflects real
  // auth; they only let the business app be reached without repeating the
  // full wizard each time.
  const enterAsBusiness = (teamMode: 'solo' | 'team') => {
    setOwnedBusiness(seedOwnedBusinessForTesting(teamMode === 'solo' ? 0 : 1, teamMode));
    setActiveMode('business');
    router.dismissAll();
    router.replace('/today');
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Image source={require('../../../assets/icon.png')} style={styles.logo} resizeMode="contain" />

      <Text style={styles.heading}>Welcome to Trimmy</Text>
      <Text style={styles.body}>
        Create an account or log in to book and manage your appointments
      </Text>

      <Input
        label="Email"
        helperText="We'll send you a verification code"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        label={checking ? 'Checking...' : 'Continue'}
        onPress={handleContinue}
        variant="primary"
        disabled={!email.trim() || checking}
        style={styles.continueButton}
      />

      <Divider label="OR" />

      <View style={styles.buttonGroup}>
        <Button
          label="Continue with mobile"
          onPress={() => enterAsBusiness('team')}
          variant="secondary"
          icon={<PhoneIcon size={20} />}
        />
        <Button
          label={google.loading ? 'Connecting to Google...' : 'Continue with Google'}
          onPress={google.start}
          disabled={google.loading}
          variant="secondary"
          icon={<GoogleIcon size={20} />}
        />
        <Button
          label="Continue with Apple"
          onPress={() => enterAsBusiness('solo')}
          variant="secondary"
          icon={<AppleIcon size={20} />}
        />
      </View>

      {google.error ? <Text style={styles.googleError}>{google.error}</Text> : null}

      <Pressable style={styles.loginLink} onPress={() => router.push('/login')} hitSlop={8}>
        <Text style={styles.loginLinkText}>
          Already have an account? <Text style={styles.loginLinkTextStrong}>Log in</Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.huge,
  },
  logo: {
    width: 160,
    height: 46,
    alignSelf: 'center',
    marginBottom: spacing.xxxl,
  },
  heading: {
    ...typography.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  input: {
    marginBottom: spacing.xl,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
    marginTop: -spacing.md,
    marginBottom: spacing.md,
  },
  googleError: {
    ...typography.caption,
    color: colors.feedback.danger,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  continueButton: {
    marginBottom: spacing.xl,
  },
  buttonGroup: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  loginLink: {
    marginTop: spacing.xxxl,
    alignItems: 'center',
  },
  loginLinkText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  loginLinkTextStrong: {
    ...typography.bodyMedium,
    color: colors.brand.purple,
  },
});

import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Divider } from '../../components/Divider';
import { GoogleIcon } from '../../components/icons/GoogleIcon';
import { AppleIcon } from '../../components/icons/AppleIcon';
import { PhoneIcon } from '../../components/icons/PhoneIcon';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { seedOwnedBusinessForTesting } from '../../utils/devSeed';
import { colors, spacing, typography } from '../../theme';

export function WelcomeScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const setOwnedBusiness = useOwnedBusinessStore((s) => s.setOwnedBusiness);
  const setActiveMode = useOwnedBusinessStore((s) => s.setActiveMode);

  // No real Google/Apple/phone OAuth yet (see the note below the Divider) —
  // repurposed as a role-testing shortcut per explicit request: Google →
  // customer, Apple → business (solo), phone → business (team). None of
  // this reflects real auth; it only exists so the three app experiences
  // can be reached quickly without repeating the full wizard each time.
  const enterAsCustomer = () => {
    router.dismissAll();
    router.replace('/explore');
  };

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

      <Button
        label="Continue"
        onPress={() => router.push({ pathname: '/onboarding-password', params: { email: email.trim() } })}
        variant="primary"
        disabled={!email.trim()}
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
          label="Continue with Google"
          onPress={enterAsCustomer}
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

import { useEffect, useRef, useState } from 'react';
import { Image, ImageBackground, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
import { useAuth } from '../../contexts/AuthContext';
import { resumeSession, routeAfterLogin } from '../../utils/routeAfterLogin';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { seedOwnedBusinessForTesting } from '../../utils/devSeed';
import { colors, spacing, typography } from '../../theme';
import { switchMode } from '../../utils/switchMode';

export function WelcomeScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const google = useGoogleSignIn();
  const setOwnedBusiness = useOwnedBusinessStore((s) => s.setOwnedBusiness);

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
    switchMode(router, 'business');
  };

  // This is the app's entry route ('/'). Someone already signed in (a saved
  // session on launch) goes straight into their app instead of seeing the
  // sign-in form; blank while the saved session is still being checked.
  const { user, loading: authLoading, resumed } = useAuth();
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (authLoading || !user || redirectedRef.current) return;
    redirectedRef.current = true;
    // Reopened from the device: straight back into the mode they left, no
    // network wait (SessionGuard corrects it if the server disagrees).
    // Otherwise work out where they belong from the server.
    if (resumed) resumeSession(router);
    else routeAfterLogin(router);
  }, [authLoading, user, resumed, router]);

  if (authLoading || user) {
    // The logo while the saved session is checked: never a flash of the sign-in form.
    return (
      <View style={styles.launch}>
        <Image source={require('../../../assets/splash-icon.png')} style={styles.launchLogo} resizeMode="contain" />
      </View>
    );
  }

  // The landing's look: the sky photo behind the mark and a white headline,
  // the form on a white card. A plain JPEG (AVIF isn't decoded on older
  // Android) cropped to portrait so low-end phones decode a small bitmap.
  return (
    <ImageBackground source={require('../../../assets/sky.jpg')} style={styles.flex} resizeMode="cover">
      <StatusBar style="light" />
      {/* The email field and Continue rise above the keyboard on both platforms. */}
      <KeyboardAvoidingView behavior="padding" style={styles.scroll}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.mark}>
            <View style={styles.markTile}>
              <Text style={styles.markT}>T</Text>
            </View>
            <Text style={styles.markRest}>rimmy</Text>
          </View>

          <Text style={styles.heading}>
            Welcome to{'\n'}
            <Text style={styles.headingAccent}>Trimmy</Text>
          </Text>
          <Text style={styles.body}>
            Create an account or log in to book and manage your appointments
          </Text>

          <View style={styles.card}>
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
              variant="accent"
              disabled={!email.trim() || checking}
              style={styles.continueButton}
            />

            <Divider label="OR" />

            <View style={styles.buttonGroup}>
              {/* Phone sign-in doesn't exist yet — development-only shortcut. */}
              {__DEV__ ? (
                <Button
                  label="Continue with mobile"
                  onPress={() => enterAsBusiness('team')}
                  variant="secondary"
                  icon={<PhoneIcon size={20} />}
                />
              ) : null}
              <Button
                label={google.loading ? 'Connecting to Google...' : 'Continue with Google'}
                onPress={google.start}
                disabled={google.loading}
                variant="secondary"
                icon={<GoogleIcon size={20} />}
              />
              {/* Apple sign-in doesn't exist yet — development-only shortcut. */}
              {__DEV__ ? (
                <Button
                  label="Continue with Apple"
                  onPress={() => enterAsBusiness('solo')}
                  variant="secondary"
                  icon={<AppleIcon size={20} />}
                />
              ) : null}
            </View>

            {google.error ? <Text style={styles.googleError}>{google.error}</Text> : null}

            <Pressable style={styles.loginLink} onPress={() => router.push('/login')} hitSlop={8}>
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkTextStrong}>Log in</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  launch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  launchLogo: {
    width: 240,
    height: 240,
  },
  flex: {
    flex: 1,
    backgroundColor: '#1D6FE0', // the sky's blue, behind the photo while it decodes
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.huge,
  },
  mark: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginBottom: spacing.xxxl,
  },
  markTile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markT: {
    ...typography.h3,
    color: colors.brand.accent,
  },
  markRest: {
    ...typography.h2,
    color: colors.white,
  },
  heading: {
    ...typography.display,
    fontSize: 38,
    lineHeight: 42,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  headingAccent: {
    color: colors.brand.accent,
  },
  body: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: spacing.xxl,
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
    marginTop: spacing.xxl,
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

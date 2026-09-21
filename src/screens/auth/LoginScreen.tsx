import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { colors, typography } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';

export function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await login({ email: email.trim(), password });
      router.push({
        pathname: '/success',
        params: {
          title: 'Welcome back',
          subtitle: 'You have successfully logged in.',
          ctaLabel: 'Done',
          nextRoute: '/',
        },
      });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail?.error === 'not_verified') {
        router.push({ pathname: '/onboarding-verification', params: { email: email.trim(), password } });
      } else {
        setError(detail?.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Log in"
      subtitle="Welcome back! Enter your details to continue."
      onBack={() => router.back()}
      footer={
        <>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <Button
            label={loading ? 'Logging in...' : 'Log in'}
            disabled={!email.trim() || !password || loading}
            onPress={handleLogin}
          />
        </>
      }
    >
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        secureTextEntry
      />
      <Pressable onPress={() => router.push('/forgot-password')} hitSlop={8} style={styles.forgotLink}>
        <Text style={styles.forgotLinkText}>Forgot password?</Text>
      </Pressable>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  forgotLink: {
    alignSelf: 'flex-end',
  },
  forgotLinkText: {
    ...typography.bodyMedium,
    color: colors.brand.purple,
  },
  errorContainer: {
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  errorText: {
    ...typography.caption,
    color: colors.feedback.danger,
  },
});

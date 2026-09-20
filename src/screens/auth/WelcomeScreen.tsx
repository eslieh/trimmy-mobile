import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Divider } from '../../components/Divider';
import { GoogleIcon } from '../../components/icons/GoogleIcon';
import { AppleIcon } from '../../components/icons/AppleIcon';
import { PhoneIcon } from '../../components/icons/PhoneIcon';
import { RootStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Image source={require('../../../assets/icon.png')} style={styles.logo} resizeMode="contain" />

      <Text style={styles.heading}>Welcome to Trimlyy</Text>
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

      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        secureTextEntry
        style={styles.input}
      />

      <Button
        label="Continue"
        onPress={() => navigation.navigate('OnboardingVerification', { email: email.trim(), password })}
        variant="primary"
        disabled={!email.trim() || password.length < 8}
        style={styles.continueButton}
      />

      <Divider label="OR" />

      <View style={styles.buttonGroup}>
        <Button label="Continue with mobile" onPress={() => {}} variant="secondary" icon={<PhoneIcon size={20} />} />
        <Button
          label="Continue with Google"
          onPress={() => {}}
          variant="secondary"
          icon={<GoogleIcon size={20} />}
        />
        <Button
          label="Continue with Apple"
          onPress={() => {}}
          variant="secondary"
          icon={<AppleIcon size={20} />}
        />
      </View>

      <Pressable style={styles.loginLink} onPress={() => navigation.navigate('Login')} hitSlop={8}>
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

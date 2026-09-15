import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <AuthScreenLayout
      title="Log in"
      subtitle="Welcome back! Enter your details to continue."
      onBack={() => navigation.goBack()}
      footer={
        <Button
          label="Log in"
          disabled={!email.trim() || !password}
          onPress={() =>
            navigation.navigate('Success', {
              title: 'Welcome back',
              subtitle: 'You have successfully logged in.',
              ctaLabel: 'Done',
              nextRoute: 'Welcome',
            })
          }
        />
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
      <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8} style={styles.forgotLink}>
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
});

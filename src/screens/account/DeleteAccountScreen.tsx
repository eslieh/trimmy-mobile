import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../api/client';
import { colors, typography } from '../../theme';

// In-app account deletion — required by App Store / Play Store review for
// any app that lets users sign up.
export function DeleteAccountScreen() {
  const router = useRouter();
  const { deleteAccount } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await deleteAccount(password);
      router.dismissAll();
      router.replace('/');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete account?', 'This permanently deletes your account and can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <AuthScreenLayout
      title="Delete account"
      subtitle="Your profile, bookings history and favorites will be permanently removed. Enter your password to confirm."
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={loading ? 'Deleting...' : 'Delete my account'}
            disabled={!password || loading}
            onPress={confirmDelete}
          />
        </>
      }
    >
      <Input label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
    marginBottom: 8,
  },
});

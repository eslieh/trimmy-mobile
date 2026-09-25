import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../api/client';
import { colors, typography } from '../../theme';

export function ChangePasswordScreen() {
  const router = useRouter();
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await changePassword(currentPassword, newPassword);
      router.replace({
        pathname: '/success',
        params: {
          title: 'Password updated',
          subtitle: "You've been signed out on your other devices.",
          ctaLabel: 'Done',
          nextRoute: '/profile',
        },
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Change password"
      subtitle="Use at least 8 characters."
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={loading ? 'Updating...' : 'Update password'}
            disabled={!currentPassword || !newPassword || !confirmPassword || loading}
            onPress={handleSubmit}
          />
        </>
      }
    >
      <Input
        label="Current password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholder="Enter current password"
        secureTextEntry
      />
      <Input label="New password" value={newPassword} onChangeText={setNewPassword} placeholder="Enter new password" secureTextEntry />
      <Input
        label="Confirm new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Re-enter new password"
        secureTextEntry
      />
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

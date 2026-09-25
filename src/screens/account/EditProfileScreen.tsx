import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { PhoneInput } from '../../components/PhoneInput';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../api/client';
import { countries } from '../../data/countries';
import { normalizePhoneNumber } from '../../utils/phone';
import { colors, typography } from '../../theme';

const DEFAULT_COUNTRY = countries.find((c) => c.iso2 === 'US') ?? countries[0];

// Split the stored E.164 number back into PhoneInput's country + national digits.
function parseStoredPhone(phone: string | null) {
  const parsed = phone ? parsePhoneNumberFromString(phone) : undefined;
  const country = countries.find((c) => c.iso2 === parsed?.country) ?? DEFAULT_COUNTRY;
  return { country, rawNumber: parsed?.nationalNumber ?? '' };
}

export function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const initialPhone = parseStoredPhone(user?.phone ?? null);
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [country, setCountry] = useState(initialPhone.country);
  const [rawNumber, setRawNumber] = useState(initialPhone.rawNumber);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: rawNumber ? normalizePhoneNumber(rawNumber, country) : null,
      });
      router.back();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Profile"
      subtitle={user?.email ?? undefined}
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={loading ? 'Saving...' : 'Save'}
            disabled={!firstName.trim() || !lastName.trim() || loading}
            onPress={handleSave}
          />
        </>
      }
    >
      <Input label="First name" value={firstName} onChangeText={setFirstName} placeholder="Jane" autoCapitalize="words" />
      <Input label="Last name" value={lastName} onChangeText={setLastName} placeholder="Doe" autoCapitalize="words" />
      <PhoneInput
        label="Mobile number"
        country={country}
        onCountryChange={setCountry}
        value={rawNumber}
        onChangeText={setRawNumber}
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

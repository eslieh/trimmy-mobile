import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from '../../components/Avatar';
import { authApi } from '../../api/auth';
import { showApiError } from '../../utils/showApiError';
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
  const { user, updateProfile, replaceUser } = useAuth();
  const [photoBusy, setPhotoBusy] = useState(false);
  const initialPhone = parseStoredPhone(user?.phone ?? null);
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [country, setCountry] = useState(initialPhone.country);
  const [rawNumber, setRawNumber] = useState(initialPhone.rawNumber);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Profile picture: saved straight away (not with Save), like the app's other photo pickers.
  const changePhoto = async (action: () => Promise<typeof user>) => {
    setPhotoBusy(true);
    try {
      const updated = await action();
      if (updated) replaceUser(updated);
    } catch (err) {
      showApiError("Couldn't update your photo", err);
    } finally {
      setPhotoBusy(false);
    }
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      // Cropped square and re-encoded small before it leaves the phone; the server shrinks it again.
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    await changePhoto(() => authApi.uploadAvatar(result.assets[0].uri));
  };

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
      <View style={styles.photo}>
        <Pressable onPress={pickPhoto} disabled={photoBusy} accessibilityLabel="Change profile picture">
          <Avatar name={[firstName, lastName].filter(Boolean).join(' ') || user?.email || '?'} uri={user?.avatar_url} size={96} />
          {photoBusy ? (
            <View style={styles.photoBusy}>
              <ActivityIndicator color={colors.white} />
            </View>
          ) : null}
        </Pressable>
        <View style={styles.photoActions}>
          <Pressable onPress={pickPhoto} disabled={photoBusy} hitSlop={8}>
            <Text style={styles.photoAction}>{user?.avatar_url ? 'Change photo' : 'Choose photo'}</Text>
          </Pressable>
          {user?.has_google_picture ? (
            <Pressable onPress={() => changePhoto(() => authApi.useGoogleAvatar())} disabled={photoBusy} hitSlop={8}>
              <Text style={styles.photoAction}>Use Google photo</Text>
            </Pressable>
          ) : null}
          {user?.avatar_url ? (
            <Pressable onPress={() => changePhoto(() => authApi.removeAvatar())} disabled={photoBusy} hitSlop={8}>
              <Text style={[styles.photoAction, styles.photoRemove]}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

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
  photo: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  photoBusy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 48,
    backgroundColor: 'rgba(20,18,26,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  photoAction: {
    ...typography.label,
    color: colors.brand.purple,
  },
  photoRemove: {
    color: colors.feedback.danger,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
    marginBottom: 8,
  },
});

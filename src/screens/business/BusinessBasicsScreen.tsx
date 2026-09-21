import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { PhoneInput } from '../../components/PhoneInput';
import { LocationPicker } from '../../components/LocationPicker';
import { Button } from '../../components/Button';
import { RootStackParamList } from '../../navigation/types';
import { countries } from '../../data/countries';
import { normalizePhoneNumber } from '../../utils/phone';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { colors, radii, spacing, typography } from '../../theme';
import type { BusinessCategory, BusinessLocation } from '../../types/business';

type Props = NativeStackScreenProps<RootStackParamList, 'BusinessBasics'>;

const DEFAULT_COUNTRY = countries.find((c) => c.iso2 === 'KE') ?? countries[0];

const CATEGORIES: { value: BusinessCategory; label: string }[] = [
  { value: 'hair_salon', label: 'Hair Salon' },
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'nail_salon', label: 'Nail Salon' },
  { value: 'spa', label: 'Spa' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'other', label: 'Other' },
];

export function BusinessBasicsScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [rawPhone, setRawPhone] = useState('');
  const [location, setLocation] = useState<BusinessLocation | null>(null);

  const submitBusinessBasics = useBusinessOnboardingStore((s) => s.submitBusinessBasics);
  const isSubmitting = useBusinessOnboardingStore((s) => s.isSubmitting);
  const error = useBusinessOnboardingStore((s) => s.error);

  const toggleCategory = (value: BusinessCategory) => {
    setCategories((current) =>
      current.includes(value) ? current.filter((c) => c !== value) : [...current, value],
    );
  };

  const canContinue = name.trim().length > 0 && categories.length > 0 && rawPhone.length >= 4 && location !== null;

  const handleContinue = async () => {
    if (categories.length === 0 || !location) return;

    await submitBusinessBasics({
      name: name.trim(),
      categories,
      phone: normalizePhoneNumber(rawPhone, country),
      location,
    });

    navigation.navigate('Success', {
      title: 'Business created!',
      subtitle: "We'll notify you as soon as the rest of setup (hours, services, payments) is ready.",
      ctaLabel: 'Done for now',
      nextRoute: 'GetStarted',
    });
  };

  return (
    <AuthScreenLayout
      title="Tell us about your business"
      subtitle="This is what customers will see first."
      onBack={() => navigation.goBack()}
      footer={
        <Button
          label={isSubmitting ? 'Creating…' : 'Continue'}
          disabled={!canContinue || isSubmitting}
          onPress={handleContinue}
        />
      }
    >
      <Input label="Business name" value={name} onChangeText={setName} placeholder="Glow Beauty Lounge" />

      <View>
        <Text style={styles.label}>Categories</Text>
        <Text style={styles.sublabel}>Select all that apply.</Text>
        <View style={styles.pillRow}>
          {CATEGORIES.map((option) => {
            const selected = categories.includes(option.value);
            return (
              <Pressable
                key={option.value}
                onPress={() => toggleCategory(option.value)}
                style={[styles.pill, selected && styles.pillSelected]}
              >
                <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <PhoneInput
        label="Business phone"
        country={country}
        onCountryChange={setCountry}
        value={rawPhone}
        onChangeText={setRawPhone}
      />

      <LocationPicker label="Business location" value={location} onChange={setLocation} />

      <View style={styles.addressDetailsRow}>
        <Input
          label="Building / mall"
          value={location?.building ?? ''}
          onChangeText={(text) => setLocation((current) => (current ? { ...current, building: text } : current))}
          placeholder="e.g. Yaya Centre"
          style={styles.addressDetailsField}
        />
        <Input
          label="Floor"
          value={location?.floor ?? ''}
          onChangeText={(text) => setLocation((current) => (current ? { ...current, floor: text } : current))}
          placeholder="e.g. 2nd Floor"
          style={styles.addressDetailsField}
        />
      </View>
      <Input
        label="Shop / office number"
        value={location?.unit ?? ''}
        onChangeText={(text) => setLocation((current) => (current ? { ...current, unit: text } : current))}
        placeholder="e.g. Shop 14"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sublabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  addressDetailsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  addressDetailsField: {
    flex: 1,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.pill.unselectedBg,
  },
  pillSelected: {
    backgroundColor: colors.pill.selectedBg,
  },
  pillText: {
    ...typography.bodyMedium,
    color: colors.pill.unselectedText,
  },
  pillTextSelected: {
    color: colors.pill.selectedText,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
  },
});

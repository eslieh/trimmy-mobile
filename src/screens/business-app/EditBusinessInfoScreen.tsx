import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PhoneInput } from '../../components/PhoneInput';
import { LocationPicker } from '../../components/LocationPicker';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { BUSINESS_CATEGORIES } from '../../data/businessCategories';
import { countries } from '../../data/countries';
import { normalizePhoneNumber } from '../../utils/phone';
import { colors, radii, spacing, typography } from '../../theme';
import type { BusinessCategory, BusinessLocation } from '../../types/business';

const DEFAULT_COUNTRY = countries.find((c) => c.iso2 === 'KE') ?? countries[0];

// Combined edit screen for the 4 fields onboarding spreads across separate
// steps (name, categories, phone, location) — all of those read from the
// wizard's `draft`, which is empty post-publish, so this reads/writes
// `business` directly instead via updateBusinessInfo. See TASKS.md.
export function EditBusinessInfoScreen() {
  const router = useRouter();
  const business = useBusinessOnboardingStore((s) => s.business);
  const updateBusinessInfo = useBusinessOnboardingStore((s) => s.updateBusinessInfo);
  const isSubmitting = useBusinessOnboardingStore((s) => s.isSubmitting);
  const error = useBusinessOnboardingStore((s) => s.error);

  const parsedPhone = business ? parsePhoneNumberFromString(business.phone) : undefined;
  const initialCountry =
    (parsedPhone?.country && countries.find((c) => c.iso2 === parsedPhone.country)) || DEFAULT_COUNTRY;

  const [name, setName] = useState(business?.name ?? '');
  const [description, setDescription] = useState(business?.description ?? '');
  const [categories, setCategories] = useState<BusinessCategory[]>(business?.categories ?? []);
  const [country, setCountry] = useState(initialCountry);
  const [rawPhone, setRawPhone] = useState(parsedPhone?.nationalNumber?.toString() ?? '');
  const [location, setLocation] = useState<BusinessLocation | null>(business?.location ?? null);

  if (!business) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <BackButton onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const canSave =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    categories.length > 0 &&
    rawPhone.length >= 4 &&
    location !== null;

  const toggleCategory = (value: BusinessCategory) => {
    setCategories((current) =>
      current.includes(value) ? current.filter((c) => c !== value) : [...current, value],
    );
  };

  const handleSave = async () => {
    if (!canSave || !location) return;
    // The store keeps the error for the inline message — stay on this step.
    try {
      await updateBusinessInfo(business.businessId, {
        name: name.trim(),
        description: description.trim(),
        categories,
        phone: normalizePhoneNumber(rawPhone, country),
        location,
      });
    } catch {
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Business info</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Input label="Business name" value={name} onChangeText={setName} placeholder="Glow Beauty Lounge" />
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Tell customers what makes your business special…"
          multiline
          numberOfLines={4}
        />

        <View>
          <Text style={styles.fieldLabel}>Categories</Text>
          <View style={styles.pillRow}>
            {BUSINESS_CATEGORIES.map((option) => {
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
        <Button label={isSubmitting ? 'Saving…' : 'Save'} disabled={!canSave || isSubmitting} onPress={handleSave} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
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
  addressDetailsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  addressDetailsField: {
    flex: 1,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
  },
});

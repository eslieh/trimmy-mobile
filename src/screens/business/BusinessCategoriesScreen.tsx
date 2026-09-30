import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Button } from '../../components/Button';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { BUSINESS_CATEGORIES } from '../../data/businessCategories';
import { BUSINESS_AMENITIES } from '../../data/amenities';
import { colors, radii, spacing, typography } from '../../theme';
import type { BusinessCategory } from '../../types/business';

const TOTAL_STEPS = 11;

export function BusinessCategoriesScreen() {
  const router = useRouter();
  const draftCategories = useBusinessOnboardingStore((s) => s.draft.categories);
  const draftAmenities = useBusinessOnboardingStore((s) => s.draft.amenities);
  const updateDraft = useBusinessOnboardingStore((s) => s.updateDraft);
  const [categories, setCategories] = useState<BusinessCategory[]>(draftCategories);
  const [amenities, setAmenities] = useState<string[]>(draftAmenities);

  const toggleCategory = (value: BusinessCategory) => {
    setCategories((current) =>
      current.includes(value) ? current.filter((c) => c !== value) : [...current, value],
    );
  };

  const toggleAmenity = (value: string) => {
    setAmenities((current) =>
      current.includes(value) ? current.filter((a) => a !== value) : [...current, value],
    );
  };

  return (
    <AuthScreenLayout
      title="What do you offer?"
      subtitle="Select all that apply."
      progress={2 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <Button
          label="Continue"
          disabled={categories.length === 0}
          onPress={() => {
            updateDraft({ categories, amenities });
            router.push('/business-phone');
          }}
        />
      }
    >
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

      {/* Optional — shown on the customer Business Profile. */}
      <Text style={styles.sectionTitle}>Amenities</Text>
      <Text style={styles.sectionHint}>Optional. Let customers know what to expect.</Text>
      <View style={styles.pillRow}>
        {BUSINESS_AMENITIES.map((amenity) => {
          const selected = amenities.includes(amenity);
          return (
            <Pressable
              key={amenity}
              onPress={() => toggleAmenity(amenity)}
              style={[styles.pill, selected && styles.pillSelected]}
            >
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{amenity}</Text>
            </Pressable>
          );
        })}
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.xl,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.text.secondary,
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
});

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Button } from '../../components/Button';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { colors, radii, spacing, typography } from '../../theme';
import type { BusinessCategory } from '../../types/business';

const TOTAL_STEPS = 4;

const CATEGORIES: { value: BusinessCategory; label: string }[] = [
  { value: 'hair_salon', label: 'Hair Salon' },
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'nail_salon', label: 'Nail Salon' },
  { value: 'spa', label: 'Spa' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'other', label: 'Other' },
];

export function BusinessCategoriesScreen() {
  const router = useRouter();
  const draftCategories = useBusinessOnboardingStore((s) => s.draft.categories);
  const updateDraft = useBusinessOnboardingStore((s) => s.updateDraft);
  const [categories, setCategories] = useState<BusinessCategory[]>(draftCategories);

  const toggleCategory = (value: BusinessCategory) => {
    setCategories((current) =>
      current.includes(value) ? current.filter((c) => c !== value) : [...current, value],
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
            updateDraft({ categories });
            router.push('/business-phone');
          }}
        />
      }
    >
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
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
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

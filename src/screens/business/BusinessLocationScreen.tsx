import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { LocationPicker } from '../../components/LocationPicker';
import { Button } from '../../components/Button';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { colors, spacing, typography } from '../../theme';
import type { BusinessLocation } from '../../types/business';

const TOTAL_STEPS = 11;

export function BusinessLocationScreen() {
  const router = useRouter();
  const draftLocation = useBusinessOnboardingStore((s) => s.draft.location);
  const updateDraft = useBusinessOnboardingStore((s) => s.updateDraft);
  const submitBusinessBasics = useBusinessOnboardingStore((s) => s.submitBusinessBasics);
  const isSubmitting = useBusinessOnboardingStore((s) => s.isSubmitting);
  const error = useBusinessOnboardingStore((s) => s.error);

  const [location, setLocation] = useState<BusinessLocation | null>(draftLocation);

  const handleContinue = async () => {
    if (!location) return;
    updateDraft({ location });

    await submitBusinessBasics();

    router.push('/business-photos');
  };

  return (
    <AuthScreenLayout
      title="Where are you located?"
      subtitle="Customers will use this to find you."
      progress={4 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <Button
          label={isSubmitting ? 'Creating…' : 'Continue'}
          disabled={!location || isSubmitting}
          onPress={handleContinue}
        />
      }
    >
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

import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Button } from '../../components/Button';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { colors, radii, spacing, typography } from '../../theme';
import type { TeamMode } from '../../types/business';

const TOTAL_STEPS = 11;

const OPTIONS: { value: TeamMode; title: string; description: string }[] = [
  {
    value: 'solo',
    title: 'Just me',
    description: 'You handle bookings and services yourself. You get your own daily schedule view.',
  },
  {
    value: 'team',
    title: 'I have a team',
    description: "You'll invite a Front Desk user to manage the calendar, walk-ins, and checkout.",
  },
];

export function TeamModeScreen() {
  const router = useRouter();
  const draftTeamMode = useBusinessOnboardingStore((s) => s.business?.teamMode);
  const submitTeamMode = useBusinessOnboardingStore((s) => s.submitTeamMode);
  const isSubmitting = useBusinessOnboardingStore((s) => s.isSubmitting);
  const error = useBusinessOnboardingStore((s) => s.error);

  const [teamMode, setTeamMode] = useState<TeamMode | null>(draftTeamMode ?? null);

  const handleContinue = async () => {
    if (!teamMode) return;
    await submitTeamMode(teamMode);

    if (teamMode === 'team') {
      router.push('/business-team-invite');
      return;
    }

    router.push({
      pathname: '/success',
      params: {
        title: 'All set!',
        subtitle: "We'll notify you as soon as the rest of setup (review & publish) is ready.",
        ctaLabel: 'Done for now',
        nextRoute: '/get-started',
      },
    });
  };

  return (
    <AuthScreenLayout
      title="Are you working solo, or do you have a team?"
      subtitle="This decides which view you'll use to manage bookings day to day."
      progress={10 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={isSubmitting ? 'Saving…' : 'Continue'}
            disabled={!teamMode || isSubmitting}
            onPress={handleContinue}
          />
        </>
      }
    >
      {OPTIONS.map((option) => {
        const selected = teamMode === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => setTeamMode(option.value)}
            style={[styles.card, selected && styles.cardSelected]}
          >
            <Text style={styles.cardTitle}>{option.title}</Text>
            <Text style={styles.cardDescription}>{option.description}</Text>
          </Pressable>
        );
      })}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardSelected: {
    borderColor: colors.brand.purple,
    backgroundColor: colors.background.secondary,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  cardDescription: {
    ...typography.body,
    color: colors.text.secondary,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
  },
});

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PhoneInput } from '../../components/PhoneInput';
import { WorkingDaysPicker } from '../../components/WorkingDaysPicker';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { countries } from '../../data/countries';
import { normalizePhoneNumber } from '../../utils/phone';
import { TEAM_ROLE_LABEL } from '../../utils/team';
import { colors, radii, spacing, typography } from '../../theme';
import type { TeamRole } from '../../types/team';
import type { WeeklyHours } from '../../types/business';
import { showApiError } from '../../utils/showApiError';

const DEFAULT_COUNTRY = countries.find((c) => c.iso2 === 'KE') ?? countries[0];
const DEFAULT_COMMISSION_PERCENT = '40';

// Reached from the Team screen's "+". Post-publish equivalent of
// onboarding's Team invite step, but collects the fuller field set (name,
// commission split, working days) that step never asked for.
export function InviteTeamMemberScreen() {
  const router = useRouter();
  const ownedBusiness = useBusinessOnboardingStore((s) => s.business);
  const addTeamMemberNow = useBusinessOnboardingStore((s) => s.addTeamMemberNow);
  const isSubmitting = useBusinessOnboardingStore((s) => s.isSubmitting);

  const [name, setName] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [rawPhone, setRawPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('staff');
  const [commissionPercent, setCommissionPercent] = useState(DEFAULT_COMMISSION_PERCENT);
  const [workingDays, setWorkingDays] = useState<(keyof WeeklyHours)[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!ownedBusiness) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <BackButton onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const trimmedName = name.trim();
  const hasContact = rawPhone.length >= 4 || email.trim().length > 0;
  const commissionValue = parseInt(commissionPercent, 10);
  const canSubmit =
    trimmedName.length > 0 &&
    hasContact &&
    !Number.isNaN(commissionValue) &&
    commissionValue >= 0 &&
    commissionValue <= 100 &&
    !isSubmitting &&
    !isSaving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSaving(true);
    try {
      await addTeamMemberNow(ownedBusiness.businessId, {
        name: trimmedName,
        phone: rawPhone.length >= 4 ? normalizePhoneNumber(rawPhone, country) : undefined,
        email: email.trim() || undefined,
        role,
        commissionPercent: commissionValue,
        workingDays,
      });
      router.back();
    } catch (err) {
      showApiError("Couldn't send invite", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Invite team member</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Input label="Name" value={name} onChangeText={setName} placeholder="Jane Doe" />
        <PhoneInput
          label="Phone"
          country={country}
          onCountryChange={setCountry}
          value={rawPhone}
          onChangeText={setRawPhone}
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="jane@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.hint}>At least one of phone or email is required.</Text>

        <View>
          <Text style={styles.sectionLabel}>Role</Text>
          <View style={styles.roleRow}>
            {(['staff', 'front_desk'] as const).map((option) => {
              const selected = role === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.rolePill, selected && styles.rolePillSelected]}
                  onPress={() => setRole(option)}
                >
                  <Text style={[styles.rolePillText, selected && styles.rolePillTextSelected]}>
                    {TEAM_ROLE_LABEL[option]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Input
          label="Commission split (%)"
          value={commissionPercent}
          onChangeText={setCommissionPercent}
          placeholder="40"
          keyboardType="number-pad"
          helperText="Share of each completed service's price this member earns."
        />

        <WorkingDaysPicker label="Working days" value={workingDays} onChange={setWorkingDays} />
      </ScrollView>

      <View style={styles.footer}>
        <Button label={isSaving ? 'Sending…' : 'Send invite'} disabled={!canSubmit} onPress={handleSubmit} />
      </View>
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
  hint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: -spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rolePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.pill.unselectedBg,
  },
  rolePillSelected: {
    backgroundColor: colors.pill.selectedBg,
  },
  rolePillText: {
    ...typography.bodyMedium,
    color: colors.pill.unselectedText,
  },
  rolePillTextSelected: {
    color: colors.pill.selectedText,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
});

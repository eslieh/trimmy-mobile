import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { colors, radii, spacing, typography } from '../../theme';
import type { BusinessPolicies } from '../../types/business';

const TOTAL_STEPS = 11;

// Sensible default the owner can accept with one tap — no deposit, a day's
// notice for a free cancellation, and standard late/no-show fees.
const DEFAULT_POLICIES: BusinessPolicies = {
  deposit: {
    required: false,
    type: 'fixed',
    amount: { amount: 0, currency: 'KES' },
    appliesTo: 'all_services',
  },
  cancellation: {
    freeCancellationHours: 24,
    lateFeePercent: 50,
  },
  noShow: {
    feePercent: 100,
  },
};

export function PoliciesScreen() {
  const router = useRouter();
  const draftPolicies = useBusinessOnboardingStore((s) => s.business?.policies);
  const submitPolicies = useBusinessOnboardingStore((s) => s.submitPolicies);
  const isSubmitting = useBusinessOnboardingStore((s) => s.isSubmitting);
  const error = useBusinessOnboardingStore((s) => s.error);

  const [policies, setPolicies] = useState<BusinessPolicies>(draftPolicies ?? DEFAULT_POLICIES);
  const [depositAmountText, setDepositAmountText] = useState(String(policies.deposit.amount.amount || ''));
  const [freeCancellationHoursText, setFreeCancellationHoursText] = useState(
    String(policies.cancellation.freeCancellationHours),
  );
  const [lateFeePercentText, setLateFeePercentText] = useState(String(policies.cancellation.lateFeePercent));
  const [noShowFeePercentText, setNoShowFeePercentText] = useState(String(policies.noShow.feePercent));

  const toggleDepositRequired = () => {
    setPolicies((current) => ({
      ...current,
      deposit: { ...current.deposit, required: !current.deposit.required },
    }));
  };

  const setDepositType = (type: 'fixed' | 'percent') => {
    setPolicies((current) => ({ ...current, deposit: { ...current.deposit, type } }));
  };

  const handleContinue = async () => {
    const finalPolicies: BusinessPolicies = {
      ...policies,
      deposit: { ...policies.deposit, amount: { amount: Number(depositAmountText) || 0, currency: 'KES' } },
      cancellation: {
        freeCancellationHours: Number(freeCancellationHoursText) || 0,
        lateFeePercent: Number(lateFeePercentText) || 0,
      },
      noShow: { feePercent: Number(noShowFeePercentText) || 0 },
    };

    await submitPolicies(finalPolicies);

    router.push('/business-payment');
  };

  return (
    <AuthScreenLayout
      title="Deposit & cancellation policy"
      subtitle="We've pre-filled sensible defaults — customize if you'd like."
      progress={8 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label={isSubmitting ? 'Saving…' : 'Continue'} disabled={isSubmitting} onPress={handleContinue} />
        </>
      }
    >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Require a deposit</Text>
          <Pressable
            onPress={toggleDepositRequired}
            style={[styles.pill, policies.deposit.required ? styles.pillSelected : styles.pillUnselected]}
          >
            <Text
              style={[
                styles.pillText,
                policies.deposit.required ? styles.pillTextSelected : styles.pillTextUnselected,
              ]}
            >
              {policies.deposit.required ? 'Required' : 'Not required'}
            </Text>
          </Pressable>
        </View>

        {policies.deposit.required ? (
          <>
            <View style={styles.pillRow}>
              <Pressable
                onPress={() => setDepositType('fixed')}
                style={[styles.pill, policies.deposit.type === 'fixed' ? styles.pillSelected : styles.pillUnselected]}
              >
                <Text
                  style={[
                    styles.pillText,
                    policies.deposit.type === 'fixed' ? styles.pillTextSelected : styles.pillTextUnselected,
                  ]}
                >
                  Fixed amount
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setDepositType('percent')}
                style={[
                  styles.pill,
                  policies.deposit.type === 'percent' ? styles.pillSelected : styles.pillUnselected,
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    policies.deposit.type === 'percent' ? styles.pillTextSelected : styles.pillTextUnselected,
                  ]}
                >
                  % of service price
                </Text>
              </Pressable>
            </View>
            <Input
              label={policies.deposit.type === 'fixed' ? 'Deposit amount (KSh)' : 'Deposit (%)'}
              value={depositAmountText}
              onChangeText={setDepositAmountText}
              placeholder={policies.deposit.type === 'fixed' ? '500' : '20'}
              keyboardType="number-pad"
            />
          </>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cancellation</Text>
        <Input
          label="Free cancellation up to (hours before)"
          value={freeCancellationHoursText}
          onChangeText={setFreeCancellationHoursText}
          placeholder="24"
          keyboardType="number-pad"
        />
        <Input
          label="Late cancellation fee (%)"
          value={lateFeePercentText}
          onChangeText={setLateFeePercentText}
          placeholder="50"
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>No-show</Text>
        <Input
          label="No-show fee (%)"
          value={noShowFeePercentText}
          onChangeText={setNoShowFeePercentText}
          placeholder="100"
          keyboardType="number-pad"
        />
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  pillSelected: {
    backgroundColor: colors.pill.selectedBg,
  },
  pillUnselected: {
    backgroundColor: colors.pill.unselectedBg,
  },
  pillText: {
    ...typography.caption,
  },
  pillTextSelected: {
    color: colors.pill.selectedText,
  },
  pillTextUnselected: {
    color: colors.pill.unselectedText,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
  },
});

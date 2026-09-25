import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
    amount: null,
    percent: null,
    appliesTo: 'all_services',
    serviceIds: [],
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
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';
  const draftPolicies = useBusinessOnboardingStore((s) => s.business?.policies);
  const submitPolicies = useBusinessOnboardingStore((s) => s.submitPolicies);
  const isSubmitting = useBusinessOnboardingStore((s) => s.isSubmitting);
  const error = useBusinessOnboardingStore((s) => s.error);
  const services = useBusinessOnboardingStore((s) => s.services);

  const [policies, setPolicies] = useState<BusinessPolicies>(draftPolicies ?? DEFAULT_POLICIES);
  // One text field for either kind of deposit — KSh for fixed, % for percent.
  const [depositValueText, setDepositValueText] = useState(
    String((policies.deposit.type === 'percent' ? policies.deposit.percent : policies.deposit.amount?.amount) || ''),
  );
  const [validationError, setValidationError] = useState('');
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

  const setAppliesTo = (appliesTo: 'all_services' | 'selected_services') => {
    setPolicies((current) => ({ ...current, deposit: { ...current.deposit, appliesTo } }));
  };

  const toggleDepositService = (serviceId: string) => {
    setPolicies((current) => {
      const ids = current.deposit.serviceIds;
      return {
        ...current,
        deposit: {
          ...current.deposit,
          serviceIds: ids.includes(serviceId) ? ids.filter((id) => id !== serviceId) : [...ids, serviceId],
        },
      };
    });
  };

  const buildDeposit = (): BusinessPolicies['deposit'] | string => {
    const { deposit } = policies;
    if (!deposit.required) {
      return { required: false, type: 'fixed', amount: null, percent: null, appliesTo: 'all_services', serviceIds: [] };
    }
    const value = Number(depositValueText);
    if (deposit.type === 'percent' && !(value >= 1 && value <= 100)) return 'Deposit percentage must be between 1 and 100.';
    if (deposit.type === 'fixed' && !(value > 0)) return 'Enter a deposit amount.';
    if (deposit.appliesTo === 'selected_services' && deposit.serviceIds.length === 0) {
      return 'Choose at least one service that takes a deposit.';
    }
    return {
      ...deposit,
      amount: deposit.type === 'fixed' ? { amount: value, currency: 'KES' } : null,
      percent: deposit.type === 'percent' ? value : null,
      serviceIds: deposit.appliesTo === 'selected_services' ? deposit.serviceIds : [],
    };
  };

  const handleContinue = async () => {
    const deposit = buildDeposit();
    if (typeof deposit === 'string') {
      setValidationError(deposit);
      return;
    }
    setValidationError('');

    const finalPolicies: BusinessPolicies = {
      ...policies,
      deposit,
      cancellation: {
        freeCancellationHours: Number(freeCancellationHoursText) || 0,
        lateFeePercent: Number(lateFeePercentText) || 0,
      },
      noShow: { feePercent: Number(noShowFeePercentText) || 0 },
    };

    // The store keeps the error for the inline message — stay on this step.
    try {
      await submitPolicies(finalPolicies);
    } catch {
      return;
    }

    if (isEditMode) {
      router.back();
    } else {
      router.push('/business-payment');
    }
  };

  return (
    <AuthScreenLayout
      title="Deposit & cancellation policy"
      subtitle="We've pre-filled sensible defaults — customize if you'd like."
      progress={isEditMode ? undefined : 8 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <>
          {validationError || error ? <Text style={styles.error}>{validationError || error}</Text> : null}
          <Button
            label={isSubmitting ? 'Saving…' : isEditMode ? 'Save' : 'Continue'}
            disabled={isSubmitting}
            onPress={handleContinue}
          />
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
              value={depositValueText}
              onChangeText={setDepositValueText}
              placeholder={policies.deposit.type === 'fixed' ? '500' : '20'}
              keyboardType="number-pad"
            />

            <Text style={styles.fieldLabel}>Applies to</Text>
            <View style={styles.pillRow}>
              {(
                [
                  { value: 'all_services', label: 'All services' },
                  { value: 'selected_services', label: 'Selected services' },
                ] as const
              ).map((option) => {
                const selected = policies.deposit.appliesTo === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setAppliesTo(option.value)}
                    style={[styles.pill, selected ? styles.pillSelected : styles.pillUnselected]}
                  >
                    <Text style={[styles.pillText, selected ? styles.pillTextSelected : styles.pillTextUnselected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {policies.deposit.appliesTo === 'selected_services' ? (
              <View style={styles.wrapRow}>
                {services.map((service) => {
                  const selected = policies.deposit.serviceIds.includes(service.serviceId);
                  return (
                    <Pressable
                      key={service.serviceId}
                      onPress={() => toggleDepositService(service.serviceId)}
                      style={[styles.pill, selected ? styles.pillSelected : styles.pillUnselected]}
                    >
                      <Text style={[styles.pillText, selected ? styles.pillTextSelected : styles.pillTextUnselected]}>
                        {service.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
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
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.text.primary,
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

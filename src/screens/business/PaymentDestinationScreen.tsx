import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { CheckmarkIcon } from '../../components/icons/CheckmarkIcon';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { getPaymentDestinationOptions } from '../../api/businessSetup';
import { getApiErrorMessage } from '../../api/client';
import { colors, radii, spacing, typography } from '../../theme';
import type {
  BankOption,
  PaymentDestination,
  PaymentDestinationOptions,
  PaymentFieldOption,
} from '../../types/business';

const TOTAL_STEPS = 11;

type DestinationType = PaymentDestination['type'];
type FieldName = PaymentFieldOption['name'];
type FieldValues = Partial<Record<FieldName, string>>;

// The methods, their fields, validation patterns and the bank list all come
// from GET /payment-destinations/options, so the form always matches what
// the server will accept. The server re-checks the same patterns.
export function PaymentDestinationScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';
  const existing = useBusinessOnboardingStore((s) => s.business?.paymentDestination);
  const submitPaymentDestination = useBusinessOnboardingStore((s) => s.submitPaymentDestination);
  const isSubmitting = useBusinessOnboardingStore((s) => s.isSubmitting);
  const error = useBusinessOnboardingStore((s) => s.error);

  const [options, setOptions] = useState<PaymentDestinationOptions | null>(null);
  const [loadError, setLoadError] = useState('');
  const [type, setType] = useState<DestinationType>(existing?.type ?? 'mpesa_till');
  const [values, setValues] = useState<FieldValues>({
    tillNumber: existing?.tillNumber ?? '',
    paybillNumber: existing?.paybillNumber ?? '',
    paybillAccountNumber: existing?.paybillAccountNumber ?? '',
    bankName: existing?.bankName ?? '',
    bankShortcode: existing?.bankShortcode ?? '',
    bankAccountNumber: existing?.bankAccountNumber ?? '',
  });
  const [bankPickerVisible, setBankPickerVisible] = useState(false);

  const loadOptions = () => {
    setLoadError('');
    getPaymentDestinationOptions()
      .then(setOptions)
      .catch((err) => setLoadError(getApiErrorMessage(err, "Couldn't load payment methods.")));
  };

  useEffect(loadOptions, []);

  const typeOption = options?.types.find((t) => t.type === type);
  const fields = typeOption?.fields ?? [];

  // The server strips spaces before checking, so do the same here.
  const valueOf = (name: FieldName) => (values[name] ?? '').replace(/\s+/g, '');
  const isFieldValid = (field: PaymentFieldOption) => new RegExp(field.pattern).test(field.name === 'bankName' ? (values.bankName ?? '').trim() : valueOf(field.name));
  const canContinue = fields.length > 0 && fields.every(isFieldValid);

  const setValue = (name: FieldName, value: string) => setValues((current) => ({ ...current, [name]: value }));

  const handleSelectBank = (bank: BankOption) => {
    setValues((current) => ({ ...current, bankName: bank.name, bankShortcode: bank.shortcode }));
    setBankPickerVisible(false);
  };

  const handleContinue = async () => {
    if (!canContinue) return;

    // Only the chosen method's fields — the server clears the others.
    const input: Parameters<typeof submitPaymentDestination>[0] = { type };
    for (const field of fields) {
      input[field.name] = field.name === 'bankName' ? (values.bankName ?? '').trim() : valueOf(field.name);
    }

    // The store keeps the error for the inline message — stay on this step.
    try {
      await submitPaymentDestination(input);
    } catch {
      return;
    }

    if (isEditMode) {
      router.back();
    } else {
      router.push('/business-team-mode');
    }
  };

  return (
    <AuthScreenLayout
      title="How will you get paid?"
      subtitle="Choose where customer payments should land."
      progress={isEditMode ? undefined : 9 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={isSubmitting ? 'Saving…' : isEditMode ? 'Save' : 'Continue'}
            disabled={!canContinue || isSubmitting}
            onPress={handleContinue}
          />
        </>
      }
    >
      {!options ? (
        loadError ? (
          <View style={styles.loadState}>
            <Text style={styles.error}>{loadError}</Text>
            <Button label="Try again" variant="secondary" onPress={loadOptions} />
          </View>
        ) : (
          <ActivityIndicator style={styles.loadState} color={colors.brand.purple} />
        )
      ) : (
        <>
          <View style={styles.pillRow}>
            {options.types.map((option) => {
              const selected = type === option.type;
              return (
                <Pressable
                  key={option.type}
                  onPress={() => setType(option.type)}
                  style={[styles.pill, selected && styles.pillSelected]}
                >
                  <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {typeOption ? <Text style={styles.typeDescription}>{typeOption.description}</Text> : null}

          {fields.map((field) =>
            field.keyboard === 'picker' ? (
              <View key={field.name}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Pressable style={styles.bankSelector} onPress={() => setBankPickerVisible(true)}>
                  <Text style={values.bankName ? styles.bankSelectorText : styles.bankSelectorPlaceholder}>
                    {values.bankName || 'Select your bank'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View key={field.name}>
                <Input
                  label={field.label}
                  value={values[field.name] ?? ''}
                  onChangeText={(value) => setValue(field.name, value)}
                  keyboardType={field.keyboard === 'number' ? 'number-pad' : 'default'}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text
                  style={[
                    styles.fieldHint,
                    valueOf(field.name).length > 0 && !isFieldValid(field) && styles.fieldHintInvalid,
                  ]}
                >
                  {field.hint}
                </Text>
              </View>
            ),
          )}

          <BankPickerSheet
            visible={bankPickerVisible}
            banks={options.banks}
            selectedName={values.bankName ?? ''}
            onSelect={handleSelectBank}
            onClose={() => setBankPickerVisible(false)}
          />
        </>
      )}
    </AuthScreenLayout>
  );
}

interface BankPickerSheetProps {
  visible: boolean;
  banks: BankOption[];
  selectedName: string;
  onSelect: (bank: BankOption) => void;
  onClose: () => void;
}

// Picking a bank also fills in its paybill (bankShortcode), which stays
// editable in case the listed code is wrong for this account.
function BankPickerSheet({ visible, banks, selectedName, onSelect, onClose }: BankPickerSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>Select your bank</Text>
          <ScrollView style={styles.bankList}>
            {banks.map((bank) => (
              <Pressable key={bank.name} style={styles.bankRow} onPress={() => onSelect(bank)}>
                <Text style={styles.bankRowText}>{bank.name}</Text>
                {selectedName === bank.name ? <CheckmarkIcon size={18} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
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
  loadState: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  typeDescription: {
    ...typography.body,
    color: colors.text.secondary,
  },
  fieldHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  fieldHintInvalid: {
    color: colors.feedback.danger,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  bankSelector: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  bankSelectorText: {
    ...typography.bodyLarge,
    color: colors.text.primary,
  },
  bankSelectorPlaceholder: {
    ...typography.bodyLarge,
    color: colors.text.tertiary,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  sheetTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  bankList: {
    flexGrow: 0,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  bankRowText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
  },
});

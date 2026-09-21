import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { KENYA_BANKS, KenyaBank } from '../../data/kenyaBanks';
import { colors, radii, spacing, typography } from '../../theme';
import type { PaymentDestination } from '../../types/business';

const TOTAL_STEPS = 11;

type DestinationType = PaymentDestination['type'];

const TYPE_OPTIONS: { value: DestinationType; label: string }[] = [
  { value: 'mpesa_till', label: 'M-Pesa Till' },
  { value: 'mpesa_paybill', label: 'M-Pesa Paybill' },
  { value: 'bank_account', label: 'Bank Account' },
];

export function PaymentDestinationScreen() {
  const router = useRouter();
  const submitPaymentDestination = useBusinessOnboardingStore((s) => s.submitPaymentDestination);
  const isSubmitting = useBusinessOnboardingStore((s) => s.isSubmitting);
  const error = useBusinessOnboardingStore((s) => s.error);

  const [type, setType] = useState<DestinationType>('mpesa_till');
  const [tillNumber, setTillNumber] = useState('');
  const [paybillNumber, setPaybillNumber] = useState('');
  const [paybillAccountNumber, setPaybillAccountNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState<KenyaBank | null>(null);
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankPickerVisible, setBankPickerVisible] = useState(false);

  const canContinue =
    type === 'mpesa_till'
      ? tillNumber.trim().length > 0
      : type === 'mpesa_paybill'
        ? paybillNumber.trim().length > 0 && paybillAccountNumber.trim().length > 0
        : selectedBank !== null && bankAccountNumber.trim().length > 0;

  const handleContinue = async () => {
    if (!canContinue) return;

    const input: Parameters<typeof submitPaymentDestination>[0] =
      type === 'mpesa_till'
        ? { type, tillNumber: tillNumber.trim() }
        : type === 'mpesa_paybill'
          ? { type, paybillNumber: paybillNumber.trim(), paybillAccountNumber: paybillAccountNumber.trim() }
          : {
              type,
              bankName: selectedBank!.name,
              bankShortcode: selectedBank!.shortcode,
              bankAccountNumber: bankAccountNumber.trim(),
            };

    await submitPaymentDestination(input);

    router.push('/business-team-mode');
  };

  return (
    <AuthScreenLayout
      title="How will you get paid?"
      subtitle="Choose where customer payments should land."
      progress={9 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={isSubmitting ? 'Saving…' : 'Continue'}
            disabled={!canContinue || isSubmitting}
            onPress={handleContinue}
          />
        </>
      }
    >
      <View style={styles.pillRow}>
        {TYPE_OPTIONS.map((option) => {
          const selected = type === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setType(option.value)}
              style={[styles.pill, selected && styles.pillSelected]}
            >
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {type === 'mpesa_till' ? (
        <Input
          label="Till number"
          value={tillNumber}
          onChangeText={setTillNumber}
          placeholder="174379"
          keyboardType="number-pad"
        />
      ) : null}

      {type === 'mpesa_paybill' ? (
        <>
          <Input
            label="Paybill number"
            value={paybillNumber}
            onChangeText={setPaybillNumber}
            placeholder="400200"
            keyboardType="number-pad"
          />
          <Input
            label="Account number"
            value={paybillAccountNumber}
            onChangeText={setPaybillAccountNumber}
            placeholder="e.g. your business name"
          />
        </>
      ) : null}

      {type === 'bank_account' ? (
        <>
          <View>
            <Text style={styles.fieldLabel}>Bank</Text>
            <Pressable style={styles.bankSelector} onPress={() => setBankPickerVisible(true)}>
              <Text style={selectedBank ? styles.bankSelectorText : styles.bankSelectorPlaceholder}>
                {selectedBank ? selectedBank.name : 'Select your bank'}
              </Text>
            </Pressable>
          </View>
          <Input
            label="Account number"
            value={bankAccountNumber}
            onChangeText={setBankAccountNumber}
            placeholder="1234567890"
            keyboardType="number-pad"
          />
        </>
      ) : null}

      <BankPickerSheet
        visible={bankPickerVisible}
        selected={selectedBank}
        onSelect={(bank) => {
          setSelectedBank(bank);
          setBankPickerVisible(false);
        }}
        onClose={() => setBankPickerVisible(false)}
      />
    </AuthScreenLayout>
  );
}

interface BankPickerSheetProps {
  visible: boolean;
  selected: KenyaBank | null;
  onSelect: (bank: KenyaBank) => void;
  onClose: () => void;
}

function BankPickerSheet({ visible, selected, onSelect, onClose }: BankPickerSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>Select your bank</Text>
          <ScrollView style={styles.bankList}>
            {KENYA_BANKS.map((bank) => (
              <Pressable
                key={bank.shortcode}
                style={styles.bankRow}
                onPress={() => onSelect(bank)}
              >
                <Text style={styles.bankRowText}>{bank.name}</Text>
                {selected?.shortcode === bank.shortcode ? <Text style={styles.bankRowCheck}>✓</Text> : null}
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
  bankRowCheck: {
    ...typography.bodyMedium,
    color: colors.brand.purple,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
  },
});

import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloseIcon } from '../../components/icons/CloseIcon';
import { Button } from '../../components/Button';
import { colors, radii, spacing, typography } from '../../theme';

export type SearchFilters = {
  priceMax: number | null;
  ratingMin: number | null;
  radiusKm: number | null;
};

export const EMPTY_FILTERS: SearchFilters = { priceMax: null, ratingMin: null, radiusKm: null };

export function activeFilterCount(filters: SearchFilters): number {
  return Object.values(filters).filter((value) => value !== null).length;
}

// No slider library is installed (and adding a native one mid-flow means a
// dev-client rebuild), so price/rating/distance are discrete preset pills
// rather than the true sliders the candidate-screens doc describes — same
// pill pattern as category filters and the booking flow's date/time pickers.
const PRICE_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Any', value: null },
  { label: 'Under KSh 1,000', value: 1000 },
  { label: 'Under KSh 2,500', value: 2500 },
  { label: 'Under KSh 5,000', value: 5000 },
];

const RATING_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Any', value: null },
  { label: '3.5+', value: 3.5 },
  { label: '4.0+', value: 4 },
  { label: '4.5+', value: 4.5 },
];

const RADIUS_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Any', value: null },
  { label: '2 km', value: 2 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '20 km', value: 20 },
];

interface FilterSheetProps {
  visible: boolean;
  filters: SearchFilters;
  onClose: () => void;
  onApply: (filters: SearchFilters) => void;
}

export function FilterSheet({ visible, filters, onClose, onApply }: FilterSheetProps) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleReset = () => setDraft(EMPTY_FILTERS);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
            <CloseIcon size={16} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <FilterGroup
            label="Price"
            options={PRICE_OPTIONS}
            selected={draft.priceMax}
            onSelect={(value) => setDraft((d) => ({ ...d, priceMax: value }))}
          />
          <FilterGroup
            label="Rating"
            options={RATING_OPTIONS}
            selected={draft.ratingMin}
            onSelect={(value) => setDraft((d) => ({ ...d, ratingMin: value }))}
          />
          <FilterGroup
            label="Distance"
            options={RADIUS_OPTIONS}
            selected={draft.radiusKm}
            onSelect={(value) => setDraft((d) => ({ ...d, radiusKm: value }))}
          />
        </View>

        <View style={styles.footer}>
          <Pressable onPress={handleReset} hitSlop={8}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Button label="Apply" onPress={handleApply} style={styles.applyButton} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { label: string; value: number | null }[];
  selected: number | null;
  onSelect: (value: number | null) => void;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.pillRow}>
        {options.map((option) => {
          const isSelected = option.value === selected;
          return (
            <Pressable
              key={option.label}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => onSelect(option.value)}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  group: {
    gap: spacing.sm,
  },
  groupLabel: {
    ...typography.label,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  resetText: {
    ...typography.bodyMedium,
    color: colors.brand.purple,
  },
  applyButton: {
    flex: 1,
    maxWidth: 200,
  },
});

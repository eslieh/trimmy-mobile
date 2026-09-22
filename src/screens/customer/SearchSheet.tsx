import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchIcon } from '../../components/icons/SearchIcon';
import { LocationPinIcon } from '../../components/icons/LocationPinIcon';
import { CloseIcon } from '../../components/icons/CloseIcon';
import { Button } from '../../components/Button';
import { BUSINESS_CATEGORIES } from '../../data/businessCategories';
import { useRecentSearchesStore } from '../../store/useRecentSearchesStore';
import { colors, radii, spacing, typography } from '../../theme';
import type { BusinessCategory } from '../../types/business';

interface SearchSheetProps {
  visible: boolean;
  initialQuery: string;
  initialCategory: BusinessCategory | null;
  locationLabel: string;
  onUseCurrentLocation: () => void;
  onClose: () => void;
  onSubmit: (query: string, category: BusinessCategory | null) => void;
}

// Fresha-inspired dedicated search experience, launched by tapping Explore's
// search pill — stacked query/location rows, recent searches, a category
// grid, and a full-width submit button, rather than an always-visible inline
// text input.
export function SearchSheet({
  visible,
  initialQuery,
  initialCategory,
  locationLabel,
  onUseCurrentLocation,
  onClose,
  onSubmit,
}: SearchSheetProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<BusinessCategory | null>(initialCategory);
  const recentSearches = useRecentSearchesStore((s) => s.queries);
  const addSearch = useRecentSearchesStore((s) => s.addSearch);
  const clearSearches = useRecentSearchesStore((s) => s.clear);

  useEffect(() => {
    if (visible) {
      setQuery(initialQuery);
      setCategory(initialCategory);
    }
  }, [visible, initialQuery, initialCategory]);

  const handleSubmit = () => {
    addSearch(query);
    onSubmit(query, category);
  };

  const handleSelectRecent = (value: string) => {
    setQuery(value);
    addSearch(value);
    onSubmit(value, category);
  };

  const handleSelectCategory = (value: BusinessCategory) => {
    const next = category === value ? null : value;
    setCategory(next);
    addSearch(query);
    onSubmit(query, next);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
            <CloseIcon size={16} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <SearchIcon size={18} color={colors.text.tertiary} />
            <TextInput
              style={styles.fieldInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Any treatments, venues or professionals"
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </View>

          <Pressable style={styles.field} onPress={onUseCurrentLocation}>
            <LocationPinIcon size={18} color={colors.text.tertiary} />
            <Text style={styles.fieldText}>{locationLabel}</Text>
          </Pressable>

          {recentSearches.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recents</Text>
                <Pressable onPress={clearSearches} hitSlop={8}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              </View>
              {recentSearches.map((recent) => (
                <Pressable key={recent} style={styles.recentRow} onPress={() => handleSelectRecent(recent)}>
                  <SearchIcon size={16} color={colors.text.secondary} />
                  <Text style={styles.recentText}>{recent}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoryGrid}>
              {BUSINESS_CATEGORIES.map((option) => {
                const selected = category === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.categoryCard, selected && styles.categoryCardSelected]}
                    onPress={() => handleSelectCategory(option.value)}
                  >
                    <Text style={[styles.categoryCardText, selected && styles.categoryCardTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Search" onPress={handleSubmit} />
        </View>
      </SafeAreaView>
    </Modal>
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
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  fieldInput: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    flex: 1,
  },
  fieldText: {
    ...typography.bodyLarge,
    color: colors.text.primary,
  },
  section: {
    marginTop: spacing.md,
    gap: spacing.sm,
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
  clearText: {
    ...typography.bodyMedium,
    color: colors.brand.purple,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  recentText: {
    ...typography.body,
    color: colors.text.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    width: '47%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
  },
  categoryCardSelected: {
    backgroundColor: colors.pill.selectedBg,
  },
  categoryCardText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  categoryCardTextSelected: {
    color: colors.pill.selectedText,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
});

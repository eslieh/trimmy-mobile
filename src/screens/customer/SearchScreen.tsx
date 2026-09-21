import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { searchBusinesses } from '../../api/discovery';
import { BUSINESS_CATEGORIES } from '../../data/businessCategories';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import type { BusinessCategory } from '../../types/business';
import type { BusinessSummary } from '../../types/discovery';

// Nairobi CBD default — same fallback used by the business-side LocationPicker.
const DEFAULT_COORDS = { lat: -1.2921, lng: 36.8219 };

// The real, editable search experience (query + category + live results) —
// Home is a lighter curated browse view that hands off here.
export function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<BusinessCategory | null>(null);
  const [results, setResults] = useState<BusinessSummary[] | null>(null);

  useEffect(() => {
    searchBusinesses({
      lat: DEFAULT_COORDS.lat,
      lng: DEFAULT_COORDS.lng,
      query: query.trim() || undefined,
      category: category ?? undefined,
    }).then(setResults);
  }, [query, category]);

  const toggleCategory = (value: BusinessCategory) => {
    setCategory((current) => (current === value ? null : value));
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search services, salons, barbers…"
          placeholderTextColor={colors.text.tertiary}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={BUSINESS_CATEGORIES}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => {
            const selected = category === item.value;
            return (
              <Pressable
                onPress={() => toggleCategory(item.value)}
                style={[styles.filterPill, selected && styles.filterPillSelected]}
              >
                <Text style={[styles.filterPillText, selected && styles.filterPillTextSelected]}>{item.label}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      {results === null ? (
        <ActivityIndicator style={styles.loading} color={colors.text.secondary} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.businessId}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No results — try a different search or category.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/business/${item.businessId}`)}>
              <Image source={{ uri: item.thumbnailUrl }} style={styles.cardThumb} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardMeta}>
                  {item.address} · {item.distanceKm.toFixed(1)} km
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardRating}>★ {item.rating.toFixed(1)} ({item.reviewCount})</Text>
                  <Text style={styles.cardPrice}>From KSh {item.startingPrice.amount}</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  searchInput: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  filterRow: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.pill.unselectedBg,
  },
  filterPillSelected: {
    backgroundColor: colors.pill.selectedBg,
  },
  filterPillText: {
    ...typography.bodyMedium,
    color: colors.pill.unselectedText,
  },
  filterPillTextSelected: {
    color: colors.pill.selectedText,
  },
  loading: {
    marginTop: spacing.xxxl,
  },
  resultsList: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  emptyState: {
    paddingTop: spacing.huge,
    alignItems: 'center',
  },
  emptyStateText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  cardThumb: {
    width: 88,
    height: 88,
    borderRadius: radii.md,
    backgroundColor: colors.background.tertiary,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  cardName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  cardRating: {
    ...typography.caption,
    color: colors.text.primary,
  },
  cardPrice: {
    ...typography.label,
    color: colors.brand.purple,
  },
});

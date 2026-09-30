import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { BusinessResultCard } from '../../components/BusinessResultCard';
import { BusinessResultCardLarge } from '../../components/BusinessResultCardLarge';
import { CloseIcon } from '../../components/icons/CloseIcon';
import { FilterIcon } from '../../components/icons/FilterIcon';
import { LocationPinIcon } from '../../components/icons/LocationPinIcon';
import { SearchIcon } from '../../components/icons/SearchIcon';
import { EMPTY_FILTERS, FilterSheet, activeFilterCount, type SearchFilters } from './FilterSheet';
import { SearchResultsMap } from './SearchResultsMap';
import { SearchSheet } from './SearchSheet';
import { getBusinessesByIds, searchBusinesses } from '../../api/discovery';
import { BUSINESS_CATEGORIES } from '../../data/businessCategories';
import { useRecentlyViewedStore } from '../../store/useRecentlyViewedStore';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import type { BusinessCategory } from '../../types/business';
import type { BusinessSummary } from '../../types/discovery';

type SortOption = 'distance' | 'price' | 'rating';

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Distance', value: 'distance' },
  { label: 'Price', value: 'price' },
  { label: 'Rating', value: 'rating' },
];

function sortResults(results: BusinessSummary[], sortBy: SortOption): BusinessSummary[] {
  const sorted = [...results];
  if (sortBy === 'price') sorted.sort((a, b) => a.startingPrice.amount - b.startingPrice.amount);
  else if (sortBy === 'rating') sorted.sort((a, b) => b.rating - a.rating);
  else sorted.sort((a, b) => a.distanceKm - b.distanceKm);
  return sorted;
}

// Nairobi CBD default — same fallback used by the business-side LocationPicker.
const DEFAULT_COORDS = { lat: -1.2921, lng: 36.8219 };

// The app's first tab — Airbnb-style: a tappable search pill (not an inline
// input) that opens SearchSheet, quick category filters, and a sectioned
// browse view (Recently viewed / Recommended) when no search is active. Once
// a search is active (query or category set), the sections give way to a
// flat results list, same screen either way. Browse sections render as a
// vertical 2-column grid (not horizontal carousels) so the whole screen
// scrolls in one direction.
export function ExploreScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<BusinessCategory | null>(null);
  const [locationLabel, setLocationLabel] = useState('Nairobi, Kenya');
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [searchSheetVisible, setSearchSheetVisible] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [results, setResults] = useState<BusinessSummary[] | null>(null);
  const [recommended, setRecommended] = useState<BusinessSummary[] | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<BusinessSummary[] | null>(null);
  const recentlyViewedIds = useRecentlyViewedStore((s) => s.businessIds);

  const isActiveSearch = query.trim().length > 0 || category !== null || activeFilterCount(filters) > 0;

  useEffect(() => {
    searchBusinesses({ lat: coords.lat, lng: coords.lng }).then(setRecommended);
  }, [coords]);

  useEffect(() => {
    getBusinessesByIds(recentlyViewedIds).then(setRecentlyViewed);
  }, [recentlyViewedIds]);

  useEffect(() => {
    if (!isActiveSearch) {
      setResults(null);
      return;
    }
    searchBusinesses({
      lat: coords.lat,
      lng: coords.lng,
      query: query.trim() || undefined,
      category: category ?? undefined,
      priceMax: filters.priceMax ?? undefined,
      ratingMin: filters.ratingMin ?? undefined,
      radiusKm: filters.radiusKm ?? undefined,
    }).then(setResults);
  }, [isActiveSearch, query, category, filters, coords]);


  const handleUseCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const position = await Location.getCurrentPositionAsync({});
    setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });

    const [place] = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    if (place) {
      setLocationLabel([place.district ?? place.city, place.region].filter(Boolean).join(', '));
    }
  };

  const toggleCategory = (value: BusinessCategory) => {
    setCategory((current) => (current === value ? null : value));
  };

  const clearSearch = () => {
    setQuery('');
    setCategory(null);
    setFilters(EMPTY_FILTERS);
  };

  const filterCount = activeFilterCount(filters);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.locationChip} onPress={handleUseCurrentLocation} hitSlop={4}>
          <LocationPinIcon size={14} color={colors.text.secondary} />
          <Text style={styles.locationChipText}>{locationLabel}</Text>
        </Pressable>

        <View style={styles.searchPillRow}>
          <Pressable style={styles.searchPill} onPress={() => setSearchSheetVisible(true)}>
            <SearchIcon size={18} color={colors.text.tertiary} />
            <Text style={[styles.searchPillText, isActiveSearch && styles.searchPillTextActive]} numberOfLines={1}>
              {query.trim() || 'Start your search'}
            </Text>
          </Pressable>
          {isActiveSearch ? (
            <Pressable style={styles.clearButton} onPress={clearSearch} hitSlop={8}>
              <CloseIcon size={16} />
            </Pressable>
          ) : null}
          <Pressable
            style={[styles.iconButton, filterCount > 0 && styles.iconButtonActive]}
            onPress={() => setFilterSheetVisible(true)}
            hitSlop={4}
          >
            <FilterIcon size={18} color={filterCount > 0 ? colors.white : colors.text.primary} />
            {filterCount > 0 ? (
              <View style={styles.iconButtonBadge}>
                <Text style={styles.iconButtonBadgeText}>{filterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

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

      {isActiveSearch ? (
        results === null ? (
          <ActivityIndicator style={styles.loading} color={colors.text.secondary} />
        ) : (
          <View style={styles.resultsContainer}>
            {results.length > 0 ? (
              <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>Sort by</Text>
                {SORT_OPTIONS.map((option) => {
                  const selected = sortBy === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[styles.sortPill, selected && styles.sortPillSelected]}
                      onPress={() => setSortBy(option.value)}
                    >
                      <Text style={[styles.sortPillText, selected && styles.sortPillTextSelected]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {viewMode === 'map' ? (
              <SearchResultsMap
                results={sortResults(results, sortBy)}
                center={coords}
                onSelectBusiness={(businessId) => router.push(`/business/${businessId}`)}
              />
            ) : (
              <FlatList
                data={sortResults(results, sortBy)}
                keyExtractor={(item) => item.businessId}
                contentContainerStyle={styles.resultsList}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No results — try a different search or category.</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <BusinessResultCardLarge business={item} onPress={() => router.push(`/business/${item.businessId}`)} />
                )}
              />
            )}

            {results.length > 0 ? (
              <Pressable
                style={styles.mapToggleButton}
                onPress={() => setViewMode((mode) => (mode === 'list' ? 'map' : 'list'))}
              >
                <Text style={styles.mapToggleButtonText}>{viewMode === 'list' ? 'Map' : 'List'}</Text>
              </Pressable>
            ) : null}
          </View>
        )
      ) : (
        <ScrollView contentContainerStyle={styles.sectionsList}>
          {recentlyViewed && recentlyViewed.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recently viewed</Text>
              <FlatList
                data={recentlyViewed}
                keyExtractor={(item) => item.businessId}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.grid}
                contentContainerStyle={styles.gridContent}
                renderItem={({ item }) => (
                  <BusinessResultCard business={item} onPress={() => router.push(`/business/${item.businessId}`)} />
                )}
              />
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended</Text>
            {recommended === null ? (
              <ActivityIndicator color={colors.text.secondary} style={styles.loading} />
            ) : recommended.length === 0 ? (
              <Text style={styles.emptyStateText}>No results — try a different category.</Text>
            ) : (
              <FlatList
                data={recommended}
                keyExtractor={(item) => item.businessId}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.grid}
                contentContainerStyle={styles.gridContent}
                renderItem={({ item }) => (
                  <BusinessResultCard business={item} onPress={() => router.push(`/business/${item.businessId}`)} />
                )}
              />
            )}
          </View>
        </ScrollView>
      )}

      <SearchSheet
        visible={searchSheetVisible}
        initialQuery={query}
        initialCategory={category}
        locationLabel={locationLabel}
        onUseCurrentLocation={handleUseCurrentLocation}
        onClose={() => setSearchSheetVisible(false)}
        onSubmit={(nextQuery, nextCategory) => {
          setQuery(nextQuery);
          setCategory(nextCategory);
          setSearchSheetVisible(false);
        }}
      />

      <FilterSheet
        visible={filterSheetVisible}
        filters={filters}
        onClose={() => setFilterSheetVisible(false)}
        onApply={setFilters}
      />
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
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.background.secondary,
  },
  locationChipText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  searchPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.primary,
    ...shadows.card,
  },
  searchPillText: {
    ...typography.bodyLarge,
    color: colors.text.tertiary,
    flex: 1,
  },
  searchPillTextActive: {
    color: colors.text.primary,
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
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
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
    ...shadows.card,
  },
  iconButtonActive: {
    backgroundColor: colors.button.primaryBg,
  },
  iconButtonBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.brand.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonBadgeText: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
    color: colors.white,
  },
  loading: {
    marginTop: spacing.xxxl,
  },
  resultsContainer: {
    flex: 1,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  sortLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  sortPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.pill.unselectedBg,
  },
  sortPillSelected: {
    backgroundColor: colors.pill.selectedBg,
  },
  sortPillText: {
    ...typography.caption,
    color: colors.pill.unselectedText,
  },
  sortPillTextSelected: {
    color: colors.pill.selectedText,
  },
  mapToggleButton: {
    position: 'absolute',
    bottom: spacing.xxl,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.button.primaryBg,
    ...shadows.raised,
  },
  mapToggleButtonText: {
    ...typography.button,
    color: colors.button.primaryText,
  },
  resultsList: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.huge + spacing.xxl,
  },
  sectionsList: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    paddingHorizontal: spacing.xxl,
  },
  grid: {
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  gridContent: {
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
    paddingHorizontal: spacing.xxl,
  },
});

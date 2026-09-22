import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { BusinessResultCard } from '../../components/BusinessResultCard';
import { HeartIcon } from '../../components/icons/HeartIcon';
import { LocationPinIcon } from '../../components/icons/LocationPinIcon';
import { SearchIcon } from '../../components/icons/SearchIcon';
import { CloseIcon } from '../../components/icons/CloseIcon';
import { RatingLabel } from '../../components/RatingLabel';
import { SearchSheet } from './SearchSheet';
import { getBusinessesByIds, searchBusinesses } from '../../api/discovery';
import { BUSINESS_CATEGORIES } from '../../data/businessCategories';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { useRecentlyViewedStore } from '../../store/useRecentlyViewedStore';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import type { BusinessCategory } from '../../types/business';
import type { BusinessSummary } from '../../types/discovery';

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
  const [results, setResults] = useState<BusinessSummary[] | null>(null);
  const [recommended, setRecommended] = useState<BusinessSummary[] | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<BusinessSummary[] | null>(null);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const recentlyViewedIds = useRecentlyViewedStore((s) => s.businessIds);

  const isActiveSearch = query.trim().length > 0 || category !== null;

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
    }).then(setResults);
  }, [isActiveSearch, query, category, coords]);

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
  };

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
                    <RatingLabel rating={item.rating} reviewCount={item.reviewCount} />
                    <Text style={styles.cardPrice}>From KSh {item.startingPrice.amount}</Text>
                  </View>
                </View>
                <Pressable style={styles.favoriteButton} onPress={() => toggleFavorite(item.businessId)} hitSlop={8}>
                  <HeartIcon
                    size={18}
                    color={isFavorite(item.businessId) ? colors.brand.pink : colors.text.tertiary}
                    filled={isFavorite(item.businessId)}
                  />
                </Pressable>
              </Pressable>
            )}
          />
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
  loading: {
    marginTop: spacing.xxxl,
  },
  resultsList: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
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
  cardPrice: {
    ...typography.label,
    color: colors.brand.purple,
  },
  favoriteButton: {
    padding: spacing.xs,
  },
});

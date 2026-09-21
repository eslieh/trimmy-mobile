import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { BusinessResultCard } from '../../components/BusinessResultCard';
import { SearchIcon } from '../../components/icons/SearchIcon';
import { searchBusinesses } from '../../api/discovery';
import { BUSINESS_CATEGORIES } from '../../data/businessCategories';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import type { BusinessCategory } from '../../types/business';
import type { BusinessSummary } from '../../types/discovery';

// Nairobi CBD default — same fallback used by the business-side LocationPicker.
const DEFAULT_COORDS = { lat: -1.2921, lng: 36.8219 };

const TOP_RATED_THRESHOLD = 4.7;

// Curated "browse" landing — no editable search here (tapping the search bar
// hands off to the Search tab), just location, quick category filters, and a
// recommended list. Mirrors Fresha's Home/Search split.
export function HomeDiscoverScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<BusinessCategory | null>(null);
  const [locationLabel, setLocationLabel] = useState('Nairobi, Kenya');
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [results, setResults] = useState<BusinessSummary[] | null>(null);

  useEffect(() => {
    searchBusinesses({ lat: coords.lat, lng: coords.lng, category: category ?? undefined }).then(setResults);
  }, [category, coords]);

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

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.locationChip} onPress={handleUseCurrentLocation} hitSlop={4}>
          <Text style={styles.locationChipText}>📍 {locationLabel}</Text>
        </Pressable>

        <Pressable style={styles.searchBar} onPress={() => router.push('/search')}>
          <SearchIcon size={18} color={colors.text.tertiary} />
          <Text style={styles.searchBarText}>Search venues, treatments…</Text>
        </Pressable>

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
          data={[{ key: 'recommended' }]}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.sectionsList}
          renderItem={() => (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommended</Text>
              {results.length === 0 ? (
                <Text style={styles.emptyStateText}>No results — try a different category.</Text>
              ) : (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={results}
                  keyExtractor={(item) => item.businessId}
                  contentContainerStyle={styles.cardRow}
                  renderItem={({ item }) => (
                    <BusinessResultCard
                      business={item}
                      badge={item.rating >= TOP_RATED_THRESHOLD ? 'Best in Class' : undefined}
                      onPress={() => router.push(`/business/${item.businessId}`)}
                    />
                  )}
                />
              )}
            </View>
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
  locationChip: {
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
    ...shadows.card,
  },
  searchBarText: {
    ...typography.bodyLarge,
    color: colors.text.tertiary,
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
  sectionsList: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text.primary,
    paddingHorizontal: spacing.xxl,
  },
  cardRow: {
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.text.secondary,
    paddingHorizontal: spacing.xxl,
  },
});

import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BusinessResultCard } from '../../components/BusinessResultCard';
import { searchBusinesses } from '../../api/discovery';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { colors, spacing, typography } from '../../theme';
import type { BusinessSummary } from '../../types/discovery';

export function WishlistScreen() {
  const router = useRouter();
  const businessIds = useFavoritesStore((s) => s.businessIds);
  const [all, setAll] = useState<BusinessSummary[] | null>(null);

  useEffect(() => {
    searchBusinesses({}).then(setAll);
  }, []);

  const favorites = all?.filter((business) => businessIds.has(business.businessId)) ?? [];

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Wishlist</Text>
      </View>

      {all === null ? (
        <ActivityIndicator style={styles.loading} color={colors.text.secondary} />
      ) : favorites.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No favourites yet — tap the heart on a business to save it here.</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.businessId}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <BusinessResultCard business={item} onPress={() => router.push(`/business/${item.businessId}`)} />
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
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  loading: {
    marginTop: spacing.xxxl,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  row: {
    gap: spacing.md,
  },
});

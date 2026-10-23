import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { RatingLabel } from '../../components/RatingLabel';
import { ReviewCard } from '../../components/ReviewCard';
import { listBusinessReviews } from '../../api/reviews';
import { colors, spacing, typography } from '../../theme';
import type { BusinessProfileReview } from '../../types/discovery';

const PAGE = 20;

// Every review of a business (from its profile's "See all reviews"), newest
// first, loading more as you scroll.
export function BusinessReviewsListScreen() {
  const router = useRouter();
  const { businessId, name } = useLocalSearchParams<{ businessId: string; name?: string }>();
  const [reviews, setReviews] = useState<BusinessProfileReview[]>([]);
  const [total, setTotal] = useState(0);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(
    async (offset: number) => {
      const page = await listBusinessReviews(businessId, { limit: PAGE, offset });
      setReviews((current) => (offset === 0 ? page.reviews : [...current, ...page.reviews]));
      setTotal(page.total);
      setAverage(page.averageRating);
    },
    [businessId],
  );

  const firstLoad = useCallback(() => {
    setLoading(true);
    setFailed(false);
    load(0).catch(() => setFailed(true)).finally(() => setLoading(false));
  }, [load]);

  useEffect(firstLoad, [firstLoad]);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {name ? `Reviews · ${name}` : 'Reviews'}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator style={styles.loading} color={colors.text.secondary} />
      ) : failed ? (
        <View style={styles.failed}>
          <Text style={styles.empty}>Couldn't load the reviews.</Text>
          <Button label="Try again" variant="secondary" onPress={firstLoad} />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(r) => r.reviewId}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            total ? (
              <View style={styles.summary}>
                <Text style={styles.average}>{average.toFixed(1)}</Text>
                <View>
                  <RatingLabel rating={average} size={14} />
                  <Text style={styles.count}>{total === 1 ? '1 review' : `${total} reviews`}</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.empty}>No reviews yet.</Text>}
          renderItem={({ item }) => <ReviewCard review={item} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (reviews.length < total) load(reviews.length).catch(() => {});
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(0).catch(() => {}).finally(() => setRefreshing(false));
              }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

export const reviewListStyles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: { ...typography.h2, color: colors.text.primary, flex: 1 },
  loading: { marginTop: spacing.huge },
  list: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.huge, gap: spacing.md },
  summary: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, marginBottom: spacing.sm },
  average: { ...typography.display, color: colors.brand.purple },
  count: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  empty: { ...typography.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.huge },
  failed: { paddingHorizontal: spacing.xxl, gap: spacing.lg },
});
const styles = reviewListStyles;

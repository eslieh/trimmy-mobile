import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { BackButton } from '../../components/BackButton';
import { ReviewCard } from '../../components/ReviewCard';
import { listMyReviews } from '../../api/reviews';
import { colors } from '../../theme';
import type { BusinessProfileReview } from '../../types/discovery';
import { reviewListStyles as styles } from './BusinessReviewsListScreen';

// The reviews you've written (from Profile, or a "they replied" notification),
// with the businesses' replies. Tap one to open the business.
export function MyReviewsScreen() {
  const router = useRouter();
  const [reviews, setReviews] = useState<BusinessProfileReview[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => listMyReviews().then((page) => setReviews(page.reviews)), []);
  useFocusEffect(
    useCallback(() => {
      load().catch(() => setReviews((r) => r ?? []));
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>My reviews</Text>
      </View>
      {reviews === null ? (
        <ActivityIndicator style={styles.loading} color={colors.text.secondary} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(r) => r.reviewId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No reviews yet. After a visit, rate it from Activity.</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => item.businessId && router.push(`/business/${item.businessId}`)}>
              <ReviewCard review={item} showBusiness />
            </Pressable>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load().catch(() => {}).finally(() => setRefreshing(false));
              }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ReviewCard } from '../../components/ReviewCard';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { SheetModal } from '../../components/ui/SheetModal';
import { listBusinessReviews, replyToReview } from '../../api/reviews';
import { useBusinessContext } from '../../hooks/useBusinessContext';
import { colors, radii, spacing, typography } from '../../theme';
import type { BusinessProfileReview } from '../../types/discovery';
import { showApiError } from '../../utils/showApiError';
import { reviewListStyles as list } from './BusinessReviewsListScreen';

type Filter = 'unreplied' | 'all';

// Owner and front desk: read reviews and reply ("Needs a reply" first). The
// reply shows publicly under the review; the customer is notified.
export function ManageReviewsScreen() {
  const router = useRouter();
  const business = useBusinessContext();
  const businessId = business?.businessId;
  const [filter, setFilter] = useState<Filter>('unreplied');
  const [reviews, setReviews] = useState<BusinessProfileReview[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<BusinessProfileReview | null>(null);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!businessId) return;
    const page = await listBusinessReviews(businessId, { unreplied: filter === 'unreplied', limit: 50 });
    setReviews(page.reviews);
  }, [businessId, filter]);

  useFocusEffect(
    useCallback(() => {
      setReviews(null);
      load().catch(() => setReviews([]));
    }, [load]),
  );

  const open = (review: BusinessProfileReview) => {
    setText(review.reply?.text ?? '');
    setEditing(review);
  };

  const save = async (remove = false) => {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await replyToReview(editing.reviewId, remove ? null : text.trim());
      setReviews((current) =>
        (current ?? [])
          // Answered: it leaves "Needs a reply".
          .filter((r) => !(filter === 'unreplied' && updated.reply && r.reviewId === updated.reviewId))
          .map((r) => (r.reviewId === updated.reviewId ? updated : r)),
      );
      setEditing(null);
    } catch (err) {
      showApiError("Couldn't save the reply", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={list.flex} edges={['top']}>
      <View style={list.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={list.headerTitle}>Reviews</Text>
      </View>
      <View style={styles.tabs}>
        <SegmentedTabs
          options={[
            { key: 'unreplied', label: 'Needs a reply' },
            { key: 'all', label: 'All reviews' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </View>
      {reviews === null ? (
        <ActivityIndicator style={list.loading} color={colors.text.secondary} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(r) => r.reviewId}
          contentContainerStyle={list.list}
          ListEmptyComponent={
            <Text style={list.empty}>{filter === 'unreplied' ? 'All caught up: every review has a reply.' : 'No reviews yet.'}</Text>
          }
          renderItem={({ item }) => (
            <ReviewCard
              review={item}
              action={
                <Pressable onPress={() => open(item)} hitSlop={8} style={styles.replyButton}>
                  <Text style={styles.replyButtonText}>{item.reply ? 'Edit reply' : 'Reply'}</Text>
                </Pressable>
              }
            />
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

      <SheetModal
        visible={editing !== null}
        onRequestClose={() => !saving && setEditing(null)}
        onBackdropPress={() => !saving && setEditing(null)}
        sheetStyle={styles.sheet}
      >
        <Text style={styles.sheetTitle}>Reply to {editing?.authorName}</Text>
        <Text style={styles.sheetHint}>Shown publicly under the review.</Text>
        <Input label="Your reply" value={text} onChangeText={setText} placeholder="Thanks for coming in!" multiline maxLength={1000} />
        <Button label={saving ? 'Saving…' : editing?.reply ? 'Save reply' : 'Post reply'} onPress={() => save()} disabled={saving || !text.trim()} />
        {editing?.reply ? (
          <Pressable onPress={() => save(true)} disabled={saving} style={styles.remove} hitSlop={8}>
            <Text style={styles.removeText}>Remove reply</Text>
          </Pressable>
        ) : null}
      </SheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabs: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.md },
  replyButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.brand.accentSoft,
  },
  replyButtonText: { ...typography.label, fontSize: 13, color: colors.brand.accentForeground },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  sheetTitle: { ...typography.h2, color: colors.text.primary },
  sheetHint: { ...typography.caption, color: colors.text.secondary, marginTop: -spacing.sm },
  remove: { alignSelf: 'center', paddingVertical: spacing.sm },
  removeText: { ...typography.label, color: colors.feedback.danger },
});

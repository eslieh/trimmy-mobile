import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { RatingLabel } from './RatingLabel';
import { colors, radii, spacing, typography } from '../theme';
import type { BusinessProfileReview } from '../types/discovery';

function when(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// One review: who wrote it (photo, name, date), the rating, what was done and
// by whom, the text, and the business's reply under it. `showBusiness` names
// the business (a customer's own list); `action` is the business side's
// Reply / Edit button.
export function ReviewCard({
  review, showBusiness, action,
}: { review: BusinessProfileReview; showBusiness?: boolean; action?: ReactNode }) {
  const what = [review.services?.length ? review.services.join(', ') : null, review.staffName ? `with ${review.staffName}` : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar name={review.authorName} uri={review.authorAvatarUrl} size={40} />
        <View style={styles.headerText}>
          <Text style={styles.author} numberOfLines={1}>
            {review.authorName}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {showBusiness && review.businessName ? `${review.businessName} · ` : ''}
            {when(review.createdAt)}
          </Text>
        </View>
        {action}
      </View>
      <View style={styles.ratingRow}>
        <RatingLabel rating={review.rating} size={12} />
        {what ? (
          <Text style={styles.meta} numberOfLines={1}>
            {what}
          </Text>
        ) : null}
      </View>
      {review.text ? <Text style={styles.text}>{review.text}</Text> : null}
      {review.reply ? (
        <View style={styles.reply}>
          <Text style={styles.replyLabel}>
            Reply from {showBusiness && review.businessName ? review.businessName : 'the business'}
          </Text>
          <Text style={styles.text}>{review.reply.text}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  author: {
    ...typography.label,
    color: colors.text.primary,
  },
  meta: {
    ...typography.caption,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    ...typography.body,
    color: colors.text.primary,
  },
  reply: {
    marginTop: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: 2,
  },
  replyLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

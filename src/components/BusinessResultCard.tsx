import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { HeartIcon } from './icons/HeartIcon';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { colors, radii, shadows, spacing, typography } from '../theme';
import type { BusinessSummary } from '../types/discovery';

interface BusinessResultCardProps {
  business: BusinessSummary;
  badge?: string;
  onPress: () => void;
}

export function BusinessResultCard({ business, badge, onPress }: BusinessResultCardProps) {
  const isFavorite = useFavoritesStore((s) => s.isFavorite(business.businessId));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.thumbWrapper}>
        <Image source={{ uri: business.thumbnailUrl }} style={styles.thumb} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <Pressable
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(business.businessId)}
          hitSlop={8}
        >
          <HeartIcon size={16} color={isFavorite ? colors.brand.pink : colors.white} filled={isFavorite} />
        </Pressable>
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {business.name}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {business.distanceKm.toFixed(1)} km · {business.address}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.rating}>
          ★ {business.rating.toFixed(1)} ({business.reviewCount})
        </Text>
        <Text style={styles.price}>From KSh {business.startingPrice.amount}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
  },
  thumbWrapper: {
    width: 220,
    height: 150,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.background.tertiary,
    ...shadows.card,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  rating: {
    ...typography.caption,
    color: colors.text.primary,
  },
  price: {
    ...typography.label,
    color: colors.brand.purple,
  },
});

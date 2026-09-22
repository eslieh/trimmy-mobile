import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AnimatedFavoriteHeart } from './AnimatedFavoriteHeart';
import { RatingLabel } from './RatingLabel';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { colors, radii, shadows, spacing, typography } from '../theme';
import type { BusinessSummary } from '../types/discovery';

interface BusinessResultCardProps {
  business: BusinessSummary;
  onPress: () => void;
}

// Flexible width (fills whatever grid cell it's placed in — see
// ExploreScreen/WishlistScreen's numColumns={2} grids), shorter landscape
// image (reduced height, not a square), minimal text underneath (name,
// rating + distance, price) for a clean look rather than every field
// crammed in.
export function BusinessResultCard({ business, onPress }: BusinessResultCardProps) {
  const isFavorite = useFavoritesStore((s) => s.isFavorite(business.businessId));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.thumbWrapper}>
        <Image source={{ uri: business.thumbnailUrl }} style={styles.thumb} />
        <Pressable
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(business.businessId)}
          hitSlop={8}
        >
          <AnimatedFavoriteHeart filled={isFavorite} size={16} />
        </Pressable>
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {business.name}
      </Text>
      <Text style={styles.address} numberOfLines={1}>
        {business.address}
      </Text>
      <View style={styles.metaRow}>
        <RatingLabel rating={business.rating} size={11} textStyle={styles.metaText} />
        <Text style={styles.metaText}>· {business.distanceKm.toFixed(1)} km</Text>
      </View>
      <Text style={styles.price}>From KSh {business.startingPrice.amount}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  thumbWrapper: {
    width: '100%',
    aspectRatio: 1.3,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.background.tertiary,
    ...shadows.card,
  },
  thumb: {
    width: '100%',
    height: '100%',
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
    ...typography.label,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  address: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  price: {
    ...typography.caption,
    color: colors.brand.purple,
    marginTop: 2,
  },
});

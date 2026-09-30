import { useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AnimatedFavoriteHeart } from './AnimatedFavoriteHeart';
import { RatingLabel } from './RatingLabel';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { colors, radii, shadows, spacing, typography } from '../theme';
import type { BusinessSummary } from '../types/discovery';

interface BusinessResultCardLargeProps {
  business: BusinessSummary;
  onPress: () => void;
}

// Airbnb-style single-column search result card: full-width swipeable photo
// carousel (dot pagination) with details below. Used by Explore's active-
// search results list — distinct from the compact BusinessResultCard grid
// card (browse sections / Wishlist), which only ever shows one photo.
export function BusinessResultCardLarge({ business, onPress }: BusinessResultCardLargeProps) {
  const isFavorite = useFavoritesStore((s) => s.isFavorite(business.businessId));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const [cardWidth, setCardWidth] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);

  const photos = business.photos.length > 0 ? business.photos : [business.thumbnailUrl];

  const handleLayout = (event: LayoutChangeEvent) => {
    setCardWidth(event.nativeEvent.layout.width);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (cardWidth > 0) setPageIndex(Math.round(event.nativeEvent.contentOffset.x / cardWidth));
  };

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.thumbWrapper} onLayout={handleLayout}>
        {cardWidth > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
          >
            {photos.map((url, index) => (
              <Image key={`${url}_${index}`} source={{ uri: url }} style={[styles.thumb, { width: cardWidth }]} />
            ))}
          </ScrollView>
        ) : null}

        <Pressable style={styles.favoriteButton} onPress={() => toggleFavorite(business.businessId)} hitSlop={8}>
          <AnimatedFavoriteHeart filled={isFavorite} size={18} />
        </Pressable>

        {photos.length > 1 ? (
          <View style={styles.dotsRow} pointerEvents="none">
            {photos.map((_, index) => (
              <View key={index} style={[styles.dot, index === pageIndex && styles.dotActive]} />
            ))}
          </View>
        ) : null}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {business.name}
      </Text>
      <Text style={styles.address} numberOfLines={1}>
        {business.address}
      </Text>
      <View style={styles.metaRow}>
        <RatingLabel rating={business.rating} reviewCount={business.reviewCount} size={13} textStyle={styles.metaText} />
        <Text style={styles.metaText}>· {business.distanceKm.toFixed(1)} km</Text>
      </View>
      <Text style={styles.price}>From KSh {business.startingPrice.amount}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.xl,
  },
  thumbWrapper: {
    width: '100%',
    aspectRatio: 1.1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.background.tertiary,
    ...shadows.card,
  },
  thumb: {
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: colors.white,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  address: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  price: {
    ...typography.bodyMedium,
    color: colors.brand.purple,
    marginTop: spacing.xs,
  },
});

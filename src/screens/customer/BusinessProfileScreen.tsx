import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { ChevronLeftIcon } from '../../components/icons/ChevronLeftIcon';
import { AnimatedFavoriteHeart } from '../../components/AnimatedFavoriteHeart';
import { LocationPinIcon } from '../../components/icons/LocationPinIcon';
import { ShareIcon } from '../../components/icons/ShareIcon';
import { PhotoGridModal } from '../../components/PhotoGridModal';
import { RatingLabel } from '../../components/RatingLabel';
import { getBusinessProfile } from '../../api/discovery';
import { BUSINESS_CATEGORIES } from '../../data/businessCategories';
import { useBookingDraftStore } from '../../store/useBookingDraftStore';
import { useCartStore } from '../../store/useCartStore';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { useRecentlyViewedStore } from '../../store/useRecentlyViewedStore';
import { getOpenStatus } from '../../utils/availability';
import { groupServicesByCategory } from '../../utils/services';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import type { BookingServiceLine } from '../../types/booking';
import type { BusinessProfile } from '../../types/discovery';

function categoryLabel(value: string): string {
  return BUSINESS_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

// Landscape-ish hero (shorter than a square) — see hero's aspectRatio below.
const HERO_ASPECT_RATIO = 1.15;
const HEADER_BUTTON_ZONE = 56;

export function BusinessProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [photosGridVisible, setPhotosGridVisible] = useState(false);
  const scrollY = useSharedValue(0);

  const recordView = useRecentlyViewedStore((s) => s.recordView);
  const isFavorite = useFavoritesStore((s) => s.isFavorite(businessId));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const cartBusinessId = useCartStore((s) => s.businessId);
  const cartQuantities = useCartStore((s) => s.quantities);
  const startBookingDraft = useBookingDraftStore((s) => s.startDraft);

  useEffect(() => {
    getBusinessProfile(businessId).then(setProfile);
    recordView(businessId);
  }, [businessId]);

  const handleShare = () => {
    if (!profile) return;
    Share.share({ message: `Check out ${profile.name} on Trimmy` }).catch(() => {});
  };

  const handlePhotoScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPageIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Fade the fixed header's white background in as the hero scrolls out of
  // view, back to transparent when scrolled to the top.
  const heroHeight = width / HERO_ASPECT_RATIO;
  const headerFadeEnd = Math.max(heroHeight - insets.top - HEADER_BUTTON_ZONE, 1);
  const headerBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, headerFadeEnd], [0, 1], Extrapolation.CLAMP),
  }));

  const goToServices = () => {
    router.push(`/business/${businessId}/services`);
  };

  // Cart already has services picked for this business — skip straight into
  // the booking flow instead of back through the picker (Edit on the
  // services card / Review step still route back to it if needed).
  const goToBooking = () => {
    if (!profile) return;
    const lines: BookingServiceLine[] = profile.services
      .filter((service) => (cartQuantities[service.serviceId] ?? 0) > 0)
      .map((service) => ({
        serviceId: service.serviceId,
        name: service.name,
        durationMinutes: service.durationMinutes,
        price: service.price,
        quantity: cartQuantities[service.serviceId],
      }));
    startBookingDraft(businessId, profile.name, lines);
    router.push(`/business/${businessId}/book/staff`);
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ActivityIndicator style={styles.loading} color={colors.text.secondary} />
      </SafeAreaView>
    );
  }

  const cartIsForThisBusiness = cartBusinessId === businessId;
  const selectedCount = cartIsForThisBusiness
    ? Object.values(cartQuantities).reduce((sum, q) => sum + q, 0)
    : 0;
  const cartTotal = cartIsForThisBusiness
    ? profile.services.reduce(
        (sum, service) => sum + (cartQuantities[service.serviceId] ?? 0) * service.price.amount,
        0,
      )
    : 0;
  const openStatus = getOpenStatus(profile.workingHours);

  return (
    <View style={styles.flex}>
      <Animated.ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={styles.hero}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handlePhotoScrollEnd}
            style={styles.heroScroll}
          >
            {profile.photos.map((url) => (
              <Pressable key={url} onPress={() => setPhotosGridVisible(true)}>
                <Image source={{ uri: url }} style={[styles.heroImage, { width }]} />
              </Pressable>
            ))}
          </ScrollView>

          {profile.photos.length > 1 ? (
            <Pressable style={styles.pageBadge} onPress={() => setPhotosGridVisible(true)}>
              <Text style={styles.pageBadgeText}>
                {pageIndex + 1}/{profile.photos.length}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.sheet}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.meta}>{profile.categories.map(categoryLabel).join(', ')}</Text>
          <View style={styles.ratingRow}>
            <RatingLabel rating={profile.rating} textStyle={styles.meta} />
            <Text style={styles.meta}>({profile.reviewCount} reviews)</Text>
            <Text style={[styles.meta, openStatus.isOpen ? styles.openText : styles.closedText]}>
              · {openStatus.label}
            </Text>
          </View>

          <View style={styles.locationRow}>
            <LocationPinIcon size={14} color={colors.text.secondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {profile.address}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{profile.description}</Text>

          <View style={styles.policyCard}>
            <Text style={styles.policyText}>{profile.depositSummary}</Text>
            <Text style={styles.policyText}>{profile.cancellationSummary}</Text>
          </View>

          {profile.amenities.length > 0 ? (
            <View style={styles.pillRow}>
              {profile.amenities.map((amenity) => (
                <View key={amenity} style={styles.amenityPill}>
                  <Text style={styles.amenityPillText}>{amenity}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Services</Text>
          <Pressable style={styles.servicesCard} onPress={goToServices}>
            <View>
              <Text style={styles.servicesCardTitle}>{profile.services.length} services available</Text>
              {selectedCount > 0 ? (
                <Text style={styles.servicesCardSubtitle}>
                  {selectedCount} selected · KSh {cartTotal}
                </Text>
              ) : (
                <Text style={styles.servicesCardSubtitle}>
                  {groupServicesByCategory(profile.services).length} categories
                </Text>
              )}
            </View>
            <View style={styles.servicesCardButton}>
              <Text style={styles.servicesCardButtonText}>{selectedCount > 0 ? 'Edit' : 'See all'}</Text>
            </View>
          </Pressable>

          <Text style={styles.sectionTitle}>Staff</Text>
          {profile.staff.map((member) => (
            <Pressable
              key={member.staffId}
              style={styles.staffRow}
              onPress={() => router.push(`/business/${businessId}/staff/${member.staffId}`)}
            >
              <Avatar name={member.name} uri={member.avatarUrl} size={44} />
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{member.name}</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.staffMeta}>{member.role} ·</Text>
                  <RatingLabel rating={member.rating} textStyle={styles.staffMeta} />
                </View>
              </View>
            </Pressable>
          ))}

          <Text style={styles.sectionTitle}>Reviews</Text>
          {profile.reviews.map((review) => (
            <View key={review.reviewId} style={styles.reviewCard}>
              <View style={styles.ratingRow}>
                <Text style={styles.reviewAuthor}>{review.authorName} ·</Text>
                <RatingLabel rating={review.rating} textStyle={styles.reviewAuthor} />
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          ))}
        </View>
      </Animated.ScrollView>

      <View style={styles.fixedHeader}>
        <Animated.View style={[styles.fixedHeaderBg, headerBackgroundStyle]} />
        <View style={[styles.heroControlsRow, { paddingTop: insets.top + spacing.lg }]}>
          <Pressable style={styles.circleButton} onPress={() => router.back()} hitSlop={8}>
            <ChevronLeftIcon size={18} />
          </Pressable>
          <View style={styles.heroControlsRight}>
            <Pressable style={styles.circleButton} onPress={handleShare} hitSlop={8}>
              <ShareIcon size={18} />
            </Pressable>
            <Pressable style={styles.circleButton} onPress={() => toggleFavorite(businessId)} hitSlop={8}>
              <AnimatedFavoriteHeart filled={isFavorite} size={18} inactiveColor={colors.text.primary} />
            </Pressable>
          </View>
        </View>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {selectedCount > 0 ? (
          <Button
            label={`Continue · ${selectedCount} service${selectedCount > 1 ? 's' : ''} · KSh ${cartTotal}`}
            onPress={goToBooking}
          />
        ) : (
          <Button label="See all services" onPress={goToServices} />
        )}
      </SafeAreaView>

      <PhotoGridModal
        visible={photosGridVisible}
        title="Photos"
        images={profile.photos}
        onClose={() => setPhotosGridVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loading: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  hero: {
    width: '100%',
    aspectRatio: HERO_ASPECT_RATIO,
    backgroundColor: colors.background.tertiary,
  },
  heroScroll: {
    flex: 1,
  },
  heroImage: {
    height: '100%',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  fixedHeaderBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  heroControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  heroControlsRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBadge: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  pageBadgeText: {
    ...typography.label,
    color: colors.white,
  },
  sheet: {
    marginTop: -spacing.xl,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  name: {
    ...typography.h1,
    color: colors.text.primary,
  },
  meta: {
    ...typography.body,
    color: colors.text.secondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openText: {
    color: colors.feedback.success,
  },
  closedText: {
    color: colors.feedback.danger,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  amenityPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.background.secondary,
  },
  amenityPillText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  policyCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.card,
  },
  policyText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  aboutText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  servicesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    ...shadows.card,
  },
  servicesCardTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  servicesCardSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  servicesCardButton: {
    backgroundColor: colors.button.primaryBg,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  servicesCardButtonText: {
    ...typography.label,
    color: colors.button.primaryText,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  staffMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  reviewCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  reviewAuthor: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  reviewText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.primary,
  },
});

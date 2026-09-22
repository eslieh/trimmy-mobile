import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar } from '../../components/Avatar';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { ImageGalleryViewer } from '../../components/ImageGalleryViewer';
import { MasonryPhotoGrid } from '../../components/MasonryPhotoGrid';
import { RatingLabel } from '../../components/RatingLabel';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { getBusinessProfile } from '../../api/discovery';
import { useBookingDraftStore } from '../../store/useBookingDraftStore';
import { useCartStore } from '../../store/useCartStore';
import { groupServicesByCategory } from '../../utils/services';
import { colors, radii, spacing, typography } from '../../theme';
import type { BookingServiceLine } from '../../types/booking';
import type { BusinessProfile, BusinessProfileStaffMember } from '../../types/discovery';

type StaffTab = 'profile' | 'portfolio' | 'reviews';

// No per-staff service mapping exists in the data model (staff only have a
// role string) — the Profile tab's services list is the business's full
// menu, not services specific to this person. No per-staff review text is
// modeled either — the Reviews tab shows the business's own reviews as a
// stand-in. A real backend would need both relationships to narrow these.
export function StaffProfileScreen() {
  const router = useRouter();
  const { businessId, staffId } = useLocalSearchParams<{ businessId: string; staffId: string }>();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [tab, setTab] = useState<StaffTab>('profile');
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const cartBusinessId = useCartStore((s) => s.businessId);
  const cartQuantities = useCartStore((s) => s.quantities);
  const startBookingDraft = useBookingDraftStore((s) => s.startDraft);
  const setStaff = useBookingDraftStore((s) => s.setStaff);

  useEffect(() => {
    getBusinessProfile(businessId).then(setProfile);
  }, [businessId]);

  if (!profile) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ActivityIndicator style={styles.loading} color={colors.text.secondary} />
      </SafeAreaView>
    );
  }

  const member: BusinessProfileStaffMember | undefined = profile.staff.find((s) => s.staffId === staffId);

  if (!member) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <BackButton onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const handleBook = () => {
    const cartHasServices = cartBusinessId === businessId && Object.keys(cartQuantities).length > 0;

    if (cartHasServices) {
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
      setStaff(member.staffId, member.name);
      router.push(`/business/${businessId}/book/datetime`);
    } else {
      // No services picked yet — send them to the picker first, but carry
      // the staff preference along as a query param so it isn't lost when
      // that screen starts a fresh booking draft (see BusinessServicesScreen).
      router.push(
        `/business/${businessId}/services?preferredStaffId=${member.staffId}&preferredStaffName=${encodeURIComponent(member.name)}`,
      );
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          <Avatar name={member.name} uri={member.avatarUrl} size={88} />
          <Text style={styles.name}>{member.name}</Text>
          <Text style={styles.role}>{member.role}</Text>
          <RatingLabel rating={member.rating} reviewCount={profile.reviewCount} size={13} />
        </View>

        <SegmentedTabs
          options={[
            { key: 'profile', label: 'Profile' },
            { key: 'portfolio', label: 'Portfolio' },
            { key: 'reviews', label: 'Reviews', badge: profile.reviews.length },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'profile' ? (
          <View style={styles.tabContent}>
            <Text style={styles.bio}>{member.bio}</Text>

            {member.specialties.length > 0 ? (
              <View style={styles.pillRow}>
                {member.specialties.map((specialty) => (
                  <View key={specialty} style={styles.pill}>
                    <Text style={styles.pillText}>{specialty}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Services at {profile.name}</Text>
            {groupServicesByCategory(profile.services).map(([categoryName, services]) => (
              <View key={categoryName} style={styles.group}>
                <Text style={styles.groupTitle}>{categoryName}</Text>
                {services.map((service) => (
                  <View key={service.serviceId} style={styles.serviceRow}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.servicePrice}>KSh {service.price.amount}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {tab === 'portfolio' ? (
          <View style={styles.tabContent}>
            {member.portfolio.length > 0 ? (
              <MasonryPhotoGrid images={member.portfolio} onPressImage={setGalleryIndex} />
            ) : (
              <Text style={styles.emptyText}>No portfolio photos yet.</Text>
            )}
          </View>
        ) : null}

        {tab === 'reviews' ? (
          <View style={styles.tabContent}>
            {profile.reviews.length === 0 ? (
              <Text style={styles.emptyText}>No reviews yet.</Text>
            ) : (
              profile.reviews.map((review) => (
                <View key={review.reviewId} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>{review.authorName}</Text>
                    <RatingLabel rating={review.rating} size={12} />
                  </View>
                  <Text style={styles.reviewText}>{review.text}</Text>
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button label={`Book with ${member.name}`} onPress={handleBook} />
      </View>

      <ImageGalleryViewer
        visible={galleryIndex !== null}
        images={member.portfolio}
        initialIndex={galleryIndex ?? 0}
        onClose={() => setGalleryIndex(null)}
      />
    </SafeAreaView>
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
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  identity: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  name: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  role: {
    ...typography.body,
    color: colors.text.secondary,
  },
  tabContent: {
    gap: spacing.md,
  },
  bio: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.background.secondary,
  },
  pillText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  group: {
    gap: spacing.xs,
  },
  groupTitle: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  serviceName: {
    ...typography.body,
    color: colors.text.primary,
  },
  servicePrice: {
    ...typography.body,
    color: colors.text.secondary,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
  reviewCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
});

import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { getBusinessProfile } from '../../api/discovery';
import { BUSINESS_CATEGORIES } from '../../data/businessCategories';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import type { BusinessProfile } from '../../types/discovery';

function categoryLabel(value: string): string {
  return BUSINESS_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function groupServicesByCategory(services: BusinessProfile['services']) {
  const groups = new Map<string, BusinessProfile['services']>();
  for (const service of services) {
    const list = groups.get(service.categoryName) ?? [];
    list.push(service);
    groups.set(service.categoryName, list);
  }
  return Array.from(groups.entries());
}

export function BusinessProfileScreen() {
  const router = useRouter();
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    getBusinessProfile(businessId).then(setProfile);
  }, [businessId]);

  const handleBook = () => {
    router.push({
      pathname: '/success',
      params: {
        title: 'Booking coming soon',
        subtitle: "We're still building the booking flow — check back shortly.",
        ctaLabel: 'Done',
        nextRoute: '/discover',
      },
    });
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ActivityIndicator style={styles.loading} color={colors.text.secondary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton onPress={() => router.back()} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
          {profile.photos.map((url) => (
            <Image key={url} source={{ uri: url }} style={styles.photo} />
          ))}
        </ScrollView>

        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.meta}>{profile.categories.map(categoryLabel).join(', ')}</Text>
        <Text style={styles.meta}>
          ★ {profile.rating.toFixed(1)} ({profile.reviewCount} reviews) · {profile.address}
        </Text>

        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>{profile.description}</Text>

        <View style={styles.policyCard}>
          <Text style={styles.policyText}>{profile.depositSummary}</Text>
          <Text style={styles.policyText}>{profile.cancellationSummary}</Text>
        </View>

        <Text style={styles.sectionTitle}>Services</Text>
        {groupServicesByCategory(profile.services).map(([categoryName, services]) => (
          <View key={categoryName} style={styles.serviceGroup}>
            <Text style={styles.serviceGroupTitle}>{categoryName}</Text>
            {services.map((service) => (
              <View key={service.serviceId} style={styles.serviceRow}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceMeta}>{service.durationMinutes} min</Text>
                </View>
                <Text style={styles.servicePrice}>KSh {service.price.amount}</Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Staff</Text>
        {profile.staff.map((member) => (
          <View key={member.staffId} style={styles.staffRow}>
            <Text style={styles.staffName}>{member.name}</Text>
            <Text style={styles.staffMeta}>
              {member.role} · ★ {member.rating.toFixed(1)}
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Reviews</Text>
        {profile.reviews.map((review) => (
          <View key={review.reviewId} style={styles.reviewCard}>
            <Text style={styles.reviewAuthor}>
              {review.authorName} · ★ {review.rating}
            </Text>
            <Text style={styles.reviewText}>{review.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button label={`Book with ${profile.name}`} onPress={handleBook} />
      </View>
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
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  photoRow: {
    marginTop: spacing.md,
  },
  photo: {
    width: 260,
    height: 180,
    borderRadius: radii.lg,
    marginRight: spacing.sm,
    backgroundColor: colors.background.tertiary,
  },
  name: {
    ...typography.h1,
    color: colors.text.primary,
  },
  meta: {
    ...typography.body,
    color: colors.text.secondary,
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
  serviceGroup: {
    gap: spacing.xs,
  },
  serviceGroupTitle: {
    ...typography.label,
    color: colors.text.secondary,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  serviceMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  servicePrice: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  staffRow: {
    paddingVertical: spacing.xs,
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
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
});

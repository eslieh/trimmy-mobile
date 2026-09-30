import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { getBusinessProfile } from '../../api/discovery';
import { useBookingDraftStore } from '../../store/useBookingDraftStore';
import { useCartStore } from '../../store/useCartStore';
import { groupServicesByCategory } from '../../utils/services';
import { colors, durations, radii, shadows, spacing, springs, typography } from '../../theme';
import type { BookingServiceLine } from '../../types/booking';
import type { BusinessProfile } from '../../types/discovery';

// Add-button ↔ stepper swap crossfades (Reanimated's entering/exiting) and
// the count bumps with an overshoot spring on change, rather than either
// snapping instantly.
function ServiceQuantityControl({
  quantity,
  onAdd,
  onRemove,
}: {
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const countScale = useSharedValue(1);
  const prevQuantity = useRef(quantity);

  useEffect(() => {
    if (quantity !== prevQuantity.current) {
      countScale.value = withSequence(withSpring(1.3, springs.bouncy), withSpring(1, springs.bouncy));
      prevQuantity.current = quantity;
    }
  }, [quantity, countScale]);

  const animatedCountStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countScale.value }],
  }));

  if (quantity === 0) {
    return (
      <Animated.View entering={FadeIn.duration(durations.fast)} exiting={FadeOut.duration(durations.fast)}>
        <Pressable style={styles.addButton} onPress={onAdd} hitSlop={8}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={styles.stepper}
      entering={FadeIn.duration(durations.fast)}
      exiting={FadeOut.duration(durations.fast)}
    >
      <Pressable style={styles.stepperButton} onPress={onRemove} hitSlop={8}>
        <Text style={styles.stepperButtonText}>−</Text>
      </Pressable>
      <Animated.Text style={[styles.stepperCount, animatedCountStyle]}>{quantity}</Animated.Text>
      <Pressable style={styles.stepperButton} onPress={onAdd} hitSlop={8}>
        <Text style={styles.stepperButtonText}>+</Text>
      </Pressable>
    </Animated.View>
  );
}

// Fresha-style "pick your services" screen — everything grouped by
// category, a stepper per service, and a sticky checkout summary once
// anything is added. Reached from BusinessProfileScreen's "See all
// services" row.
export function BusinessServicesScreen() {
  const router = useRouter();
  const { businessId, preferredStaffId, preferredStaffName } = useLocalSearchParams<{
    businessId: string;
    preferredStaffId?: string;
    preferredStaffName?: string;
  }>();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  const quantities = useCartStore((s) => s.quantities);
  const cartBusinessId = useCartStore((s) => s.businessId);
  const addToCart = useCartStore((s) => s.add);
  const removeFromCart = useCartStore((s) => s.remove);
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

  const cartIsForThisBusiness = cartBusinessId === businessId;
  const cartQuantities = cartIsForThisBusiness ? quantities : {};
  const selectedCount = Object.values(cartQuantities).reduce((sum, q) => sum + q, 0);
  const totalAmount = profile.services.reduce(
    (sum, service) => sum + (cartQuantities[service.serviceId] ?? 0) * service.price.amount,
    0,
  );

  const handleCheckout = () => {
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

    if (preferredStaffName) {
      // Came from Staff Profile's "Book with [name]" with an empty cart —
      // the staff was already chosen, so skip asking again.
      setStaff(preferredStaffId ?? null, preferredStaffName);
      router.push(`/business/${businessId}/book/datetime`);
    } else {
      router.push(`/business/${businessId}/book/staff`);
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Services</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {profile.name}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {groupServicesByCategory(profile.services).map(([categoryName, services]) => (
          <View key={categoryName} style={styles.group}>
            <Text style={styles.groupTitle}>{categoryName}</Text>
            {services.map((service) => {
              const quantity = cartQuantities[service.serviceId] ?? 0;
              return (
                <View key={service.serviceId} style={styles.serviceRow}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceMeta}>
                      {service.durationMinutes} min · KSh {service.price.amount}
                    </Text>
                  </View>

                  <ServiceQuantityControl
                    quantity={quantity}
                    onAdd={() => addToCart(businessId, service.serviceId)}
                    onRemove={() => removeFromCart(businessId, service.serviceId)}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {selectedCount > 0 ? (
        <View style={styles.footer}>
          <View style={styles.footerSummary}>
            <Text style={styles.footerCount}>
              {selectedCount} service{selectedCount > 1 ? 's' : ''}
            </Text>
            <Text style={styles.footerTotal}>KSh {totalAmount}</Text>
          </View>
          <Button label="Continue" onPress={handleCheckout} style={styles.footerButton} />
        </View>
      ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
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
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    gap: spacing.md,
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
    marginTop: 2,
  },
  addButton: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  addButtonText: {
    ...typography.label,
    color: colors.text.primary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    ...typography.label,
    color: colors.white,
    lineHeight: 18,
  },
  stepperCount: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    minWidth: 16,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    ...shadows.card,
  },
  footerSummary: {
    gap: 2,
  },
  footerCount: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  footerTotal: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  footerButton: {
    flex: 1,
    maxWidth: 180,
  },
});

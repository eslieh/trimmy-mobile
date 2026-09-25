import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenLayout } from '../../components/AuthScreenLayout';
import { Button } from '../../components/Button';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { BUSINESS_CATEGORIES } from '../../data/businessCategories';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import type { WeeklyHours } from '../../types/business';

const TOTAL_STEPS = 11;

const DAY_LABELS: { key: keyof WeeklyHours; label: string }[] = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

function categoryLabel(value: string): string {
  return BUSINESS_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function ReviewPublishScreen() {
  const router = useRouter();
  const business = useBusinessOnboardingStore((s) => s.business);
  const services = useBusinessOnboardingStore((s) => s.services);
  const serviceCategories = useBusinessOnboardingStore((s) => s.serviceCategories);
  const invitations = useBusinessOnboardingStore((s) => s.invitations);
  const submitReviewPublish = useBusinessOnboardingStore((s) => s.submitReviewPublish);
  const isSubmitting = useBusinessOnboardingStore((s) => s.isSubmitting);
  const error = useBusinessOnboardingStore((s) => s.error);
  const setOwnedBusiness = useOwnedBusinessStore((s) => s.setOwnedBusiness);
  const setActiveMode = useOwnedBusinessStore((s) => s.setActiveMode);

  const [publish, setPublish] = useState(false);

  if (!business) {
    return null;
  }

  const missing: string[] = [];
  if (!business.workingHours) missing.push('Working hours');
  if (services.length === 0) missing.push('At least one service');
  if (!business.policies) missing.push('Deposit & cancellation policy');
  if (business.paymentDestination?.verificationStatus !== 'verified') missing.push('A verified payment destination');
  const canPublish = missing.length === 0;

  const openDays = business.workingHours
    ? DAY_LABELS.filter(({ key }) => business.workingHours![key]).length
    : 0;

  const paymentSummary = (() => {
    const dest = business.paymentDestination;
    if (!dest) return 'Not set';
    if (dest.type === 'mpesa_till') return `M-Pesa Till ${dest.tillNumber}`;
    if (dest.type === 'mpesa_paybill') return `M-Pesa Paybill ${dest.paybillNumber}`;
    return `${dest.bankName} · ${dest.bankAccountNumber}`;
  })();

  const handleContinue = async () => {
    // The store keeps the error for the inline message — stay on this step.
    try {
      await submitReviewPublish(publish && canPublish);
    } catch {
      return;
    }

    if (publish && canPublish) {
      // canPublish guarantees workingHours is set (checked in `missing` above).
      setOwnedBusiness({
        businessId: business.businessId,
        name: business.name,
        teamMode: business.teamMode ?? 'solo',
        workingHours: business.workingHours!,
      });
      setActiveMode('business');
    }

    router.push({
      pathname: '/success',
      params: publish && canPublish
        ? {
            title: "You're live!",
            subtitle: 'Your business is now visible on the Trimyy marketplace.',
            ctaLabel: 'Done',
            nextRoute: '/today',
          }
        : {
            title: 'Saved as draft',
            subtitle: "Your business setup is saved. Publish anytime from here when you're ready.",
            ctaLabel: 'Done',
            nextRoute: '/get-started',
          },
    });
  };

  return (
    <AuthScreenLayout
      title="Review & publish"
      subtitle="Double check everything looks right, then publish when you're ready."
      progress={11 / TOTAL_STEPS}
      onBack={() => router.back()}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label={isSubmitting ? 'Saving…' : 'Finish'} disabled={isSubmitting} onPress={handleContinue} />
        </>
      }
    >
      <View style={styles.card}>
        {business.photos && business.photos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
            {business.photos.map((photo) => (
              <Image key={photo.photoId} source={{ uri: photo.url }} style={styles.photoThumb} />
            ))}
          </ScrollView>
        ) : null}
        <Text style={styles.businessName}>{business.name}</Text>
        <Text style={styles.businessMeta}>{business.categories.map(categoryLabel).join(', ')}</Text>
        <Text style={styles.businessMeta}>{business.phone}</Text>
        <Text style={styles.businessMeta}>{business.location.address}</Text>
      </View>

      <SummaryRow label="Working hours" value={business.workingHours ? `Open ${openDays} days a week` : 'Not set'} />
      <SummaryRow
        label="Services"
        value={
          services.length > 0
            ? `${services.length} service${services.length === 1 ? '' : 's'} across ${serviceCategories.length} categor${serviceCategories.length === 1 ? 'y' : 'ies'}`
            : 'Not set'
        }
      />
      <SummaryRow
        label="Policy"
        value={
          business.policies
            ? `${business.policies.deposit.required ? 'Deposit required' : 'No deposit'} · ${business.policies.cancellation.freeCancellationHours}h free cancellation`
            : 'Not set'
        }
      />
      <SummaryRow label="Payment" value={paymentSummary} />
      <SummaryRow
        label="Team"
        value={
          business.teamMode === 'team'
            ? `Team · ${invitations.length} invited`
            : business.teamMode === 'solo'
              ? 'Just me'
              : 'Not set'
        }
      />

      {!canPublish ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Finish these before publishing:</Text>
          {missing.map((item) => (
            <Text key={item} style={styles.warningItem}>
              · {item}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.publishRow}>
        <View style={styles.publishText}>
          <Text style={styles.publishTitle}>Publish to marketplace</Text>
          <Text style={styles.publishSubtitle}>
            {canPublish
              ? 'Make your business visible to customers right away.'
              : 'Complete the missing steps above to publish.'}
          </Text>
        </View>
        <Pressable
          disabled={!canPublish}
          onPress={() => setPublish((current) => !current)}
          style={[styles.toggle, publish && canPublish && styles.toggleOn, !canPublish && styles.toggleDisabled]}
        >
          <Text style={[styles.toggleText, publish && canPublish && styles.toggleTextOn]}>
            {publish && canPublish ? 'On' : 'Off'}
          </Text>
        </Pressable>
      </View>
    </AuthScreenLayout>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.card,
  },
  photoRow: {
    marginBottom: spacing.sm,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    marginRight: spacing.sm,
    backgroundColor: colors.background.tertiary,
  },
  businessName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  businessMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  summaryLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  summaryValue: {
    ...typography.body,
    color: colors.text.secondary,
    flexShrink: 1,
    textAlign: 'right',
  },
  warningCard: {
    borderRadius: radii.lg,
    backgroundColor: '#FEF2F2',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  warningTitle: {
    ...typography.bodyMedium,
    color: colors.feedback.danger,
  },
  warningItem: {
    ...typography.caption,
    color: colors.feedback.danger,
  },
  publishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    ...shadows.card,
  },
  publishText: {
    flex: 1,
    marginRight: spacing.md,
  },
  publishTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  publishSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  toggle: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.pill.unselectedBg,
  },
  toggleOn: {
    backgroundColor: colors.pill.selectedBg,
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleText: {
    ...typography.bodyMedium,
    color: colors.pill.unselectedText,
  },
  toggleTextOn: {
    color: colors.pill.selectedText,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
  },
});

import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRightIcon } from '../../components/icons/ChevronRightIcon';
import { ClockIcon } from '../../components/icons/ClockIcon';
import { ImageIcon } from '../../components/icons/ImageIcon';
import { InfoIcon } from '../../components/icons/InfoIcon';
import { ListIcon } from '../../components/icons/ListIcon';
import { ShieldIcon } from '../../components/icons/ShieldIcon';
import { WalletIcon } from '../../components/icons/WalletIcon';
import { useBusinessOnboardingStore } from '../../store/useBusinessOnboardingStore';
import { BUSINESS_CATEGORIES } from '../../data/businessCategories';
import { colors, radii, shadows, spacing, typography } from '../../theme';

function categoryLabel(value: string): string {
  return BUSINESS_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

type Row = {
  key: string;
  label: string;
  icon: ReactNode;
  onPress?: () => void;
};

// The business-owner app's "Business" tab root — reads straight from
// useBusinessOnboardingStore (not useOwnedBusinessStore's slim projection),
// so this only has real data when the owned business came from an actual
// trip through onboarding (or the dev-seed helper, which now populates
// both stores — see devSeed.ts).
export function ManageBusinessScreen() {
  const router = useRouter();
  const business = useBusinessOnboardingStore((s) => s.business);

  if (!business) {
    return <SafeAreaView style={styles.flex} edges={['top']} />;
  }

  const rows: Row[] = [
    {
      key: 'services',
      label: 'Services',
      icon: <ListIcon size={20} color={colors.text.secondary} />,
      onPress: () => router.push('/manage-business/services'),
    },
    {
      key: 'hours',
      label: 'Working hours',
      icon: <ClockIcon size={20} color={colors.text.secondary} />,
      onPress: () => router.push('/business-hours?mode=edit'),
    },
    {
      key: 'policies',
      label: 'Deposit & cancellation policy',
      icon: <ShieldIcon size={20} color={colors.text.secondary} />,
      onPress: () => router.push('/business-policies?mode=edit'),
    },
    {
      key: 'info',
      label: 'Business info',
      icon: <InfoIcon size={20} color={colors.text.secondary} />,
      onPress: () => router.push('/manage-business/info'),
    },
    {
      key: 'payment',
      label: 'Payment destination',
      icon: <WalletIcon size={20} color={colors.text.secondary} />,
      onPress: () => router.push('/business-payment?mode=edit'),
    },
    {
      key: 'photos',
      label: 'Photos',
      icon: <ImageIcon size={20} color={colors.text.secondary} />,
      onPress: () => router.push('/manage-business/photos'),
    },
  ];

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage business</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identityCard}>
          <Text style={styles.businessName}>{business.name}</Text>
          <Text style={styles.businessMeta}>{business.categories.map(categoryLabel).join(', ')}</Text>
        </View>

        <View style={styles.group}>
          {rows.map((row, index) => (
            <Pressable
              key={row.key}
              style={[styles.row, index === rows.length - 1 && styles.rowLast]}
              onPress={row.onPress}
              disabled={!row.onPress}
            >
              {row.icon}
              <Text style={[styles.rowLabel, !row.onPress && styles.rowLabelDisabled]}>{row.label}</Text>
              {row.onPress ? <ChevronRightIcon size={18} color={colors.text.tertiary} /> : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.primary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  identityCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.card,
  },
  businessName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  businessMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  group: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  rowLabelDisabled: {
    color: colors.text.tertiary,
  },
});

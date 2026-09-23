import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BackButton } from '../../components/BackButton';
import { Input } from '../../components/Input';
import { ChevronRightIcon } from '../../components/icons/ChevronRightIcon';
import { UsersIcon } from '../../components/icons/UsersIcon';
import { useCustomersStore } from '../../store/useCustomersStore';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { colors, radii, shadows, spacing, typography } from '../../theme';

// Reached from Manage Business's "Customers" row. Read-only browse/search
// over useCustomersStore, which the walk-in/schedule flows have been
// writing to all along but nothing read back until now. Tapping a row goes
// to CustomerDetailScreen (contact card, Call, "New appointment" prefilled,
// appointment history).
export function CustomersScreen() {
  const router = useRouter();
  const ownedBusiness = useOwnedBusinessStore((s) => s.business);
  const customers = useCustomersStore((s) => s.customers);
  const [query, setQuery] = useState('');

  const businessCustomers = useMemo(
    () => (ownedBusiness ? customers.filter((c) => c.businessId === ownedBusiness.businessId) : []),
    [customers, ownedBusiness],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return businessCustomers;
    return businessCustomers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q),
    );
  }, [businessCustomers, query]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => a.name.localeCompare(b.name)), [filtered]);

  if (!ownedBusiness) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <BackButton onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Customers</Text>
      </View>

      <View style={styles.searchWrapper}>
        <Input label="Search" placeholder="Name, phone, or email" value={query} onChangeText={setQuery} />
      </View>

      {businessCustomers.length === 0 ? (
        <View style={styles.empty}>
          <UsersIcon size={40} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No customers yet</Text>
          <Text style={styles.emptyBody}>
            Customers you enter through a walk-in or scheduled appointment will show up here.
          </Text>
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyBody}>No customers match "{query}".</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {sorted.map((customer) => (
            <Pressable
              key={customer.customerId}
              style={styles.row}
              onPress={() => router.push(`/customers/${customer.customerId}`)}
            >
              <View style={styles.rowInfo}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerMeta} numberOfLines={1}>
                  {[customer.phone, customer.email].filter(Boolean).join(' · ') || 'No contact info'}
                </Text>
              </View>
              <ChevronRightIcon size={18} color={colors.text.tertiary} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  searchWrapper: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    ...shadows.card,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  customerName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  customerMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

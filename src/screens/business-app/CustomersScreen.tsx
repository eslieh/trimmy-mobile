import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { BackButton } from '../../components/BackButton';
import { Input } from '../../components/Input';
import { ChevronRightIcon } from '../../components/icons/ChevronRightIcon';
import { UsersIcon } from '../../components/icons/UsersIcon';
import { useCustomersStore } from '../../store/useCustomersStore';
import { getApiErrorMessage } from '../../api/client';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { useBusinessContext } from '../../hooks/useBusinessContext';

// Reached from Manage Business's "Customers" row. Browse/search the
// business's customers from the server (list-customers), which fills itself
// from bookings with a phone; the search is sent to the server (name, email,
// phone digits) after a short pause in typing. Tapping a row goes
// to CustomerDetailScreen (contact card, Call, "New appointment" prefilled,
// appointment history).
export function CustomersScreen() {
  const router = useRouter();
  const ownedBusiness = useBusinessContext();
  const customers = useCustomersStore((s) => s.customers);
  const loadCustomers = useCustomersStore((s) => s.loadCustomers);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const businessId = ownedBusiness?.businessId;
  const load = useCallback(
    (q: string) => {
      if (!businessId) return;
      setError('');
      loadCustomers(businessId, q.trim() || undefined).catch((err) =>
        setError(getApiErrorMessage(err, "Couldn't load customers.")),
      );
    },
    [businessId, loadCustomers],
  );

  // Refresh on focus (new bookings add customers)…
  const queryRef = useRef(query);
  queryRef.current = query;
  useFocusEffect(useCallback(() => load(queryRef.current), [load]));

  // …and search as you type (skipping the first run — focus already loaded).
  const typedRef = useRef(false);
  useEffect(() => {
    if (!typedRef.current) {
      typedRef.current = true;
      return;
    }
    const id = setTimeout(() => load(query), 300);
    return () => clearTimeout(id);
  }, [query, load]);

  // Already A–Z and filtered by the server.
  const sorted = useMemo(
    () => (businessId ? customers.filter((c) => c.businessId === businessId) : []),
    [customers, businessId],
  );

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

      {error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyBody}>{error}</Text>
        </View>
      ) : sorted.length === 0 && !query.trim() ? (
        <View style={styles.empty}>
          <UsersIcon size={40} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No customers yet</Text>
          <Text style={styles.emptyBody}>
            Anyone who books with a phone number — online, walk-in or scheduled — shows up here.
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
                  {customer.bookingsCount > 0
                    ? ` · ${customer.bookingsCount} visit${customer.bookingsCount === 1 ? '' : 's'}`
                    : ''}
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

import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BusinessResultCard } from '../../components/BusinessResultCard';
import { searchBusinesses } from '../../api/discovery';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { colors, spacing, typography } from '../../theme';
import { Avatar } from '../../components/Avatar';
import type { BusinessSummary } from '../../types/discovery';

export function WishlistScreen() {
  const router = useRouter();
  const businessIds = useFavoritesStore((s) => s.businessIds);
  // Signed in: the server's saved businesses and staff (/me/favorites).
  const synced = useFavoritesStore((s) => s.synced);
  const savedBusinesses = useFavoritesStore((s) => s.businesses);
  const savedStaff = useFavoritesStore((s) => s.staff);
  const [all, setAll] = useState<BusinessSummary[] | null>(null);

  // Signed out: favourites are ids on this device; look the cards up.
  useEffect(() => {
    if (!synced) searchBusinesses({}).then(setAll);
  }, [synced]);

  const favorites = synced
    ? savedBusinesses.filter((business) => businessIds.has(business.businessId))
    : (all?.filter((business) => businessIds.has(business.businessId)) ?? []);
  const loading = !synced && all === null;

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Wishlist</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color={colors.text.secondary} />
      ) : favorites.length === 0 && savedStaff.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No favourites yet — tap the heart on a business to save it here.</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.businessId}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <BusinessResultCard business={item} onPress={() => router.push(`/business/${item.businessId}`)} />
          )}
          ListFooterComponent={
            savedStaff.length > 0 ? (
              <View style={styles.staffSection}>
                <Text style={styles.sectionTitle}>Saved staff</Text>
                {savedStaff.map((member) => (
                  <Pressable
                    key={member.staffId}
                    style={styles.staffRow}
                    onPress={() => router.push(`/business/${member.businessId}/staff/${member.staffId}`)}
                  >
                    <Avatar name={member.name} uri={member.avatarUrl} size={44} />
                    <View style={styles.staffText}>
                      <Text style={styles.staffName}>{member.name}</Text>
                      <Text style={styles.staffMeta}>
                        {member.businessName} · ★ {member.rating.toFixed(1)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  staffSection: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  staffText: {
    flex: 1,
    gap: 2,
  },
  staffName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  staffMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  loading: {
    marginTop: spacing.xxxl,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  row: {
    gap: spacing.md,
  },
});

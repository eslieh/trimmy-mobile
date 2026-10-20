import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { getMyStaffServices, type MyStaffServices } from '../../api/team';
import { useAuth } from '../../contexts/AuthContext';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { switchMode } from '../../utils/switchMode';
import { AccountSection } from '../../components/AccountSection';

// Staff session's Menu tab — mirrors BusinessMenuScreen's shape (account
// identity, "Switch to browsing", Log out). No business-management rows
// here — staff don't manage the business, that's what makes this a
// different app module from (business-app), not just a filtered view of it.
export function StaffMenuScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const staffSession = useOwnedBusinessStore((s) => s.staffSession);
  // What the owner has set them up to perform (GET /me/staff-services).
  const [myServices, setMyServices] = useState<MyStaffServices | null>(null);
  const businessId = staffSession?.businessId;
  useFocusEffect(
    useCallback(() => {
      if (!businessId) return;
      getMyStaffServices(businessId)
        .then(setMyServices)
        .catch(() => setMyServices(null));
    }, [businessId]),
  );

  const displayName = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Guest' : 'Guest';

  const handleSwitchToBrowsing = () => switchMode(router, 'customer', { message: 'Switching to browsing…' });


  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        <Text style={styles.name}>{displayName}</Text>
        {staffSession ? <Text style={styles.business}>{staffSession.businessName}</Text> : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {myServices ? (
          <View style={styles.group}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>
                My services{myServices.allServices ? ' · every service' : ''}
              </Text>
            </View>
            {myServices.services.length === 0 ? (
              <View style={[styles.row, styles.rowLast]}>
                <Text style={styles.serviceMeta}>None yet — ask the owner to add the services you perform.</Text>
              </View>
            ) : (
              myServices.services.map((service, index) => (
                <View
                  key={service.serviceId}
                  style={[styles.row, index === myServices.services.length - 1 && styles.rowLast]}
                >
                  <View style={styles.serviceInfo}>
                    <Text style={styles.rowLabel}>{service.name}</Text>
                    <Text style={styles.serviceMeta}>
                      {service.durationMinutes} min · KSh {service.price.amount.toLocaleString('en-US')}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {staffSession ? (
          <View style={styles.group}>
            <Pressable style={[styles.row, styles.rowLast]} onPress={() => router.push('/time-off')}>
              <View style={styles.serviceInfo}>
                <Text style={styles.rowLabel}>Time off</Text>
                <Text style={styles.serviceMeta}>Block out times you can't be booked</Text>
              </View>
            </Pressable>
          </View>
        ) : null}

        <Pressable style={styles.switchButton} onPress={handleSwitchToBrowsing}>
          <Text style={styles.switchButtonText}>Switch to browsing</Text>
        </Pressable>

        <AccountSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  serviceInfo: {
    flex: 1,
    gap: 2,
  },
  serviceMeta: {
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
    marginBottom: spacing.md,
  },
  name: {
    ...typography.h3,
    color: colors.text.primary,
  },
  business: {
    ...typography.body,
    color: colors.text.secondary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  switchButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.button.primaryBg,
    ...shadows.raised,
  },
  switchButtonText: {
    ...typography.button,
    color: colors.button.primaryText,
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
  },
  logoutLabel: {
    color: colors.feedback.danger,
  },
});

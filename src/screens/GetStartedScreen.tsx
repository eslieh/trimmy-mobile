import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../components/Button';
import { PendingInvitations } from '../components/PendingInvitations';
import { authApi } from '../api/auth';
import { useOwnedBusinessStore } from '../store/useOwnedBusinessStore';
import { restoreOwnedBusiness } from '../utils/restoreOwnedBusiness';
import { showApiError } from '../utils/showApiError';
import type { MyBusiness } from '../api/types';
import { useBusinessOnboardingStore } from '../store/useBusinessOnboardingStore';
import { nextSetupRoute } from '../utils/restoreOwnedBusiness';
import { colors, radii, shadows, spacing, typography } from '../theme';

// Lands here after signup and login. Resolves the "what kind of user is
// this" question from reference/TASKS.md: the businesses they already own
// or work at (GET /me/businesses) open straight into the right app; a
// pending team invite comes next (accepting it adds a workplace here);
// otherwise offer to enroll a business or continue as a customer.
export function GetStartedScreen() {
  const router = useRouter();
  // An unfinished setup restored from the server after login.
  const business = useBusinessOnboardingStore((s) => s.business);
  const draft = business?.status === 'draft' ? business : null;

  const [workplaces, setWorkplaces] = useState<MyBusiness[]>([]);
  const setActiveMode = useOwnedBusinessStore((s) => s.setActiveMode);
  const setStaffSession = useOwnedBusinessStore((s) => s.setStaffSession);

  const loadWorkplaces = useCallback(() => {
    authApi
      .listMyBusinesses()
      .then((list) => setWorkplaces(list.filter((b) => b.status === 'published')))
      .catch(() => setWorkplaces([]));
  }, []);

  useEffect(() => {
    loadWorkplaces();
  }, [loadWorkplaces]);

  const openWorkplace = async (workplace: MyBusiness) => {
    if (workplace.role === 'owner') {
      try {
        // Usually already restored after login; make sure before switching.
        if (!useOwnedBusinessStore.getState().business) await restoreOwnedBusiness();
      } catch (err) {
        showApiError("Couldn't open your business", err);
        return;
      }
      const owned = useOwnedBusinessStore.getState().business;
      if (!owned) return;
      setActiveMode('business');
      router.dismissAll();
      router.replace(owned.teamMode === 'solo' ? '/today' : '/earnings');
      return;
    }
    if (!workplace.staffId) return;
    setStaffSession({
      businessId: workplace.businessId,
      businessName: workplace.name,
      staffId: workplace.staffId,
      role: workplace.role,
    });
    const frontDesk = workplace.role === 'front_desk';
    setActiveMode(frontDesk ? 'front_desk' : 'staff');
    router.dismissAll();
    router.replace(frontDesk ? '/front-desk/today' : '/staff/today');
  };


  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Welcome to Trimyy</Text>
        <Text style={styles.subtitle}>Let's get you to the right place.</Text>

        {workplaces.map((workplace) => (
          <View key={`${workplace.businessId}:${workplace.role}`} style={styles.card}>
            <Text style={styles.cardTitle}>{workplace.name}</Text>
            <Text style={styles.cardBody}>
              {workplace.role === 'owner'
                ? 'Your business'
                : `You work here as ${workplace.role === 'staff' ? 'staff' : 'front desk'}`}
            </Text>
            <Button
              label={
                workplace.role === 'owner'
                  ? 'Open business'
                  : workplace.role === 'front_desk'
                    ? 'Open front desk'
                    : 'Open my schedule'
              }
              onPress={() => openWorkplace(workplace)}
              style={styles.enrollButton}
            />
          </View>
        ))}

        {/* Accepting adds the workplace above. */}
        <PendingInvitations onAccepted={loadWorkplaces} />

        {draft ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Finish setting up {draft.name}</Text>
            <Text style={styles.cardBody}>Pick up where you left off — your progress is saved.</Text>
            <Button
              label="Continue setup"
              onPress={() => router.push(nextSetupRoute(draft.onboardingStep, draft.teamMode))}
              style={styles.enrollButton}
            />
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Own a business?</Text>
            <Text style={styles.cardBody}>List your business on Trimyy and start taking bookings today.</Text>
            <Button
              label="Enroll your business today"
              onPress={() => router.push('/business-name')}
              style={styles.enrollButton}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Continue browsing"
          variant="secondary"
          onPress={() => {
            router.dismissAll();
            router.replace('/explore');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    gap: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardBody: {
    ...typography.body,
    color: colors.text.secondary,
  },
  enrollButton: {
    marginTop: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
});

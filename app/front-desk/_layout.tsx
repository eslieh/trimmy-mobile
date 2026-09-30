import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { CalendarIcon } from '../../src/components/icons/CalendarIcon';
import { ListIcon } from '../../src/components/icons/ListIcon';
import { UserIcon } from '../../src/components/icons/UserIcon';
import { UsersIcon } from '../../src/components/icons/UsersIcon';
import { Button } from '../../src/components/Button';
import { getApiErrorMessage } from '../../src/api/client';
import { useFrontDeskStore } from '../../src/store/useFrontDeskStore';
import { useOwnedBusinessStore } from '../../src/store/useOwnedBusinessStore';
import { colors, spacing, typography } from '../../src/theme';

// Front desk's tab shell (F1–F3): the whole business's day and calendar,
// customers, and a menu with the unassigned / refunds-owed queues. It
// reuses the owner's screens, which read the business through
// hooks/useBusinessContext — for front desk that's the public profile,
// loaded here before any tab renders. A real folder (not a route group) for
// the same reason as app/staff: distinct /front-desk/* paths.
export default function FrontDeskLayout() {
  const staffSession = useOwnedBusinessStore((s) => s.staffSession);
  const profile = useFrontDeskStore((s) => s.profile);
  const load = useFrontDeskStore((s) => s.load);
  const [error, setError] = useState('');

  const businessId = staffSession?.businessId;
  const ready = !!profile && profile.businessId === businessId;

  const loadProfile = () => {
    if (!businessId) return;
    setError('');
    load(businessId).catch((err) => setError(getApiErrorMessage(err, "Couldn't load the business.")));
  };

  useEffect(() => {
    if (!ready) loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, ready]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        {error ? (
          <>
            <Text style={styles.error}>{error}</Text>
            <Button label="Try again" variant="secondary" onPress={loadProfile} />
          </>
        ) : (
          <ActivityIndicator color={colors.text.secondary} />
        )}
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tab.active,
        tabBarInactiveTintColor: colors.tab.inactive,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarBackground: () => <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />,
      }}
    >
      <Tabs.Screen
        name="today"
        options={{ title: 'Today', tabBarIcon: ({ color }) => <ListIcon size={22} color={String(color)} /> }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: 'Calendar', tabBarIcon: ({ color }) => <CalendarIcon size={22} color={String(color)} /> }}
      />
      <Tabs.Screen
        name="customers"
        options={{ title: 'Customers', tabBarIcon: ({ color }) => <UsersIcon size={22} color={String(color)} /> }}
      />
      <Tabs.Screen
        name="menu"
        options={{ title: 'Menu', tabBarIcon: ({ color }) => <UserIcon size={22} color={String(color)} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
    backgroundColor: colors.background.primary,
  },
  error: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'transparent',
  },
  tabBarItem: {
    paddingTop: spacing.sm,
  },
});

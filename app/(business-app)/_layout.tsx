import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { BusinessIcon } from '../../src/components/icons/BusinessIcon';
import { CalendarIcon } from '../../src/components/icons/CalendarIcon';
import { ChartIcon } from '../../src/components/icons/ChartIcon';
import { ListIcon } from '../../src/components/icons/ListIcon';
import { UserIcon } from '../../src/components/icons/UserIcon';
import { colors, spacing } from '../../src/theme';

// Business-owner session's tab shell — same docked, blurred tab bar as the
// customer (tabs) shell (see that file's comment for why it's docked, not
// floating). Five tabs for the solo (S1) pass: Today (what's happening right
// now), Calendar (month view + "+" to add a walk-in or scheduled
// appointment), Earnings (read-only revenue analytics over the same booking
// data), Business (manage services/hours/policies — its own tab, not buried
// under Menu), and Menu (account identity + "Switch to browsing" + log out).
// Appointment Detail and the Services drill-down live outside this group
// (top-level `app/appointment/[bookingId].tsx` and `app/manage-
// business/services.tsx`, same pattern as the customer side's `app/
// booking/[bookingId].tsx`) so pushing to them hides this tab bar.
export default function BusinessAppLayout() {
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
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <ListIcon size={22} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <CalendarIcon size={22} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color }) => <ChartIcon size={22} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="business"
        options={{
          title: 'Business',
          tabBarIcon: ({ color }) => <BusinessIcon size={22} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <UserIcon size={22} color={String(color)} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'transparent',
  },
  tabBarItem: {
    paddingTop: spacing.sm,
  },
});

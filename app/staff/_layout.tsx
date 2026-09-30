import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { CalendarIcon } from '../../src/components/icons/CalendarIcon';
import { ChartIcon } from '../../src/components/icons/ChartIcon';
import { ListIcon } from '../../src/components/icons/ListIcon';
import { UserIcon } from '../../src/components/icons/UserIcon';
import { colors, spacing } from '../../src/theme';

// Staff session's tab shell — same docked, blurred tab bar as the customer
// (tabs) and business-owner (business-app) shells, per explicit request to
// mirror the solo owner's structure for consistency. Four tabs: Today
// (S1 — my schedule for today), Calendar (read-only browse of my upcoming
// schedule), Earnings (S2 tracking + S3 payout request folded in, since S3
// has no O4 owner-approval counterpart built yet to justify its own tab),
// Menu (account identity + switch/log out). No "Business" tab — staff don't
// manage the business, that's the whole point of this being a separate
// module from (business-app) rather than a filtered view of it.
//
// A real (non-parenthesized) folder, not a route group — route groups are
// transparent to the URL, so a `(staff-app)/today.tsx` would resolve to the
// exact same `/today` path as `(business-app)/today.tsx` (same for
// calendar/earnings/menu), a collision that meant navigating to "/today"
// could only ever land in one of the two tab bars. `staff/today.tsx` etc.
// resolve to `/staff/today`, distinct from business-app's paths.
//
// Appointment Detail lives outside this group (top-level `app/appointment/
// [bookingId].tsx`) so pushing to it hides this tab bar, same as every
// other tab shell in this app.
export default function StaffAppLayout() {
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

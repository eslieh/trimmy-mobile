import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { BadgeIcon } from '../../src/components/icons/BadgeIcon';
import { BusinessIcon } from '../../src/components/icons/BusinessIcon';
import { CalendarIcon } from '../../src/components/icons/CalendarIcon';
import { ChartIcon } from '../../src/components/icons/ChartIcon';
import { ListIcon } from '../../src/components/icons/ListIcon';
import { UserIcon } from '../../src/components/icons/UserIcon';
import { useOwnedBusinessStore } from '../../src/store/useOwnedBusinessStore';
import { colors, spacing } from '../../src/theme';

// Business-owner session's tab shell — same docked, blurred tab bar as the
// customer (tabs) shell (see that file's comment for why it's docked, not
// floating). Today (what's happening right now) and Calendar (month view +
// "+" to add a walk-in or scheduled appointment) are per-shift fulfillment
// views that fit a solo owner (who IS the staff) but not a team owner
// (whose default posture is oversight, not personally running the daily
// schedule) — so for teamMode 'team' they're hidden from the tab bar via
// `href: null` rather than removed: the routes/screens stay fully working,
// reachable via BusinessMenuScreen's "Switch to staff view" row, for an
// owner who also works shifts themselves. Team is the mirror image — hidden
// for solo (nothing to manage), a visible tab for 'team' (promoted from a
// row inside Manage Business, per explicit request, since team management
// is central enough to a team business's daily operation to deserve a tab).
// Earnings and Business (manage services/hours/policies — its own tab, not
// buried under Menu) and Menu (account identity + "Switch to browsing"/
// staff view + log out) are always visible regardless of team mode.
// Appointment Detail and the Services drill-down live outside this group
// (top-level `app/appointment/[bookingId].tsx` and `app/manage-
// business/services.tsx`, same pattern as the customer side's `app/
// booking/[bookingId].tsx`) so pushing to them hides this tab bar.
export default function BusinessAppLayout() {
  const teamMode = useOwnedBusinessStore((s) => s.business?.teamMode);
  const isTeam = teamMode === 'team';

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
          href: isTeam ? null : undefined,
          tabBarIcon: ({ color }) => <ListIcon size={22} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          href: isTeam ? null : undefined,
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
        name="team"
        options={{
          title: 'Team',
          href: isTeam ? undefined : null,
          tabBarIcon: ({ color }) => <BadgeIcon size={22} color={String(color)} />,
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

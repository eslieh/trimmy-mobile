import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { SearchIcon } from '../../src/components/icons/SearchIcon';
import { HeartIcon } from '../../src/components/icons/HeartIcon';
import { CalendarIcon } from '../../src/components/icons/CalendarIcon';
import { UserIcon } from '../../src/components/icons/UserIcon';
import { colors, spacing } from '../../src/theme';

// Customer session's tab shell: Explore (unified browse + search) / Wishlist
// (favorites) / Activity / Profile. Activity and Profile are light for now
// since Phase 3 (booking) doesn't exist yet — see ActivityScreen/ProfileScreen.
//
// Docked flush to the bottom (not floating/absolute) — the frosted BlurView
// background extends through the home-indicator safe area automatically,
// same as Airbnb's bar, rather than sitting above a gap. Because it's not
// `position: absolute`, the tab navigator reserves its own layout space, so
// screens no longer need manual bottom padding for it.
export default function TabsLayout() {
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
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <SearchIcon size={22} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color, focused }) => (
            <HeartIcon size={22} color={String(color)} filled={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => <CalendarIcon size={22} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
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

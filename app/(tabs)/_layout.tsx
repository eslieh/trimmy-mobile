import { Tabs } from 'expo-router';
import { HomeIcon } from '../../src/components/icons/HomeIcon';
import { SearchIcon } from '../../src/components/icons/SearchIcon';
import { CalendarIcon } from '../../src/components/icons/CalendarIcon';
import { UserIcon } from '../../src/components/icons/UserIcon';
import { colors } from '../../src/theme';

// Customer session's tab shell (reference/customer.md's Discover/Appointments/
// Profile tabs). Activity and Profile are light for now since Phase 3
// (booking) doesn't exist yet — see ActivityScreen/ProfileScreen.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tab.active,
        tabBarInactiveTintColor: colors.tab.inactive,
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon size={22} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <SearchIcon size={22} color={String(color)} />,
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

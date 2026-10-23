import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getNotifications } from '../utils/notificationsModule';
import { useFocusEffect, useRouter } from 'expo-router';
import { BellIcon } from './icons/BellIcon';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationsStore } from '../store/useNotificationsStore';
import { colors, fontFamily, radii } from '../theme';

// Header bell for every app mode's first tab (Explore, Today, Earnings for
// team owners, staff/front-desk Today), opening the shared inbox. The badge
// is refreshed whenever the screen comes into focus and when a push arrives
// while the app is open. Renders nothing when signed out.
export function NotificationBell() {
  const router = useRouter();
  const { user } = useAuth();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const refreshUnreadCount = useNotificationsStore((s) => s.refreshUnreadCount);

  useFocusEffect(
    useCallback(() => {
      if (user) refreshUnreadCount();
    }, [user, refreshUnreadCount]),
  );

  useEffect(() => {
    if (!user) return;
    const subscription = getNotifications()?.addNotificationReceivedListener(() => refreshUnreadCount());
    return () => subscription?.remove();
  }, [user, refreshUnreadCount]);

  if (!user) return null;

  const label = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <Pressable
      style={styles.button}
      onPress={() => router.push('/notifications')}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
    >
      <BellIcon size={18} color={colors.brand.pink} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.accentSoft,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 3,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text.primary,
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  badgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.white,
  },
});

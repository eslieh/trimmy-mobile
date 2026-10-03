import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import type { Href } from 'expo-router';
import { registerPushToken, unregisterPushToken } from '../api/notifications';

// Push notifications (BK-41). Registration runs after login for every role
// (AuthContext) and is undone on logout. Needs the EAS project id in
// app.json (extra.eas.projectId, set by `eas init`); without it Expo can't
// issue a token, so registration is skipped.

// Show pushes as banners while the app is open too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let registeredToken: string | null = null;

export async function registerForPushNotifications(): Promise<void> {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return;

    if (Platform.OS === 'android') {
      // Needed before the permission prompt appears on Android 13+.
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Bookings',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    let { granted, canAskAgain } = await Notifications.getPermissionsAsync();
    if (!granted && canAskAgain) ({ granted } = await Notifications.requestPermissionsAsync());
    if (!granted) return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerPushToken(token, Platform.OS === 'ios' ? 'ios' : 'android');
    registeredToken = token;
  } catch {
    // Push is a nice-to-have: simulators without push, no network, a
    // rejected token — none of these should block the app.
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  if (!registeredToken) return;
  const token = registeredToken;
  registeredToken = null;
  await unregisterPushToken(token).catch(() => {});
}

// Where a tapped notification goes, from its data.type (see
// reference/api/auth.json#register-push-token).
export function routeForNotification(data: Record<string, unknown>): Href | null {
  const bookingId = typeof data.bookingId === 'string' ? data.bookingId : null;
  switch (data.type) {
    case 'booking_confirmed':
    case 'booking_cancelled_by_business':
    case 'booking_reminder_24h':
    case 'booking_reminder_2h':
      return bookingId ? `/booking/${bookingId}` : null; // the customer's view
    case 'booking_assigned':
      return bookingId ? `/appointment/${bookingId}` : null; // staff's view
    case 'payout_responded':
    case 'wallet_adjusted': // a tip / bonus / deduction / advance from the owner
      return '/staff/earnings';
    case 'day_summary_submitted':
      return typeof data.date === 'string' ? `/day-summary?date=${data.date}` : '/day-summary';
    default:
      return null;
  }
}

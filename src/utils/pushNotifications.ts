import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { Href } from 'expo-router';
import { registerPushToken, unregisterPushToken } from '../api/notifications';
import { getNotifications } from './notificationsModule';
import { isRealtimeConnected } from '../realtime/status';
import { canUseMode, useOwnedBusinessStore } from '../store/useOwnedBusinessStore';

// Push notifications (BK-41). Registration runs after login for every role
// (AuthContext) and is undone on logout — only while PUSH_NOTIFICATIONS_ENABLED
// (config/env.ts), so the app doesn't ask for permission before push works. Needs the EAS project id in
// app.json (extra.eas.projectId, set by `eas init`); without it Expo can't
// issue a token, so registration is skipped.

// While the app is open the live stream already shows an in-app toast for
// the same notification, so the system banner only appears when the stream
// is down.
getNotifications()?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: !isRealtimeConnected(),
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let registeredToken: string | null = null;

export async function registerForPushNotifications(): Promise<void> {
  // Null while push is off or in Expo Go (see utils/notificationsModule.ts).
  const Notifications = getNotifications();
  if (!Notifications) return;
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

// Where a tapped notification (push or inbox row) goes, from its data.type
// (see reference/api/auth.json#register-push-token). The owner-side and
// invitation types are requested with the inbox (#list-notifications).
export function routeForNotification(data: Record<string, unknown>): Href | null {
  const bookingId = typeof data.bookingId === 'string' ? data.bookingId : null;
  switch (data.type) {
    case 'booking_confirmed':
    case 'booking_cancelled_by_business':
    case 'booking_rescheduled_by_business':
    case 'booking_payment_failed':
    case 'booking_hold_expired':
    case 'booking_refund_due':
    case 'booking_refunded':
    case 'booking_no_show':
    case 'booking_completed': // the receipt; the detail screen is where they leave a review
    case 'booking_reminder_24h':
    case 'booking_reminder_2h':
      return bookingId ? `/booking/${bookingId}` : null; // the customer's view
    case 'booking_assigned':
    case 'booking_cancelled_for_staff':
      return bookingId ? `/appointment/${bookingId}` : null; // staff's view
    case 'booking_refund_owed':
      return '/manage-business/refunds'; // owner / front desk: mark it refunded there
    case 'booking_created':
    case 'booking_cancelled_by_customer':
    case 'booking_rescheduled_by_customer':
      return bookingId ? `/appointment/${bookingId}` : null; // owner / front desk view
    case 'payout_requested': // the owner's approve / reject screen (it loads the payout itself)
      return typeof data.payoutId === 'string' ? `/payouts/${data.payoutId}` : '/payouts';
    case 'team_invitation':
      return '/profile'; // PendingInvitations lists it there
    case 'review_replied':
      return '/account/reviews'; // the business answered their review
    case 'payout_responded':
    case 'wallet_adjusted': // a tip / bonus / deduction / advance from the owner
      return '/staff/earnings';
    case 'day_summary_submitted':
      return typeof data.date === 'string' ? `/day-summary?date=${data.date}` : '/day-summary';
    default:
      return null;
  }
}

// The app mode a notification belongs to, switched to before opening its
// screen so e.g. a staff member's "booking assigned" opens in the staff view.
export function applyModeForNotification(type: unknown): void {
  const store = useOwnedBusinessStore.getState();
  switch (type) {
    case 'booking_assigned':
    case 'booking_cancelled_for_staff':
    case 'payout_responded':
    case 'wallet_adjusted':
      // Their own work: the staff view if they take appointments, else the desk.
      if (store.staffSession) store.setActiveMode(canUseMode(store.staffSession, 'staff') ? 'staff' : 'front_desk');
      break;
    case 'booking_created':
    case 'booking_cancelled_by_customer':
    case 'booking_rescheduled_by_customer':
    case 'booking_refund_owed':
      // Owner first; a front desk member gets these for the business they work at.
      if (store.business) store.setActiveMode('business');
      else if (canUseMode(store.staffSession, 'front_desk')) store.setActiveMode('front_desk');
      break;
    case 'payout_requested':
    case 'day_summary_submitted':
      if (store.business) store.setActiveMode('business');
      break;
    default:
      store.setActiveMode('customer');
  }
}

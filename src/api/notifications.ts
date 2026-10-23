import { apiRequest, toQueryString } from './client';
import { mockDelay } from './mock/delay';
import { buildMockNotifications } from './mock/notificationsData';
import { USE_MOCK_NOTIFICATIONS } from '../config/env';
import type { AppNotification, NotificationPage } from '../types/notification';

// See reference/api/auth.json#register-push-token and
// #get-notification-preferences / #update-notification-preferences.

// Idempotent; if another account registers the same token (someone else
// signs in on this phone) it moves to them. 400 invalid_token if it isn't
// an Expo token.
export function registerPushToken(token: string, platform: 'ios' | 'android'): Promise<{ ok: boolean }> {
  return apiRequest('/me/push-tokens', { method: 'POST', body: { token, platform } });
}

// On logout (needs the session, so call before clearing tokens).
export function unregisterPushToken(token: string): Promise<void> {
  return apiRequest<void>(`/me/push-tokens/${encodeURIComponent(token)}`, { method: 'DELETE' });
}

// Notification settings — reference/api/auth.json#get-notification-preferences.
// Everything always lands in the in-app inbox; these choose the extra
// channels per category, plus which reminders to send.
export type NotificationChannel = 'push' | 'sms' | 'email';
export type NotificationCategory = 'bookings' | 'reminders' | 'business' | 'payouts' | 'team';
export type ChannelSwitches = Record<NotificationChannel, boolean>;

export type ReminderPreferences = {
  dayBefore: boolean;
  twoHoursBefore: boolean;
  sms: boolean;
  push: boolean;
  email: boolean;
};

export type NotificationPreferences = {
  reminders: ReminderPreferences;
  // Only the categories that apply to this person, in display order.
  categories: Partial<Record<NotificationCategory, ChannelSwitches>>;
  // Which channels can reach them at all (switched on, and they have a phone / email).
  availableChannels: ChannelSwitches;
};

export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiRequest('/me/notification-preferences');
}

// Only the fields sent change; returns the full preferences.
export function updateNotificationPreferences(patch: {
  reminders?: Partial<Pick<ReminderPreferences, 'dayBefore' | 'twoHoursBefore'>>;
  categories?: Partial<Record<NotificationCategory, Partial<ChannelSwitches>>>;
}): Promise<NotificationPreferences> {
  return apiRequest('/me/notification-preferences', { method: 'PATCH', body: patch });
}

// In-app inbox — see reference/api/auth.json#list-notifications /
// #mark-notification-read / #mark-all-notifications-read. Requested from
// the backend, not built yet, so it runs on mocks for now.

const PAGE_SIZE = 20;
let mockInbox = buildMockNotifications();

function mockUnreadCount(): number {
  return mockInbox.filter((n) => !n.readAt).length;
}

// Newest first. unreadOnly narrows the list; unreadCount always covers
// everything, so the bell badge can be refreshed from any page.
export function listNotifications(
  params: { cursor?: string | null; unreadOnly?: boolean } = {},
): Promise<NotificationPage> {
  if (USE_MOCK_NOTIFICATIONS) {
    const all = params.unreadOnly ? mockInbox.filter((n) => !n.readAt) : mockInbox;
    const start = params.cursor ? Number(params.cursor) : 0;
    const end = start + PAGE_SIZE;
    return mockDelay({
      notifications: all.slice(start, end),
      unreadCount: mockUnreadCount(),
      nextCursor: end < all.length ? String(end) : null,
    });
  }
  const qs = toQueryString([
    ['cursor', params.cursor],
    ['unread', params.unreadOnly ? 'true' : undefined],
    ['limit', PAGE_SIZE],
  ]);
  return apiRequest<NotificationPage>(`/me/notifications${qs ? `?${qs}` : ''}`);
}

// Cheap enough to call on every focus of a screen showing the bell.
export function getUnreadNotificationCount(): Promise<{ unreadCount: number }> {
  if (USE_MOCK_NOTIFICATIONS) return mockDelay({ unreadCount: mockUnreadCount() }, 150);
  return apiRequest('/me/notifications/unread-count');
}

// Idempotent; returns the new unread count.
export function markNotificationRead(notificationId: string): Promise<{ unreadCount: number }> {
  if (USE_MOCK_NOTIFICATIONS) {
    const now = new Date().toISOString();
    mockInbox = mockInbox.map((n) => (n.notificationId === notificationId && !n.readAt ? { ...n, readAt: now } : n));
    return mockDelay({ unreadCount: mockUnreadCount() }, 150);
  }
  return apiRequest(`/me/notifications/${notificationId}/read`, { method: 'POST' });
}

// Clears one from the inbox (swipe to delete); returns the new unread count.
export function deleteNotification(notificationId: string): Promise<{ unreadCount: number }> {
  if (USE_MOCK_NOTIFICATIONS) {
    mockInbox = mockInbox.filter((n) => n.notificationId !== notificationId);
    return mockDelay({ unreadCount: mockUnreadCount() }, 150);
  }
  return apiRequest(`/me/notifications/${notificationId}`, { method: 'DELETE' });
}

// Sends the signed-in user a test notification through the whole pipeline
// (inbox, live stream, push when on) — POST /me/notifications/test. In mock
// mode it just makes one up; the caller feeds it to receiveNotification.
let mockTestSequence = 0;
export function sendTestNotification(): Promise<AppNotification> {
  if (USE_MOCK_NOTIFICATIONS) {
    mockTestSequence += 1;
    const notification: AppNotification = {
      notificationId: `ntf_mock_test_${mockTestSequence}`,
      type: mockTestSequence % 2 ? 'booking_created' : 'payout_requested',
      title: mockTestSequence % 2 ? 'New booking' : 'Payout request',
      body:
        mockTestSequence % 2
          ? 'Test: Amina W. booked Braids · Tue 21 Oct, 10:00 AM.'
          : 'Test: Wanjiku requested KSh 1,200 from their wallet.',
      data: mockTestSequence % 2 ? { bookingId: 'booking_mock_2', businessId: 'biz_mock_1' } : { payoutId: 'payout_mock_1' },
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    mockInbox = [notification, ...mockInbox];
    return mockDelay(notification, 300);
  }
  return apiRequest<AppNotification>('/me/notifications/test', { method: 'POST' });
}

export function markAllNotificationsRead(): Promise<{ unreadCount: number }> {
  if (USE_MOCK_NOTIFICATIONS) {
    const now = new Date().toISOString();
    mockInbox = mockInbox.map((n) => (n.readAt ? n : { ...n, readAt: now }));
    return mockDelay({ unreadCount: 0 }, 300);
  }
  return apiRequest('/me/notifications/read-all', { method: 'POST' });
}

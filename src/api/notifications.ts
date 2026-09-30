import { apiRequest } from './client';

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

// Only reminders are configurable — confirmations, cancellations by the
// business and other alerts are always sent. Everything starts on.
export type ReminderPreferences = {
  dayBefore: boolean;
  twoHoursBefore: boolean;
  sms: boolean;
  push: boolean;
};

export function getNotificationPreferences(): Promise<{ reminders: ReminderPreferences }> {
  return apiRequest('/me/notification-preferences');
}

// Only the fields sent change; returns the full preferences.
export function updateNotificationPreferences(
  reminders: Partial<ReminderPreferences>,
): Promise<{ reminders: ReminderPreferences }> {
  return apiRequest('/me/notification-preferences', { method: 'PATCH', body: { reminders } });
}

import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';
import { PUSH_NOTIFICATIONS_ENABLED } from '../config/env';

// expo-notifications, loaded only when push can actually work. Importing it
// at all throws in Expo Go on Android (remote notifications were removed from
// Expo Go in SDK 53), so nothing imports it at the top of a file: callers ask
// here and get null while push is off (config/env.ts) or in Expo Go, and the
// app runs without push. Development and store builds load it as normal.
let loaded: typeof NotificationsModule | null | undefined;

export function getNotifications(): typeof NotificationsModule | null {
  if (loaded !== undefined) return loaded;
  const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  loaded = PUSH_NOTIFICATIONS_ENABLED && !inExpoGo ? (require('expo-notifications') as typeof NotificationsModule) : null;
  return loaded;
}

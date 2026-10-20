import { Platform, Vibration } from 'react-native';

// A short buzz for an incoming notification. expo-haptics gives the subtle
// "notification" tap on iPhone; it's a native module, so on a dev client
// built before it was added (or any failure) this falls back to the core
// Vibration API, which every device has. Throttled so a burst of events
// buzzes once.
let lastBuzz = 0;
let haptics: typeof import('expo-haptics') | null | undefined;

function loadHaptics() {
  if (haptics === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      haptics = require('expo-haptics') as typeof import('expo-haptics');
    } catch {
      haptics = null;
    }
  }
  return haptics;
}

export function buzzForNotification(): void {
  const now = Date.now();
  if (now - lastBuzz < 1500) return;
  lastBuzz = now;
  const module = loadHaptics();
  if (module) {
    module.notificationAsync(module.NotificationFeedbackType.Success).catch(() => fallback());
    return;
  }
  fallback();
}

function fallback(): void {
  try {
    // iOS ignores the duration (one standard buzz); Android gets a short tick.
    Vibration.vibrate(Platform.OS === 'android' ? 40 : 400);
  } catch {
    // No vibrator: nothing to do.
  }
}

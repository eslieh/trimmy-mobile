import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { WifiOffIcon } from './icons/WifiOffIcon';
import { useRealtimeStatus } from '../realtime/status';
import { colors, durations, radii, spacing, typography } from '../theme';

const BAR_HEIGHT = 32;
// A blip (a tunnel, a lift, the stream rotating) shouldn't flash the banner.
const GRACE_MS = 4000;

// "Your device is offline." in a black band over the status bar while the
// live connection is down, with the app nudged down beneath it (rounded top
// corners, like a sheet) rather than covered. It goes once the connection is
// back. Wraps the whole app at the root.
export function OfflineBanner({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const lostAt = useRealtimeStatus((s) => s.lostAt);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (lostAt === null) {
      setOffline(false);
      return;
    }
    const timer = setTimeout(() => setOffline(true), Math.max(0, GRACE_MS - (Date.now() - lostAt)));
    return () => clearTimeout(timer);
  }, [lostAt]);

  const shift = useSharedValue(0);
  useEffect(() => {
    shift.value = withTiming(offline ? BAR_HEIGHT : 0, { duration: durations.base });
  }, [offline, shift]);
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: shift.value }],
    borderTopLeftRadius: shift.value > 0 ? radii.lg : 0,
    borderTopRightRadius: shift.value > 0 ? radii.lg : 0,
  }));

  return (
    <View style={styles.root}>
      {offline ? (
        <View
          style={[styles.bar, { height: insets.top + BAR_HEIGHT, paddingTop: insets.top }]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <StatusBar style="light" />
          <WifiOffIcon size={16} />
          <Text style={styles.text}>Your device is offline.</Text>
        </View>
      ) : null}
      <Animated.View style={[styles.content, contentStyle]}>{children}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  text: {
    ...typography.bodyMedium,
    color: colors.white,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.background.primary,
  },
});

import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { WifiOffIcon } from './icons/WifiOffIcon';
import { useRealtimeStatus } from '../realtime/status';
import { colors, spacing, typography } from '../theme';

const TEXT_ROW = 24;
// A blip (a tunnel, a lift, the stream rotating) shouldn't flash the banner.
const GRACE_MS = 4000;

// "Your device is offline." in a black band laid over the top of the app
// (status bar included) while the live connection is down. It sits above
// everything and moves nothing: the text is just below the notch / status
// bar, so it's always readable. Slides away once the connection is back.
// Wraps the whole app at the root.
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

  return (
    <View style={styles.root}>
      {children}
      {offline ? (
        <Animated.View
          entering={SlideInUp.duration(220)}
          exiting={SlideOutUp.duration(220)}
          pointerEvents="none"
          style={[styles.bar, { paddingTop: insets.top, height: insets.top + TEXT_ROW }]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <StatusBar style="light" />
          <View style={styles.row}>
            <WifiOffIcon size={13} />
            <Text style={styles.text} numberOfLines={1}>
              Your device is offline.
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1500,
    elevation: 1500,
    backgroundColor: colors.black,
  },
  row: {
    height: TEXT_ROW,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: 4,
  },
  text: {
    ...typography.label,
    fontSize: 12,
    lineHeight: 16,
    color: colors.white,
  },
});

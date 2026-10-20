import { useCallback, useEffect, useRef } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { usePathname, useRouter } from 'expo-router';
import { useNotificationsStore } from '../store/useNotificationsStore';
import { useToastStore } from '../store/useToastStore';
import { buzzForNotification } from '../utils/haptics';
import { notificationIcon } from '../utils/notificationIcon';
import { applyModeForNotification, routeForNotification } from '../utils/pushNotifications';
import { colors, durations, radii, shadows, spacing, springs, typography } from '../theme';

const VISIBLE_MS = 4000;
const HIDDEN_Y = -160;

// A banner that drops in from the top when a notification arrives while the
// app is open, with a short buzz. Tap opens it (like tapping the push would);
// swipe up or wait 4s to dismiss. One Animated.View driven on the UI thread
// — no blur or layout animation — so it stays smooth on low-end phones.
// Mounted once at the root, above every screen.
export function InAppToastHost() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const toast = useToastStore((s) => s.current);
  const next = useToastStore((s) => s.next);
  const markReadNow = useNotificationsStore((s) => s.markReadNow);

  const translateY = useSharedValue(HIDDEN_Y);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiding = useRef(false);

  const clearTimer = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  };

  const hide = useCallback(() => {
    if (hiding.current) return;
    hiding.current = true;
    clearTimer();
    if (reduceMotion) {
      translateY.value = HIDDEN_Y;
      next();
      return;
    }
    translateY.value = withTiming(HIDDEN_Y, { duration: durations.fast }, (finished) => {
      if (finished) scheduleOnRN(next);
    });
  }, [next, reduceMotion, translateY]);

  useEffect(() => {
    if (!toast) return;
    // Already looking at the inbox: it updates in place, no banner needed.
    if (pathname === '/notifications') {
      next();
      return;
    }
    hiding.current = false;
    buzzForNotification();
    AccessibilityInfo.announceForAccessibility(`${toast.title}. ${toast.body}`);
    translateY.value = reduceMotion ? 0 : withSpring(0, springs.glide);
    hideTimer.current = setTimeout(hide, VISIBLE_MS);
    return clearTimer;
    // Re-run per toast, not when the route changes under a visible one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.key]);

  const handlePress = () => {
    if (!toast) return;
    const notification = toast.notification;
    hide();
    if (!notification) {
      router.push('/notifications');
      return;
    }
    markReadNow(notification.notificationId);
    const route = routeForNotification({ ...notification.data, type: notification.type });
    if (!route) return;
    applyModeForNotification(notification.type);
    router.push(route);
  };

  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onUpdate((e) => {
      translateY.value = Math.min(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY < -30 || e.velocityY < -500) {
        scheduleOnRN(hide);
      } else {
        translateY.value = withSpring(0, springs.glide);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!toast) return null;

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + spacing.sm }]}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.toast, animatedStyle]}>
          <Pressable
            style={styles.content}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={`${toast.title}. ${toast.body}`}
            accessibilityHint="Opens the notification"
          >
            <View style={styles.icon}>{notificationIcon(toast.type, 18)}</View>
            <View style={styles.text}>
              <Text style={styles.title} numberOfLines={1}>
                {toast.title}
              </Text>
              <Text style={styles.body} numberOfLines={2}>
                {toast.body}
              </Text>
            </View>
          </Pressable>
          <View style={styles.grabber} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
    elevation: 1000,
  },
  toast: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.primary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
    ...shadows.raised,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.label,
    color: colors.text.primary,
  },
  body: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  grabber: {
    alignSelf: 'center',
    width: 32,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.sm,
    backgroundColor: colors.border.default,
  },
});

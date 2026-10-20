import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAppTransitionStore } from '../store/useAppTransitionStore';
import { colors, spacing, typography } from '../theme';

// The logo over everything while the app restores or switches modes, so
// nobody sees a screen from the old mode, or a half-loaded one, flash past.
// Plain fades on the UI thread: cheap on any phone. Mounted once at the root.
export function AppTransitionOverlay() {
  const message = useAppTransitionStore((s) => s.message);
  if (message === null) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(120)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
      accessibilityViewIsModal
      accessibilityLabel={message}
    >
      <Image source={require('../../assets/splash-icon.png')} style={styles.logo} resizeMode="contain" />
      <View style={styles.status}>
        <ActivityIndicator color={colors.brand.purple} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    elevation: 2000,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  logo: {
    width: 240,
    height: 240,
  },
  status: {
    position: 'absolute',
    bottom: '22%',
    alignItems: 'center',
    gap: spacing.md,
  },
  message: {
    ...typography.body,
    color: colors.text.secondary,
  },
});

import { Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import type { BottomTabNavigationOptions } from 'expo-router/build/react-navigation/bottom-tabs';
import { colors, spacing } from '../theme';

// How every tab bar (customer, business, staff, front desk) looks, docked flush
// to the bottom.
// - iOS: frosted blur through the home-indicator area.
// - Android: solid white, no shadow. expo-blur doesn't blur on Android by
//   default, so the bar was a see-through grey strip, and the default
//   elevation drew a smudged shadow through it.
export const tabBarChrome: Pick<BottomTabNavigationOptions, 'tabBarStyle' | 'tabBarItemStyle' | 'tabBarBackground'> =
  Platform.OS === 'ios'
    ? {
        tabBarStyle: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: 'rgba(0,0,0,0.08)',
          backgroundColor: 'transparent',
        },
        tabBarItemStyle: { paddingTop: spacing.sm },
        tabBarBackground: () => <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />,
      }
    : {
        tabBarStyle: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border.default,
          backgroundColor: colors.white,
          elevation: 0,
          shadowOpacity: 0,
        },
        // A little lift, not the iOS 8px: room for the label at large font sizes.
        tabBarItemStyle: { paddingTop: 4 },
      };

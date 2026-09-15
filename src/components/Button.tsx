import React, { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, pressScale, radii, spacing, springs, typography } from '../theme';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const VARIANT_STYLES: Record<ButtonVariant, { backgroundColor: string; textColor: string; borderWidth: number; borderColor: string }> = {
  primary: {
    backgroundColor: colors.button.primaryBg,
    textColor: colors.button.primaryText,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  secondary: {
    backgroundColor: colors.button.secondaryBg,
    textColor: colors.button.secondaryText,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.button.secondaryBorder,
  },
};

// Airbnb-style pill button: settles into a quick spring on press rather than
// a linear opacity fade.
export function Button({ label, onPress, variant = 'primary', icon, disabled, style }: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(pressScale.default, springs.press);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.press);
  };

  const variantStyle = VARIANT_STYLES[variant];

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={disabled ? undefined : handlePressIn}
        onPressOut={disabled ? undefined : handlePressOut}
        disabled={disabled}
        style={[
          styles.base,
          {
            backgroundColor: disabled ? colors.button.disabledBg : variantStyle.backgroundColor,
            borderWidth: variantStyle.borderWidth,
            borderColor: variantStyle.borderColor,
          },
        ]}
      >
        {icon}
        <Text
          style={[
            styles.label,
            { color: disabled ? colors.button.disabledText : variantStyle.textColor },
            icon ? styles.labelWithIcon : null,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  label: {
    ...typography.button,
  },
  labelWithIcon: {
    marginLeft: spacing.sm,
  },
});

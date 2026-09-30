import { useState } from 'react';
import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, durations, radii, spacing, typography } from '../theme';

// `style` positions the outer wrapper (e.g. layout in a row), not the
// TextInput itself — that always uses styles.input — so it's typed as
// ViewStyle rather than inheriting TextInputProps' TextStyle-typed style.
interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  helperText?: string;
  style?: StyleProp<ViewStyle>;
}

// Rounded, thin-bordered field like the reference auth screen, with the
// border easing from grey to the brand purple on focus rather than snapping.
export function Input({ label, helperText, onFocus, onBlur, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focusProgress.value, [0, 1], [colors.border.default, colors.brand.purple]),
  }));

  const handleFocus: NonNullable<TextInputProps['onFocus']> = (e) => {
    setFocused(true);
    focusProgress.value = withTiming(1, { duration: durations.base });
    onFocus?.(e);
  };

  const handleBlur: NonNullable<TextInputProps['onBlur']> = (e) => {
    setFocused(false);
    focusProgress.value = withTiming(0, { duration: durations.base });
    onBlur?.(e);
  };

  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.field, animatedBorderStyle, focused && styles.fieldFocused]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.text.tertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
      </Animated.View>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  field: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    backgroundColor: colors.background.primary,
  },
  fieldFocused: {
    borderWidth: 1.5,
  },
  input: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  helperText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
});

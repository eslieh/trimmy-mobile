import { useEffect } from 'react';
import { ScrollView, Pressable, StyleSheet, Text } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, durations, radii, spacing, typography } from '../theme';

export interface SegmentedTabOption<T extends string> {
  key: T;
  label: string;
  badge?: number;
}

interface SegmentedTabsProps<T extends string> {
  options: SegmentedTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

// Horizontal pill tab bar — Business Profile (About/Services/Team/Reviews/
// Other) and Staff Profile (Profile/Portfolio/Reviews) both switch sections
// with this instead of one long scroll.
export function SegmentedTabs<T extends string>({ options, value, onChange }: SegmentedTabsProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((option) => (
        <Pill key={option.key} selected={option.key === value} onPress={() => onChange(option.key)}>
          {option.label + (option.badge !== undefined ? ` ${option.badge}` : '')}
        </Pill>
      ))}
    </ScrollView>
  );
}

// Background/text color eases between states rather than snapping, same
// treatment as Input/PhoneInput's focus-border color.
function Pill({ selected, onPress, children }: { selected: boolean; onPress: () => void; children: string }) {
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: durations.base });
  }, [selected, progress]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.pill.unselectedBg, colors.pill.selectedBg]),
  }));
  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [colors.pill.unselectedText, colors.pill.selectedText]),
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.pill, animatedPillStyle]}>
        <Animated.Text style={[styles.pillText, animatedTextStyle]}>{children}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  pillText: {
    ...typography.bodyMedium,
  },
});

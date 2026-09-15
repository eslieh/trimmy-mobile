import { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, durations, radii } from '../theme';

interface StepProgressBarProps {
  progress: number;
  style?: StyleProp<ViewStyle>;
}

export function StepProgressBar({ progress, style }: StepProgressBarProps) {
  const width = useSharedValue(progress);

  useEffect(() => {
    width.value = withTiming(progress, { duration: durations.base });
  }, [progress, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={[styles.track, style]}>
      <Animated.View style={[styles.fill, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.background.tertiary,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.tab.active,
  },
});

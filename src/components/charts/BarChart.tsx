import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, durations, radii, spacing, typography } from '../../theme';

interface BarChartProps {
  data: { label: string; amount: number }[];
  height?: number;
  color?: string;
}

const CHART_HEIGHT = 140;

// Plain View bars, not SVG — a rectangle scaled by height needs nothing
// SVG gives you. Kept for the revenue-trend chart; DonutChart is the one
// that actually needs arc math.
export function BarChart({ data, height = CHART_HEIGHT, color = colors.brand.purple }: BarChartProps) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <View style={styles.container}>
      <View style={[styles.barsRow, { height }]}>
        {data.map((point, index) => (
          <Bar key={index} amount={point.amount} maxAmount={maxAmount} height={height} color={color} />
        ))}
      </View>
      <View style={styles.labelsRow}>
        {data.map((point, index) => (
          <Text key={index} style={styles.label} numberOfLines={1}>
            {point.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

interface BarProps {
  amount: number;
  maxAmount: number;
  height: number;
  color: string;
}

function Bar({ amount, maxAmount, height, color }: BarProps) {
  const progress = useSharedValue(0);
  const targetHeight = Math.max((amount / maxAmount) * height, amount > 0 ? 4 : 0);

  useEffect(() => {
    progress.value = withTiming(targetHeight, { duration: durations.slow });
  }, [progress, targetHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: progress.value,
  }));

  return (
    <View style={styles.barColumn}>
      <Animated.View style={[styles.bar, { backgroundColor: color }, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: radii.sm,
    borderTopRightRadius: radii.sm,
  },
  labelsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  label: {
    flex: 1,
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

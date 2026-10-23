import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, typography } from '../../theme';

export type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

// Multi-segment ring via the standard SVG strokeDasharray/offset trick —
// each segment is just a dash of the right length, rotated -90deg so the
// first one starts at 12 o'clock like every other donut chart.
export function DonutChart({ segments, size = 140, strokeWidth = 20, centerLabel, centerValue }: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let cumulative = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.background.tertiary}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {total > 0
            ? segments.map((segment, index) => {
                const fraction = segment.value / total;
                const dash = fraction * circumference;
                const offset = -cumulative;
                cumulative += dash;
                return (
                  <Circle
                    key={index}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={segment.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={offset}
                    strokeLinecap="butt"
                    fill="none"
                  />
                );
              })
            : null}
        </G>
      </Svg>
      {centerLabel || centerValue ? (
        <View style={styles.center} pointerEvents="none">
          {centerValue ? <Text style={styles.centerValue}>{centerValue}</Text> : null}
          {centerLabel ? <Text style={styles.centerLabel}>{centerLabel}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    ...typography.h3,
    color: colors.text.primary,
  },
  centerLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
});

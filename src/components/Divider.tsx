import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface DividerProps {
  label?: string;
}

export function Divider({ label = 'OR' }: DividerProps) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
  },
  label: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginHorizontal: spacing.md,
  },
});

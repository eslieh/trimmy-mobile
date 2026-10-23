import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { colors, spacing, typography } from '../../theme';

interface SectionHeaderProps {
  title: string;
  // A pink link on the right, e.g. "See all".
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}

// A bold section title with an optional pink action, used down every
// customer screen so sections read the same way.
export function SectionHeader({ title, action, style }: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title}>{title}</Text>
      {action ? (
        <Pressable style={styles.action} onPress={action.onPress} hitSlop={8}>
          <Text style={styles.actionText}>{action.label}</Text>
          <ChevronRightIcon size={14} color={colors.brand.pink} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    ...typography.label,
    color: colors.brand.pink,
  },
});

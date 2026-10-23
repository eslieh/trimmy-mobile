import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';
import { SheetModal } from './SheetModal';
import type { SwipeAction } from './SwipeRow';

interface QuickActionsSheetProps {
  title: string | null; // null: closed
  actions: SwipeAction[];
  onClose: () => void;
}

// The long-press menu: the same quick actions a row offers when swiped,
// as a list, for anyone who doesn't know (or can't do) the swipe.
export function QuickActionsSheet({ title, actions, onClose }: QuickActionsSheetProps) {
  return (
    <SheetModal visible={title !== null} onRequestClose={onClose} onBackdropPress={onClose} sheetStyle={styles.sheet}>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {actions.map((action) => (
        <Pressable
          key={action.key}
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          onPress={() => {
            onClose();
            action.onPress();
          }}
        >
          <Text style={[styles.label, action.color === colors.feedback.danger && styles.danger]}>{action.label}</Text>
        </Pressable>
      ))}
      <Pressable style={({ pressed }) => [styles.row, styles.cancel, pressed && styles.pressed]} onPress={onClose}>
        <Text style={styles.cancelLabel}>Close</Text>
      </Pressable>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
  },
  pressed: {
    backgroundColor: colors.background.secondary,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  danger: {
    color: colors.feedback.danger,
  },
  cancel: {
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
    borderRadius: 0,
  },
  cancelLabel: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
});

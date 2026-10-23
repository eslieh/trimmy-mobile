import { useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { colors, radii, spacing, typography } from '../../theme';
import { tapHaptic } from '../../utils/haptics';

export interface SwipeAction {
  key: string;
  label: string;
  color: string; // the button's background
  onPress: () => void;
}

interface SwipeRowProps {
  actions: SwipeAction[];
  children: ReactNode;
  radius?: number; // match the row's own corners
}

const ACTION_WIDTH = 84;

// Swipe a row left to reveal its quick actions (check in, mark done,
// remove…). Tapping one closes the row and runs it. No actions, no swiping:
// the row renders as is. Plain views on the UI thread, nothing animated per
// frame in JS, so it stays smooth on low-end phones.
export function SwipeRow({ actions, children, radius = radii.lg }: SwipeRowProps) {
  const ref = useRef<SwipeableMethods>(null);
  if (!actions.length) return <>{children}</>;

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={1.6}
      rightThreshold={40}
      overshootRight={false}
      onSwipeableWillOpen={tapHaptic}
      containerStyle={{ borderRadius: radius }}
      renderRightActions={() => (
        <>
          {actions.map((action, i) => (
            <Pressable
              key={action.key}
              accessibilityRole="button"
              style={[
                styles.action,
                { backgroundColor: action.color },
                i === actions.length - 1 && { borderTopRightRadius: radius, borderBottomRightRadius: radius },
              ]}
              onPress={() => {
                ref.current?.close();
                action.onPress();
              }}
            >
              <Text style={styles.label} numberOfLines={2}>{action.label}</Text>
            </Pressable>
          ))}
        </>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: {
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.white,
    textAlign: 'center',
  },
});

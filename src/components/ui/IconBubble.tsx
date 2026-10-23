import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme';

interface IconBubbleProps {
  children: ReactNode;
  size?: number;
  // selected: solid pink (the icon inside should be white).
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

// An icon in a soft pink circle: the app's small "touch" for categories,
// menu rows and empty states. Flat (no shadow), cheap to draw.
export function IconBubble({ children, size = 48, selected, style }: IconBubbleProps) {
  return (
    <View
      style={[
        styles.bubble,
        { width: size, height: size, borderRadius: size / 2 },
        selected && styles.selected,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.accentSoft,
  },
  selected: {
    backgroundColor: colors.brand.pink,
  },
});

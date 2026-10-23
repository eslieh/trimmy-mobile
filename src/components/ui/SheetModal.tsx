import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

interface SheetModalProps {
  visible: boolean;
  onRequestClose?: () => void; // Android back
  onBackdropPress?: () => void; // a tap outside the sheet
  overlayStyle?: StyleProp<ViewStyle>;
  sheetStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
}

// The app's bottom sheet: a dimmed backdrop and a sheet pinned to the bottom,
// laid out by the screen's own overlay / sheet styles. On top of the plain
// Modal it:
// - rises with the keyboard on both platforms (Android is edge-to-edge, so the
//   window never resizes for the keyboard; padding does the job instead);
// - keeps its buttons clear of the home indicator and Android's 3-button nav
//   bar, using the real bottom inset (read outside the Modal: inside, iOS
//   reports 0).
export function SheetModal({ visible, onRequestClose, onBackdropPress, overlayStyle, sheetStyle, children }: SheetModalProps) {
  const insets = useSafeAreaInsets();
  const sheetPadding = (StyleSheet.flatten(sheetStyle)?.paddingBottom as number | undefined) ?? 0;
  const paddingBottom = Math.max(sheetPadding, insets.bottom + spacing.lg);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <Pressable style={[styles.overlay, overlayStyle, styles.flex]} onPress={onBackdropPress}>
          <Pressable style={[sheetStyle, { paddingBottom }]} onPress={(e) => e.stopPropagation()}>
            {children}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
});

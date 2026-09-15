import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, typography } from '../theme';

interface OtpInputProps {
  length?: number;
  value: string;
  onChangeText: (value: string) => void;
}

// Boxed OTP entry backed by a single invisible TextInput, so digit-by-digit
// focus/backspace/paste all fall out of native text-input behavior for free.
export function OtpInput({ length = 6, value, onChangeText }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.row}>
      {digits.map((digit, i) => {
        const isActive = value.length === i;
        return (
          <View key={i} style={[styles.box, isActive && styles.boxActive]}>
            <Text style={styles.digit}>{digit}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChangeText(text.replace(/[^0-9]/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hiddenInput}
        autoFocus
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  boxActive: {
    borderWidth: 1.5,
    borderColor: colors.brand.purple,
  },
  digit: {
    ...typography.h2,
    color: colors.text.primary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
});

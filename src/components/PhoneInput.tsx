import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AsYouType } from 'libphonenumber-js';
import { CountryPicker } from './CountryPicker';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { Country } from '../data/countries';
import { colors, durations, radii, spacing, typography } from '../theme';

interface PhoneInputProps {
  label: string;
  helperText?: string;
  country: Country;
  onCountryChange: (country: Country) => void;
  value: string;
  onChangeText: (rawDigits: string) => void;
}

// Country-code pill + national-number field, formatted live via
// libphonenumber-js's AsYouType for the selected country.
export function PhoneInput({ label, helperText, country, onCountryChange, value, onChangeText }: PhoneInputProps) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const formatted = useMemo(() => new AsYouType(country.iso2 as never).input(value), [value, country.iso2]);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focusProgress.value, [0, 1], [colors.border.default, colors.brand.purple]),
  }));

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.field, animatedBorderStyle, focused && styles.fieldFocused]}>
        <Pressable style={styles.countryButton} onPress={() => setPickerVisible(true)} hitSlop={4}>
          <Text style={styles.flag}>{country.flag}</Text>
          <Text style={styles.dialCode}>+{country.dialCode}</Text>
          <ChevronDownIcon size={12} />
        </Pressable>

        <View style={styles.divider} />

        <TextInput
          style={styles.input}
          value={formatted}
          onChangeText={(text) => onChangeText(text.replace(/[^0-9]/g, ''))}
          keyboardType="phone-pad"
          placeholder="555 000 0000"
          placeholderTextColor={colors.text.tertiary}
          onFocus={() => {
            setFocused(true);
            focusProgress.value = withTiming(1, { duration: durations.base });
          }}
          onBlur={() => {
            setFocused(false);
            focusProgress.value = withTiming(0, { duration: durations.base });
          }}
        />
      </Animated.View>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <CountryPicker
        visible={pickerVisible}
        selected={country}
        onSelect={onCountryChange}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    backgroundColor: colors.background.primary,
  },
  fieldFocused: {
    borderWidth: 1.5,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.lg,
    paddingVertical: spacing.lg,
  },
  flag: {
    fontSize: 20,
  },
  dialCode: {
    ...typography.bodyLarge,
    color: colors.text.primary,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: spacing.md,
    marginHorizontal: spacing.md,
    backgroundColor: colors.border.default,
  },
  input: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    flex: 1,
    paddingVertical: spacing.lg,
    paddingRight: spacing.lg,
  },
  helperText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
});

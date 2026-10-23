import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button } from './Button';
import { colors, radii, spacing, typography } from '../theme';

interface DatePickerFieldProps {
  label: string;
  value: string; // 'YYYY-MM-DD'
  onChange: (value: string) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  // Stretch to share a row with another field (the From / To pairs). Off by default:
  // flex: 1 in a column (a sheet, a form) collapses the field.
  grow?: boolean;
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplay(value: string): string {
  return parseDateKey(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Same iOS/Android split as TimePickerField, mode="date" instead of "time"
// — used by EarningsScreen's custom From/To range pickers.
export function DatePickerField({ label, value, onChange, maximumDate, minimumDate, grow }: DatePickerFieldProps) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(() => parseDateKey(value));

  const handleOpen = () => {
    setDraft(parseDateKey(value));
    setVisible(true);
  };

  const handleAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    setVisible(false);
    if (event.type === 'set' && selected) {
      onChange(formatDateKey(selected));
    }
  };

  const handleIosChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) setDraft(selected);
  };

  return (
    <>
      <Pressable style={[styles.field, grow && styles.grow]} onPress={handleOpen} hitSlop={4}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{formatDisplay(value)}</Text>
      </Pressable>

      {visible && Platform.OS === 'android' && (
        <DateTimePicker
          value={draft}
          mode="date"
          display="default"
          title={label}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={handleAndroidChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
          <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <DateTimePicker
                value={draft}
                mode="date"
                display="spinner"
                // Light, dark text: readable whatever the phone's theme (Expo Go ignores the app's).
                themeVariant="light"
                textColor={colors.text.primary}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                onChange={handleIosChange}
              />
              <Button
                label="Done"
                onPress={() => {
                  onChange(formatDateKey(draft));
                  setVisible(false);
                }}
                style={styles.doneButton}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.primary,
  },
  grow: {
    flex: 1,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  value: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  doneButton: {
    marginTop: spacing.md,
  },
});

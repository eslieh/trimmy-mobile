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
export function DatePickerField({ label, value, onChange, maximumDate, minimumDate }: DatePickerFieldProps) {
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
      <Pressable style={styles.field} onPress={handleOpen} hitSlop={4}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{formatDisplay(value)}</Text>
      </Pressable>

      {visible && Platform.OS === 'android' && (
        <DateTimePicker
          value={draft}
          mode="date"
          display="default"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={handleAndroidChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
          <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              <DateTimePicker
                value={draft}
                mode="date"
                display="spinner"
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
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.primary,
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

import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button } from './Button';
import { colors, radii, spacing, typography } from '../theme';

interface TimePickerFieldProps {
  label: string;
  value: string; // "HH:mm"
  onChange: (value: string) => void;
}

function parseTime(value: string): Date {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// iOS renders the picker inline inside a bottom sheet with an explicit
// "Done" (spinner mode has no natural dismiss event). Android's picker is
// already a native modal dialog, so it's shown/hidden imperatively instead.
export function TimePickerField({ label, value, onChange }: TimePickerFieldProps) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(() => parseTime(value));

  const handleOpen = () => {
    setDraft(parseTime(value));
    setVisible(true);
  };

  const handleAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    setVisible(false);
    if (event.type === 'set' && selected) {
      onChange(formatTime(selected));
    }
  };

  const handleIosChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) setDraft(selected);
  };

  return (
    <>
      <Pressable style={styles.field} onPress={handleOpen} hitSlop={4}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </Pressable>

      {visible && Platform.OS === 'android' && (
        <DateTimePicker value={draft} mode="time" display="default" onChange={handleAndroidChange} />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
          <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              <DateTimePicker value={draft} mode="time" display="spinner" onChange={handleIosChange} />
              <Button
                label="Done"
                onPress={() => {
                  onChange(formatTime(draft));
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

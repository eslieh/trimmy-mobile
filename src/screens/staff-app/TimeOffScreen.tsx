import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { DatePickerField } from '../../components/DatePickerField';
import { Input } from '../../components/Input';
import { TimePickerField } from '../../components/TimePickerField';
import { CloseIcon } from '../../components/icons/CloseIcon';
import { createTimeOff, deleteTimeOff, listTimeOff, type TimeOff } from '../../api/timeOff';
import { getApiErrorMessage } from '../../api/client';
import { useOwnedBusinessStore } from '../../store/useOwnedBusinessStore';
import { showApiError } from '../../utils/showApiError';
import { colors, radii, spacing, typography } from '../../theme';
import { SheetModal } from '../../components/ui/SheetModal';
import { useRefreshControl } from '../../hooks/useRefreshControl';
import { SwipeRow } from '../../components/ui/SwipeRow';

const LOOK_AHEAD_DAYS = 60; // the API allows 62 per call

function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function describe(block: TimeOff): string {
  if (block.allDay) return block.until !== block.date ? `${dayLabel(block.date)} – ${dayLabel(block.until)}` : dayLabel(block.date);
  return `${dayLabel(block.date)} · ${block.start}–${block.end === '24:00' ? 'close' : block.end}`;
}

// S4: blocks of time someone can't be booked. The staff app opens it for
// "me" (Menu → Time off); the owner (Team → member) and front desk (tap a
// name on the day grid) open it for someone else with ?staffId=&name=.
export function TimeOffScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ businessId?: string; staffId?: string; name?: string }>();
  const staffSession = useOwnedBusinessStore((s) => s.staffSession);
  const businessId = params.businessId ?? staffSession?.businessId;
  const staffId = params.staffId ?? staffSession?.staffId;
  const forSomeoneElse = Boolean(params.staffId) && params.staffId !== staffSession?.staffId;

  const [blocks, setBlocks] = useState<TimeOff[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);

  const today = toKey(new Date());
  const [date, setDate] = useState(today);
  const [allDay, setAllDay] = useState(false);
  const [until, setUntil] = useState(today);
  const [start, setStart] = useState('12:00');
  const [end, setEnd] = useState('13:00');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    if (!businessId || !staffId) return;
    const last = new Date();
    last.setDate(last.getDate() + LOOK_AHEAD_DAYS);
    return listTimeOff(businessId, today, toKey(last), staffId)
      .then((list) => {
        setBlocks(list);
        setLoadError('');
      })
      .catch((err) => setLoadError(getApiErrorMessage(err, "Couldn't load time off.")));
  }, [businessId, staffId, today]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const refreshControl = useRefreshControl(load);

  const openSheet = () => {
    setDate(today);
    setUntil(today);
    setAllDay(false);
    setStart('12:00');
    setEnd('13:00');
    setReason('');
    setFormError('');
    setSheetVisible(true);
  };

  const handleSave = async () => {
    if (!businessId || !staffId || saving) return;
    if (!allDay && start >= end) {
      setFormError('The end time must be after the start.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const note = reason.trim() || undefined;
      await createTimeOff(
        businessId,
        staffId,
        allDay
          ? { date, allDay: true, until: until > date ? until : undefined, reason: note }
          : { date, start, end, reason: note },
      );
      setSheetVisible(false);
      load();
    } catch (err) {
      // 409 has_bookings explains which bookings are in the way.
      setFormError(getApiErrorMessage(err, "Couldn't save that time off."));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (block: TimeOff) => {
    Alert.alert('Remove this time off?', describe(block), [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          deleteTimeOff(block.timeOffId)
            .then(() => setBlocks((current) => current?.filter((b) => b.timeOffId !== block.timeOffId) ?? null))
            .catch((err) => showApiError("Couldn't remove it", err));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Time off</Text>
          {forSomeoneElse && params.name ? <Text style={styles.subtitle}>{params.name}</Text> : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={refreshControl}>
        <Text style={styles.intro}>
          {forSomeoneElse ? "They won't" : "You won't"} be offered to customers or booked during time off.
        </Text>
        <Button label="Add time off" onPress={openSheet} />

        {loadError ? (
          <Text style={styles.error}>{loadError}</Text>
        ) : !blocks ? (
          <ActivityIndicator color={colors.text.secondary} />
        ) : blocks.length === 0 ? (
          <Text style={styles.empty}>No time off in the next two months.</Text>
        ) : (
          <View style={styles.group}>
            {blocks.map((block, index) => (
              // Swipe a row to remove it (same confirm as the ×).
              <SwipeRow
                key={block.timeOffId}
                radius={0}
                actions={[{ key: 'remove', label: 'Remove', color: colors.feedback.danger, onPress: () => handleRemove(block) }]}
              >
                <View style={[styles.row, index === blocks.length - 1 && styles.rowLast]}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{describe(block)}</Text>
                    <Text style={styles.rowMeta}>{block.reason || (block.allDay ? 'All day' : 'Time off')}</Text>
                  </View>
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => handleRemove(block)}
                    hitSlop={6}
                    accessibilityLabel={`Remove time off, ${describe(block)}`}
                  >
                    <CloseIcon size={14} />
                  </Pressable>
                </View>
              </SwipeRow>
            ))}
          </View>
        )}
      </ScrollView>

      <SheetModal visible={sheetVisible} onRequestClose={() => setSheetVisible(false)} onBackdropPress={() => !saving && setSheetVisible(false)} overlayStyle={styles.overlay} sheetStyle={styles.sheet}>
        <Text style={styles.sheetTitle}>Add time off</Text>
        <View style={styles.switchRow}>
          <Text style={styles.rowLabel}>Whole day</Text>
          <Switch value={allDay} onValueChange={setAllDay} />
        </View>
        <DatePickerField
          label={allDay ? 'From' : 'Date'}
          value={date}
          minimumDate={new Date()}
          onChange={(value) => {
            setDate(value);
            if (until < value) setUntil(value);
          }}
        />
        {allDay ? (
          <DatePickerField label="Until" value={until} onChange={setUntil} />
        ) : (
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <TimePickerField label="From" value={start} onChange={setStart} />
            </View>
            <View style={styles.timeField}>
              <TimePickerField label="To" value={end} onChange={setEnd} />
            </View>
          </View>
        )}
        <Input label="Reason (optional)" value={reason} onChangeText={setReason} placeholder="e.g. Doctor" />
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        <Button label={saving ? 'Saving…' : 'Save'} disabled={saving} onPress={handleSave} />
      </SheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  intro: {
    ...typography.body,
    color: colors.text.secondary,
  },
  empty: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  error: {
    ...typography.caption,
    color: colors.feedback.danger,
  },
  group: {
    borderRadius: radii.lg,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.lg,
  },
  row: {
    backgroundColor: colors.background.secondary, // covers the swipe actions
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  rowMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  sheetTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeField: {
    flex: 1,
  },
});

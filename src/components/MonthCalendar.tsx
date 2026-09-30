import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { colors, radii, spacing, typography } from '../theme';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface MonthCalendarProps {
  month: Date; // any date within the displayed month
  onChangeMonth: (next: Date) => void;
  selectedDate: string | null; // 'YYYY-MM-DD'
  onSelectDate: (date: string) => void;
  markedDates: Set<string>; // dates with at least one appointment
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Airbnb-style month grid — dot under any day that has an appointment,
// tap a day to select it. Deliberately no multi-month scroll/swipe, just
// prev/next chevrons; this is a "glance at the month" view, not a full
// calendar app.
export function MonthCalendar({ month, onChangeMonth, selectedDate, onSelectDate, markedDates }: MonthCalendarProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();
  const todayKey = toDateKey(new Date());

  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      <View style={styles.monthRow}>
        <Pressable
          style={styles.navButton}
          onPress={() => onChangeMonth(new Date(year, monthIndex - 1, 1))}
          hitSlop={8}
        >
          <ChevronLeftIcon size={16} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable
          style={styles.navButton}
          onPress={() => onChangeMonth(new Date(year, monthIndex + 1, 1))}
          hitSlop={8}
        >
          <ChevronRightIcon size={16} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={i} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (day === null) return <View key={index} style={styles.cell} />;

          const dateKey = toDateKey(new Date(year, monthIndex, day));
          const selected = dateKey === selectedDate;
          const isToday = dateKey === todayKey;
          const marked = markedDates.has(dateKey);

          return (
            <Pressable key={index} style={styles.cell} onPress={() => onSelectDate(dateKey)}>
              <View style={[styles.dayCircle, selected && styles.dayCircleSelected]}>
                <Text
                  style={[
                    styles.dayNumber,
                    isToday && !selected && styles.dayNumberToday,
                    selected && styles.dayNumberSelected,
                  ]}
                >
                  {day}
                </Text>
              </View>
              <View style={[styles.dot, marked && styles.dotVisible]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const CELL_SIZE = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  monthLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    ...typography.caption,
    color: colors.text.tertiary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL_SIZE,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: colors.brand.purple,
  },
  dayNumber: {
    ...typography.body,
    color: colors.text.primary,
  },
  dayNumberToday: {
    color: colors.brand.purple,
    fontFamily: typography.bodyMedium.fontFamily,
  },
  dayNumberSelected: {
    color: colors.white,
    fontFamily: typography.bodyMedium.fontFamily,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  dotVisible: {
    backgroundColor: colors.brand.purple,
  },
});

import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Avatar } from './Avatar';
import { BOOKING_STATUS_COLOR } from '../utils/bookingStatus';
import { colors, radii, spacing, typography } from '../theme';
import type { Booking } from '../types/booking';

// One day as staff columns × time rows (F1 "live calendar") for the front
// desk: who is free when, at a glance. Columns scroll sideways (the header
// follows on the UI thread), time scrolls down. Every booking is one
// absolutely-positioned block — no cell per 15 minutes — so a full day stays
// cheap to draw on low-end phones. Tap a booking to open it, an empty spot to
// book that person at that time.

export type GridColumn = { staffId: string | null; name: string; avatarUrl?: string | null }; // null = unassigned ("Any available")
export type BlockedTime = { staffId: string; start: string; end: string; label: string }; // 'HH:mm'

const HOUR_HEIGHT = 64;
const PX_PER_MIN = HOUR_HEIGHT / 60;
const GUTTER = 52;
const HEADER_HEIGHT = 64;
const SLOT_MINUTES = 15;
const MIN_BLOCK = 22;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function toTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function hourLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 === 0 ? 12 : h % 12} ${suffix}`;
}

// Overlapping blocks in one column (only "Any available" can have them)
// share its width side by side.
function lanes(bookings: Booking[]): Map<string, { lane: number; of: number }> {
  const sorted = [...bookings].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
  const result = new Map<string, { lane: number; of: number }>();
  let group: { booking: Booking; lane: number }[] = [];
  let groupEnd = -1;
  let laneEnds: number[] = [];
  const flush = () => {
    const of = Math.max(1, laneEnds.length);
    group.forEach(({ booking, lane }) => result.set(booking.bookingId, { lane, of }));
    group = [];
    laneEnds = [];
  };
  for (const booking of sorted) {
    const start = toMinutes(booking.time);
    const end = start + booking.durationMinutes;
    if (start >= groupEnd) flush();
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    group.push({ booking, lane });
    groupEnd = Math.max(groupEnd, end);
  }
  flush();
  return result;
}

export function StaffDayGrid({
  columns,
  bookings,
  blocked = [],
  openTime,
  closeTime,
  isToday,
  onPressBooking,
  onPressSlot,
  onPressStaff,
}: {
  columns: GridColumn[];
  bookings: Booking[];
  blocked?: BlockedTime[];
  openTime: string | null; // null = closed that day
  closeTime: string | null;
  isToday: boolean;
  onPressBooking: (booking: Booking) => void;
  onPressSlot: (staffId: string | null, time: string) => void;
  onPressStaff?: (column: GridColumn) => void; // e.g. their time off
}) {
  const { width } = useWindowDimensions();
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });
  const headerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -scrollX.value }] }));

  // Two to three columns fit on a phone; more scroll sideways.
  const visible = Math.min(Math.max(columns.length, 1), 3);
  const columnWidth = Math.max(112, Math.floor((width - GUTTER) / visible));

  // The day's hours, widened to cover anything booked outside them.
  const { start, end } = useMemo(() => {
    let s = openTime ? toMinutes(openTime) : 8 * 60;
    let e = closeTime ? toMinutes(closeTime) : 20 * 60;
    for (const b of bookings) {
      s = Math.min(s, toMinutes(b.time));
      e = Math.max(e, toMinutes(b.time) + b.durationMinutes);
    }
    return { start: Math.floor(s / 60) * 60, end: Math.ceil(e / 60) * 60 };
  }, [openTime, closeTime, bookings]);
  const bodyHeight = (end - start) * PX_PER_MIN;
  const hours = useMemo(() => {
    const list: number[] = [];
    for (let m = start; m <= end; m += 60) list.push(m);
    return list;
  }, [start, end]);

  // The "now" line, moved once a minute (not every frame).
  const [nowMinutes, setNowMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  useEffect(() => {
    if (!isToday) return;
    const timer = setInterval(() => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    }, 60_000);
    return () => clearInterval(timer);
  }, [isToday]);

  const byColumn = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const key = b.staffId ?? 'unassigned';
      map.set(key, [...(map.get(key) ?? []), b]);
    }
    return map;
  }, [bookings]);

  const handleSlotPress = (staffId: string | null, locationY: number) => {
    const minutes = start + Math.floor(locationY / PX_PER_MIN / SLOT_MINUTES) * SLOT_MINUTES;
    if (openTime && closeTime && (minutes < toMinutes(openTime) || minutes >= toMinutes(closeTime))) return;
    if (isToday && minutes < nowMinutes) return;
    onPressSlot(staffId, toTime(minutes));
  };

  return (
    <ScrollView stickyHeaderIndices={[0]} contentContainerStyle={styles.scrollContent}>
      {/* Staff names: sticky at the top, following the sideways scroll. */}
      <View style={styles.headerRow}>
        <View style={styles.gutterHeader} />
        <View style={styles.headerClip}>
          <Animated.View style={[styles.headerCells, headerStyle]}>
            {columns.map((column) => (
              <Pressable
                key={column.staffId ?? 'unassigned'}
                style={[styles.headerCell, { width: columnWidth }]}
                onPress={onPressStaff && column.staffId ? () => onPressStaff(column) : undefined}
                disabled={!onPressStaff || !column.staffId}
                accessibilityRole={onPressStaff && column.staffId ? 'button' : undefined}
              >
                {column.staffId ? <Avatar name={column.name} uri={column.avatarUrl} size={28} /> : <View style={styles.anyDot} />}
                <Text style={styles.headerName} numberOfLines={1}>
                  {column.name}
                </Text>
              </Pressable>
            ))}
          </Animated.View>
        </View>
      </View>

      <View style={styles.bodyRow}>
        <View style={[styles.gutter, { height: bodyHeight }]}>
          {hours.map((m) => (
            <Text key={m} style={[styles.hourLabel, { top: (m - start) * PX_PER_MIN - 7 }]}>
              {hourLabel(m)}
            </Text>
          ))}
        </View>

        <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
          <View style={{ width: columnWidth * columns.length, height: bodyHeight }}>
            {hours.map((m) => (
              <View key={m} style={[styles.hourLine, { top: (m - start) * PX_PER_MIN }]} />
            ))}
            {openTime && closeTime ? null : (
              <View style={[styles.closedShade, { height: bodyHeight }]}>
                <Text style={styles.closedText}>Closed</Text>
              </View>
            )}

            {columns.map((column, index) => {
              const key = column.staffId ?? 'unassigned';
              const columnBookings = byColumn.get(key) ?? [];
              const placement = lanes(columnBookings);
              return (
                <Pressable
                  key={key}
                  style={[styles.column, { left: index * columnWidth, width: columnWidth, height: bodyHeight }]}
                  onPress={(e) => handleSlotPress(column.staffId, e.nativeEvent.locationY)}
                  accessibilityLabel={`${column.name}: tap an empty time to book`}
                >
                  {blocked
                    .filter((b) => b.staffId === column.staffId)
                    .map((b, i) => {
                      // An all-day block runs midnight to midnight; draw only the shown hours.
                      const from = Math.max(toMinutes(b.start), start);
                      const to = Math.min(toMinutes(b.end), end);
                      if (to <= from) return null;
                      return (
                        <View
                          key={`blocked-${i}`}
                          pointerEvents="none"
                          style={[
                            styles.blocked,
                            { top: (from - start) * PX_PER_MIN, height: Math.max((to - from) * PX_PER_MIN, MIN_BLOCK) },
                          ]}
                        >
                          <Text style={styles.blockedText} numberOfLines={1}>
                            {b.label}
                          </Text>
                        </View>
                      );
                    })}
                  {columnBookings.map((booking) => {
                    const { lane, of } = placement.get(booking.bookingId) ?? { lane: 0, of: 1 };
                    const laneWidth = (columnWidth - 6) / of;
                    const color = BOOKING_STATUS_COLOR[booking.status];
                    return (
                      <Pressable
                        key={booking.bookingId}
                        onPress={() => onPressBooking(booking)}
                        style={[
                          styles.block,
                          {
                            top: (toMinutes(booking.time) - start) * PX_PER_MIN + 1,
                            height: Math.max(booking.durationMinutes * PX_PER_MIN - 2, MIN_BLOCK),
                            left: 3 + lane * laneWidth,
                            width: laneWidth - 2,
                            borderLeftColor: color,
                          },
                          booking.status === 'completed' && styles.blockDone,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`${booking.time}, ${booking.customerName}, ${booking.services[0]?.name ?? ''}`}
                      >
                        <Text style={styles.blockTime} numberOfLines={1}>
                          {booking.time}
                        </Text>
                        <Text style={styles.blockName} numberOfLines={1}>
                          {booking.customerName}
                        </Text>
                        {booking.durationMinutes >= 40 ? (
                          <Text style={styles.blockService} numberOfLines={1}>
                            {booking.services.map((s) => s.name).join(', ')}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </Pressable>
              );
            })}

            {isToday && nowMinutes >= start && nowMinutes <= end ? (
              <View pointerEvents="none" style={[styles.nowLine, { top: (nowMinutes - start) * PX_PER_MIN }]} />
            ) : null}
          </View>
        </Animated.ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    height: HEADER_HEIGHT,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  gutterHeader: {
    width: GUTTER,
  },
  headerClip: {
    flex: 1,
    overflow: 'hidden',
  },
  headerCells: {
    flexDirection: 'row',
  },
  headerCell: {
    height: HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
  },
  anyDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border.strong,
  },
  headerName: {
    ...typography.caption,
    color: colors.text.primary,
    maxWidth: '100%',
  },
  bodyRow: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
  },
  gutter: {
    width: GUTTER,
  },
  hourLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.tertiary,
    position: 'absolute',
    right: spacing.sm,
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
  },
  closedShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
    paddingTop: spacing.xl,
    backgroundColor: colors.background.secondary,
  },
  closedText: {
    ...typography.label,
    color: colors.text.tertiary,
  },
  column: {
    position: 'absolute',
    top: 0,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border.subtle,
  },
  block: {
    position: 'absolute',
    borderRadius: radii.sm,
    borderLeftWidth: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
  },
  blockDone: {
    opacity: 0.55,
  },
  blockTime: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.text.secondary,
  },
  blockName: {
    ...typography.label,
    fontSize: 13,
    lineHeight: 16,
    color: colors.text.primary,
  },
  blockService: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.text.secondary,
  },
  blocked: {
    position: 'absolute',
    left: 3,
    right: 3,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.background.tertiary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
  },
  blockedText: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.text.tertiary,
  },
  nowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.brand.pink,
  },
});

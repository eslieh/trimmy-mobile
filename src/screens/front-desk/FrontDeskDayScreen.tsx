import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { listTimeOff } from '../../api/timeOff';
import { NotificationBell } from '../../components/NotificationBell';
import { StaffDayGrid, type BlockedTime, type GridColumn } from '../../components/StaffDayGrid';
import { ChevronLeftIcon } from '../../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../../components/icons/ChevronRightIcon';
import { PlusIcon } from '../../components/icons/PlusIcon';
import { useBusinessContext } from '../../hooks/useBusinessContext';
import { useSyncBusinessBookings } from '../../hooks/useSyncBusinessBookings';
import { useAppointmentActions } from '../../hooks/useAppointmentActions';
import { useRefreshControl } from '../../hooks/useRefreshControl';
import { useBookingsStore } from '../../store/useBookingsStore';
import { useFrontDeskStore } from '../../store/useFrontDeskStore';
import type { WeeklyHours } from '../../types/business';
import { colors, radii, spacing, typography } from '../../theme';

const WEEKDAYS: (keyof WeeklyHours)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// The front desk's Today (F1): every bookable person as a column across the
// day, so "who's free at 3?" is one glance. Days step with the arrows.
// Cancelled bookings are left off; the grid refreshes live (see
// useSyncBusinessBookings).
export function FrontDeskDayScreen() {
  const router = useRouter();
  const business = useBusinessContext();
  const bookings = useBookingsStore((s) => s.bookings);
  const [day, setDay] = useState(() => new Date());
  const [blocked, setBlocked] = useState<BlockedTime[]>([]);

  const dateKey = toKey(day);
  const isToday = dateKey === toKey(new Date());
  const { refresh } = useSyncBusinessBookings(business?.businessId, dateKey, dateKey);

  // Staff time off that day, drawn as greyed-out blocks (S4).
  const businessId = business?.businessId;
  // The business's hours, staff and services can change on the owner's side: refresh them
  // each time the day view comes back (one small request).
  useFocusEffect(
    useCallback(() => {
      if (businessId) useFrontDeskStore.getState().load(businessId).catch(() => {});
    }, [businessId]),
  );

  // Reloads that day's time off; the latest call wins if the day changes mid-flight.
  const timeOffRun = useRef(0);
  const loadBlocked = useCallback(async () => {
    if (!businessId) return;
    const run = ++timeOffRun.current;
    try {
      const list = await listTimeOff(businessId, dateKey, dateKey);
      if (run !== timeOffRun.current) return;
      setBlocked(
        list.map((t) => ({
          staffId: t.staffId,
          // A block from an earlier day runs from midnight; one ending later runs to midnight.
          start: t.date < dateKey ? '00:00' : t.start,
          end: t.until > dateKey ? '24:00' : t.end,
          label: t.reason || 'Time off',
        })),
      );
    } catch {
      if (run === timeOffRun.current) setBlocked([]);
    }
  }, [businessId, dateKey]);
  useFocusEffect(
    useCallback(() => {
      loadBlocked();
      return () => {
        timeOffRun.current += 1;
      };
    }, [loadBlocked]),
  );

  // Pull down: bookings, time off, and the business's staff and hours.
  const refreshControl = useRefreshControl(
    useCallback(
      () =>
        Promise.all([
          refresh(),
          loadBlocked(),
          businessId ? useFrontDeskStore.getState().load(businessId).catch(() => {}) : null,
        ]),
      [refresh, loadBlocked, businessId],
    ),
  );
  // Long-press a booking for check in / charge / no-show / cancel.
  const { openMenu, menu } = useAppointmentActions();

  const dayBookings = useMemo(
    () =>
      business
        ? bookings.filter(
            (b) => b.businessId === business.businessId && b.date === dateKey && b.status !== 'cancelled',
          )
        : [],
    [bookings, business, dateKey],
  );

  const columns = useMemo<GridColumn[]>(() => {
    const staff: GridColumn[] = (business?.staff ?? []).map((m) => ({ staffId: m.staffId, name: m.name, avatarUrl: m.avatarUrl }));
    // Bookings with someone not in the list (e.g. removed since) still need a column.
    for (const b of dayBookings) {
      if (b.staffId && !staff.some((c) => c.staffId === b.staffId)) staff.push({ staffId: b.staffId, name: b.staffName });
    }
    if (dayBookings.some((b) => !b.staffId)) staff.push({ staffId: null, name: 'Any available' });
    return staff;
  }, [business, dayBookings]);

  if (!business) return <SafeAreaView style={styles.flex} edges={['top']} />;

  const hours = business.workingHours[WEEKDAYS[day.getDay()]];
  const dayLabel = isToday
    ? 'Today'
    : day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{dayLabel}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {business.name}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <NotificationBell />
          <Pressable
            style={styles.iconButton}
            onPress={() => router.push('/walk-in')}
            hitSlop={4}
            accessibilityLabel="New walk-in"
          >
            <PlusIcon size={18} color={colors.text.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.dayNav}>
        <Pressable style={styles.iconButton} onPress={() => setDay(addDays(day, -1))} accessibilityLabel="Previous day">
          <ChevronLeftIcon size={18} />
        </Pressable>
        {isToday ? (
          <Text style={styles.dayNavLabel}>{day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
        ) : (
          <Pressable style={styles.todayPill} onPress={() => setDay(new Date())}>
            <Text style={styles.todayPillText}>Back to today</Text>
          </Pressable>
        )}
        <Pressable style={styles.iconButton} onPress={() => setDay(addDays(day, 1))} accessibilityLabel="Next day">
          <ChevronRightIcon size={18} />
        </Pressable>
      </View>

      {columns.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No one to schedule yet</Text>
          <Text style={styles.emptyBody}>Staff appear here once the owner has added them and their services.</Text>
        </View>
      ) : (
        <StaffDayGrid
          columns={columns}
          bookings={dayBookings}
          blocked={blocked}
          openTime={hours?.open ?? null}
          closeTime={hours?.close ?? null}
          isToday={isToday}
          onPressBooking={(booking) => router.push(`/appointment/${booking.bookingId}`)}
          onLongPressBooking={openMenu}
          refreshControl={refreshControl}
          onPressStaff={(column) =>
            column.staffId && router.push({
              pathname: '/time-off',
              params: { businessId: business.businessId, staffId: column.staffId, name: column.name },
            })
          }
          onPressSlot={(staffId, time) =>
            router.push({ pathname: '/schedule', params: { date: dateKey, time, ...(staffId ? { staffId } : {}) } })
          }
        />
      )}
      {menu}
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  dayNavLabel: {
    ...typography.label,
    color: colors.text.secondary,
  },
  todayPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.pill.selectedBg,
  },
  todayPillText: {
    ...typography.label,
    color: colors.pill.selectedText,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

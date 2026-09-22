import type { DayHours, WeeklyHours } from '../types/business';

const DAY_KEYS: (keyof WeeklyHours)[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const SLOT_INTERVAL_MINUTES = 30;

export type AvailableDay = {
  date: string; // 'YYYY-MM-DD'
  weekdayLabel: string; // 'Mon'
  dayNumber: number; // 24
  isOpen: boolean;
};

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function minutesToLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function hoursToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Not real availability — there's no Phase 4 bookings backend to check
// conflicts against yet, so this is purely "is the business open, and is
// there enough time left before close" based on Phase 1's working hours.
export function getUpcomingDays(workingHours: WeeklyHours, count = 7): AvailableDay[] {
  const days: AvailableDay[] = [];
  const today = new Date();

  for (let i = 0; i < count; i += 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const dayKey = DAY_KEYS[date.getDay()];
    const hours: DayHours = workingHours[dayKey];
    days.push({
      date: toDateKey(date),
      weekdayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      isOpen: hours !== null,
    });
  }

  return days;
}

export function getTimeSlots(workingHours: WeeklyHours, dateKey: string, durationMinutes: number): string[] {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const hours: DayHours = workingHours[DAY_KEYS[date.getDay()]];
  if (!hours) return [];

  const openMinutes = hoursToMinutes(hours.open);
  const closeMinutes = hoursToMinutes(hours.close);

  const now = new Date();
  const isToday = dateKey === toDateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: string[] = [];
  for (let start = openMinutes; start + durationMinutes <= closeMinutes; start += SLOT_INTERVAL_MINUTES) {
    if (isToday && start <= nowMinutes) continue;
    slots.push(minutesToLabel(start));
  }
  return slots;
}

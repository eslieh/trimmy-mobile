// Shared by the booking flow's Review/Confirmed screens and Activity's
// booking list — all three format the same 'YYYY-MM-DD' booking date key.
export function formatBookingDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatBookingDateLong(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// Combines a booking's 'YYYY-MM-DD' + 'HH:mm' into a real Date, for
// Upcoming/Past classification and chronological sorting on Activity.
export function getBookingDateTime(dateKey: string, time: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

export function isUpcomingBooking(dateKey: string, time: string): boolean {
  return getBookingDateTime(dateKey, time).getTime() >= Date.now();
}

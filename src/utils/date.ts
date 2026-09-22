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

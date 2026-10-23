import { apiRequest, toQueryString } from './client';

// See reference/api/booking.json#get-availability-days / #get-availability.
// Both public. The server accounts for working hours, each staff member's
// days and services, the business's booking settings (slot grid, buffer,
// lead time) and existing bookings. Times are business-local.

export type AvailabilityQuery = {
  serviceIds: string[]; // every service in the cart
  staffId: string | null; // null = "Any available"
};

export type AvailabilityDay = {
  date: string; // YYYY-MM-DD
  isOpen: boolean;
  hasSlots: boolean;
};

export type AvailabilitySlot = {
  time: string; // HH:MM, business local — show as-is
  startsAt: string;
  staffIds: string[]; // who's free then; only a hint when no staff was picked
};

// serviceIds is a repeated query param (?serviceIds=a&serviceIds=b).
function buildQuery(query: AvailabilityQuery, extra: [string, string][]): string {
  return toQueryString([
    ...extra,
    ...query.serviceIds.map((id): [string, string] => ['serviceIds', id]),
    ['staffId', query.staffId],
  ]);
}

export function getAvailabilityDays(
  businessId: string,
  query: AvailabilityQuery,
  days = 14,
): Promise<{ timezone: string; durationMinutes: number; days: AvailabilityDay[] }> {
  return apiRequest(`/businesses/${businessId}/availability/days?${buildQuery(query, [['days', String(days)]])}`);
}

export function getAvailability(
  businessId: string,
  date: string,
  query: AvailabilityQuery,
): Promise<{ date: string; timezone: string; durationMinutes: number; slots: AvailabilitySlot[] }> {
  return apiRequest(`/businesses/${businessId}/availability?${buildQuery(query, [['date', date]])}`);
}

import { apiRequest, toQueryString } from './client';

// Staff time off (S4) — reference/api/team.json#list-time-off /
// #create-time-off / #delete-time-off. Times are the business's local
// wall time; availability never offers or books over a block.
export type TimeOff = {
  timeOffId: string;
  staffId: string;
  staffName: string;
  date: string; // 'YYYY-MM-DD'
  until: string; // last day ('YYYY-MM-DD'); same as date unless it spans days
  start: string; // 'HH:mm'
  end: string; // 'HH:mm', '24:00' for the end of the day
  allDay: boolean;
  reason: string | null;
};

export type CreateTimeOffInput =
  | { date: string; start: string; end: string; reason?: string }
  | { date: string; allDay: true; until?: string; reason?: string };

// Owner / front desk: everyone's (or one person's with staffId); staff: their own.
// At most 62 days per call.
export function listTimeOff(businessId: string, from: string, to: string, staffId?: string): Promise<TimeOff[]> {
  const qs = toQueryString([
    ['from', from],
    ['to', to],
    ['staffId', staffId],
  ]);
  return apiRequest<{ timeOff: TimeOff[] }>(`/businesses/${businessId}/time-off?${qs}`).then((res) => res.timeOff);
}

// The person themselves, the owner or front desk. 409 has_bookings (with
// `references`) if they have bookings then: move or reassign those first.
export function createTimeOff(businessId: string, staffId: string, input: CreateTimeOffInput): Promise<TimeOff> {
  return apiRequest<TimeOff>(`/businesses/${businessId}/staff/${staffId}/time-off`, { method: 'POST', body: input });
}

export function deleteTimeOff(timeOffId: string): Promise<void> {
  return apiRequest<void>(`/time-off/${timeOffId}`, { method: 'DELETE' });
}

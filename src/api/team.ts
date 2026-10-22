import { apiRequest } from './client';
import { mockDelay } from './mock/delay';
import { USE_MOCK_API } from '../config/env';
import type { MyInvitation, TeamInvitation, TeamRole } from '../types/team';
import type { Money, WeeklyHours } from '../types/business';

// See reference/api/team.json for the contracts these two implement —
// invitee-side (the person who was invited), as opposed to everything below
// this, which is the owner's-eye view of managing their team.

export function listMyInvitations(): Promise<MyInvitation[]> {
  if (USE_MOCK_API) {
    // No pending invite by default — flip to a populated array locally to
    // preview the invite-card state on the Get Started screen.
    return mockDelay<MyInvitation[]>([]);
  }

  return apiRequest<{ invitations: MyInvitation[] }>('/me/invitations').then((res) => res.invitations);
}

export function respondToInvitation(
  invitationId: string,
  action: 'accept' | 'decline',
): Promise<{ invitationId: string; status: 'accepted' | 'declined' }> {
  if (USE_MOCK_API) {
    return mockDelay({ invitationId, status: action === 'accept' ? ('accepted' as const) : ('declined' as const) });
  }

  return apiRequest(`/invitations/${invitationId}/respond`, { method: 'POST', body: { action } });
}

// See reference/api/team.json#list-team-members. The business's full
// roster — pending invitations and accepted members alike.
export function listTeamMembers(businessId: string): Promise<TeamInvitation[]> {
  if (USE_MOCK_API) {
    return mockDelay<TeamInvitation[]>([]);
  }

  return apiRequest<{ members: TeamInvitation[] }>(`/businesses/${businessId}/team/members`).then((res) => res.members);
}

// See reference/api/team.json#add-team-member for the contract this
// implements. The post-publish equivalent of businessSetup.ts's
// inviteTeamMember (onboarding's Team invite step) — this one is reachable
// any time from the Team screen and collects the fuller set of fields
// (name, commission split, working days) that screen actually asks for.
export type AddTeamMemberInput = {
  name: string;
  email?: string;
  phone?: string;
  role: TeamRole;
  // Staff only; left out for front desk (no commission).
  commissionPercent?: number;
  // Staff who also run the front desk.
  frontDeskAccess?: boolean;
  workingDays: (keyof WeeklyHours)[] | null;
};

let mockTeamMemberSequence = 0;

export function addTeamMember(businessId: string, input: AddTeamMemberInput): Promise<TeamInvitation> {
  if (USE_MOCK_API) {
    mockTeamMemberSequence += 1;
    return mockDelay<TeamInvitation>({
      invitationId: `inv_mock_${mockTeamMemberSequence}`,
      businessId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: input.role,
      staffId: null,
      status: 'pending',
      commissionPercent: input.role === 'front_desk' ? null : input.commissionPercent ?? 40,
      frontDeskAccess: input.role === 'front_desk' || !!input.frontDeskAccess,
      workingDays: input.workingDays,
      sentAt: new Date().toISOString(),
    });
  }

  return apiRequest<TeamInvitation>(`/businesses/${businessId}/team/members`, { method: 'POST', body: input });
}

// See reference/api/team.json#update-team-member for the contract this
// implements. Edits commission split / working days from Member Detail — no
// corresponding onboarding screen, this is purely a post-publish concept.
// Mock-only quirk: takes the full invitation rather than just an id, same
// reason as booking.ts's chargeBookingPayment/confirmBookingPayment — the
// mock layer has no server-side record to merge partial updates into.
// PATCH only changes the fields sent; workingDays: null clears it (back to
// following the business's own working days).
export type UpdateTeamMemberInput = {
  commissionPercent?: number;
  workingDays?: (keyof WeeklyHours)[] | null;
  // What they do: both on = staff who also run the desk; desk only = front desk
  // (the server clears their commission). At least one must stay on.
  takesAppointments?: boolean;
  frontDeskAccess?: boolean;
};

export function updateTeamMember(
  businessId: string,
  invitation: TeamInvitation,
  input: UpdateTeamMemberInput,
): Promise<TeamInvitation> {
  if (USE_MOCK_API) {
    const { takesAppointments, ...rest } = input;
    const role = takesAppointments === undefined ? invitation.role : takesAppointments ? 'staff' : 'front_desk';
    return mockDelay<TeamInvitation>({
      ...invitation,
      ...rest,
      role,
      commissionPercent: role === 'front_desk' ? null : rest.commissionPercent ?? invitation.commissionPercent ?? 40,
    });
  }

  return apiRequest<TeamInvitation>(`/businesses/${businessId}/team/members/${invitation.invitationId}`, {
    method: 'PATCH',
    body: input,
  });
}

// See reference/api/team.json#remove-team-member for the contract this
// implements. Covers both cancelling a still-pending invite and removing an
// already-accepted member — same request either way, the meaning just
// depends on the record's current status.
export function removeTeamMember(businessId: string, invitationId: string): Promise<void> {
  if (USE_MOCK_API) {
    return mockDelay(undefined);
  }

  return apiRequest<void>(`/businesses/${businessId}/team/members/${invitationId}`, { method: 'DELETE' });
}

// See reference/api/team.json#get-staff-services / #set-staff-services.
// Keyed by the member's staffId (accepted members only), not invitationId.
// allServices: true = performs every service, including ones added later;
// false = exactly serviceIds (may be empty, e.g. front desk).
export type StaffServices = {
  allServices: boolean;
  serviceIds: string[];
};

export function getStaffServices(businessId: string, staffId: string): Promise<StaffServices> {
  if (USE_MOCK_API) {
    return mockDelay<StaffServices>({ allServices: true, serviceIds: [] });
  }

  return apiRequest<StaffServices>(`/businesses/${businessId}/staff/${staffId}/services`);
}

// Replaces the whole list. serviceIds must be empty when allServices is true.
export function setStaffServices(businessId: string, staffId: string, input: StaffServices): Promise<StaffServices> {
  if (USE_MOCK_API) {
    return mockDelay(input);
  }

  return apiRequest<StaffServices>(`/businesses/${businessId}/staff/${staffId}/services`, {
    method: 'PUT',
    body: { allServices: input.allServices, serviceIds: input.allServices ? [] : input.serviceIds },
  });
}

// See reference/api/team.json#get-my-staff-services. The signed-in staff
// member's (or front desk's) own services at businessId. With allServices
// true, `services` lists everything the business offers.
export type MyStaffServices = {
  staffId: string;
  allServices: boolean;
  services: { serviceId: string; name: string; durationMinutes: number; price: Money }[];
};

export function getMyStaffServices(businessId: string): Promise<MyStaffServices> {
  return apiRequest<MyStaffServices>(`/me/staff-services?businessId=${encodeURIComponent(businessId)}`);
}

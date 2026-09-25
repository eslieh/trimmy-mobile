import { apiRequest } from './client';
import { mockDelay } from './mock/delay';
import { USE_MOCK_API } from '../config/env';
import type { MyInvitation, TeamInvitation, TeamRole } from '../types/team';
import type { WeeklyHours } from '../types/business';

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
  commissionPercent: number;
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
      status: 'pending',
      commissionPercent: input.commissionPercent,
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
};

export function updateTeamMember(
  businessId: string,
  invitation: TeamInvitation,
  input: UpdateTeamMemberInput,
): Promise<TeamInvitation> {
  if (USE_MOCK_API) {
    return mockDelay<TeamInvitation>({ ...invitation, ...input });
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

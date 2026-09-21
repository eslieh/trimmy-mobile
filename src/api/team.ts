import { apiRequest } from './client';
import { mockDelay } from './mock/delay';
import { USE_MOCK_API } from '../config/env';
import type { MyInvitation } from '../types/team';

// See reference/api/team.json for the contracts this implements.

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

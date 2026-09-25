import { colors } from '../theme';
import type { InvitationStatus, TeamInvitation, TeamRole } from '../types/team';

// Shared by GetStartedScreen (invitee's own pending-invite card) and the
// owner-facing Team screens — one vocabulary, not copies drifting apart.
export const TEAM_ROLE_LABEL: Record<TeamRole, string> = {
  front_desk: 'Front Desk',
  staff: 'Staff',
};

export const INVITATION_STATUS_LABEL: Record<InvitationStatus, string> = {
  pending: 'Pending',
  accepted: 'Active',
  declined: 'Declined',
};

export const INVITATION_STATUS_COLOR: Record<InvitationStatus, string> = {
  pending: colors.feedback.warning,
  accepted: colors.feedback.success,
  declined: colors.feedback.danger,
};

// name is only ever set via the post-publish Team screens (see
// InviteTeamMemberScreen) — an invitation sent through onboarding's Team
// invite step never collects it, so this falls back to whatever contact
// info is available rather than showing a blank.
export function teamMemberDisplayName(invitation: Pick<TeamInvitation, 'name' | 'phone' | 'email'>): string {
  return invitation.name || invitation.phone || invitation.email || 'Team member';
}

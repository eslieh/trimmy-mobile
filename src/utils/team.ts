import { colors } from '../theme';
import type { InvitationStatus, TeamRole } from '../types/team';

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

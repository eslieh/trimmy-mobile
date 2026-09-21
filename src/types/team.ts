export type TeamRole = 'front_desk' | 'staff';

export type InvitationStatus = 'pending' | 'accepted' | 'declined';

// An invitation as seen by the invited person (GET /me/invitations),
// as opposed to the owner's-eye view created during business setup.
export type MyInvitation = {
  invitationId: string;
  businessId: string;
  businessName: string;
  role: TeamRole;
  status: InvitationStatus;
  sentAt: string;
};

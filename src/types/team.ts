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

// The owner's-eye view of an invitation they sent (POST /businesses/{id}/team/invitations).
// At least one of email/phone is required to send it.
export type TeamInvitation = {
  invitationId: string;
  businessId: string;
  email?: string;
  phone?: string;
  role: TeamRole;
  status: InvitationStatus;
  sentAt: string;
};

import { create } from 'zustand';
import type { TeamMode, WeeklyHours } from '../types/business';

// Slim projection of whatever business the current session's owner is
// managing — deliberately not the full wizard `Business` type, since the
// business-owner app (Today Timeline etc.) only ever needs these four
// fields, whether the source is a just-published business or (for testing)
// a seeded mock discovery profile.
export type OwnedBusiness = {
  businessId: string;
  name: string;
  teamMode: TeamMode;
  workingHours: WeeklyHours;
};

// The staff-app equivalent of OwnedBusiness — same "which business is this
// session about" slot, but for someone who works *at* a business rather
// than owns it. invitationId links back to the matching TeamInvitation in
// useBusinessOnboardingStore.invitations (that's still the only "team
// member" record this app has — see types/team.ts), which is how the
// staff app scopes bookings/earnings to "mine" (staffId === invitationId).
export type StaffSession = {
  businessId: string;
  businessName: string;
  invitationId: string;
};

// 'customer' / 'business' / 'staff' — Airbnb's traveling/hosting switch,
// extended with a third posture for someone working at a business they
// don't own. Owning or working at a business doesn't put you in that mode
// automatically (a host can still browse as a guest); this is which app
// module you're currently in, not what you're allowed into.
export type AppMode = 'customer' | 'business' | 'staff';

type OwnedBusinessState = {
  business: OwnedBusiness | null;
  staffSession: StaffSession | null;
  activeMode: AppMode;
  setOwnedBusiness: (business: OwnedBusiness) => void;
  setStaffSession: (session: StaffSession) => void;
  setActiveMode: (mode: AppMode) => void;
  clear: () => void;
};

// Client-only, session-scoped — same caveat as every other mock store in
// this app (useCartStore, useBookingsStore, etc.): resets on app restart,
// no real backend persistence yet. Mode always starts 'customer' on a fresh
// session/login (matching how the app already behaves) rather than being
// remembered across restarts — switching is a manual, per-session action via
// each module's own menu, same as Airbnb doesn't restore your last mode
// across a full app relaunch either.
export const useOwnedBusinessStore = create<OwnedBusinessState>((set) => ({
  business: null,
  staffSession: null,
  activeMode: 'customer',
  setOwnedBusiness: (business) => set({ business }),
  setStaffSession: (staffSession) => set({ staffSession }),
  setActiveMode: (activeMode) => set({ activeMode }),
  clear: () => set({ business: null, staffSession: null, activeMode: 'customer' }),
}));

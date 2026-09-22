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

// 'customer' vs 'business' — Airbnb's traveling/hosting switch. Owning a
// business doesn't put you in business mode automatically (a host can still
// browse as a guest); this is which app module you're currently in, not
// whether you're allowed into the business one.
export type AppMode = 'customer' | 'business';

type OwnedBusinessState = {
  business: OwnedBusiness | null;
  activeMode: AppMode;
  setOwnedBusiness: (business: OwnedBusiness) => void;
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
  activeMode: 'customer',
  setOwnedBusiness: (business) => set({ business }),
  setActiveMode: (activeMode) => set({ activeMode }),
  clear: () => set({ business: null, activeMode: 'customer' }),
}));

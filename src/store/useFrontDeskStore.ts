import { create } from 'zustand';
import { getBusinessProfile } from '../api/discovery';
import type { BusinessProfile } from '../types/discovery';

// Front desk can't read the owner-only business detail or team roster, so
// the front desk app runs on the business's public profile: services,
// staff (with their services and working days) and working hours.
type FrontDeskState = {
  profile: BusinessProfile | null;
  load: (businessId: string) => Promise<BusinessProfile>;
  clear: () => void;
};

export const useFrontDeskStore = create<FrontDeskState>((set) => ({
  profile: null,
  load: async (businessId) => {
    const profile = await getBusinessProfile(businessId);
    set({ profile });
    return profile;
  },
  clear: () => set({ profile: null }),
}));

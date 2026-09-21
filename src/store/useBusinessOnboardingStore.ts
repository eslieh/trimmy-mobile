import { create } from 'zustand';
import { createBusiness, CreateBusinessInput } from '../api/businessSetup';
import type { Business } from '../types/business';

type BusinessOnboardingState = {
  business: Business | null;
  isSubmitting: boolean;
  error: string | null;
  submitBusinessBasics: (input: CreateBusinessInput) => Promise<Business>;
};

// Holds the draft business as the owner moves through the setup wizard
// (Phase 1 in reference/TASKS.md). Grows a field per screen as each one lands —
// currently only Business Basics exists, so this only tracks that.
export const useBusinessOnboardingStore = create<BusinessOnboardingState>((set) => ({
  business: null,
  isSubmitting: false,
  error: null,
  submitBusinessBasics: async (input) => {
    set({ isSubmitting: true, error: null });
    try {
      const business = await createBusiness(input);
      set({ business, isSubmitting: false });
      return business;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Something went wrong' });
      throw err;
    }
  },
}));

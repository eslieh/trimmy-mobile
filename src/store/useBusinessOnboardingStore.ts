import { create } from 'zustand';
import { createBusiness, setWorkingHours } from '../api/businessSetup';
import type { Business, BusinessCategory, BusinessLocation, WeeklyHours } from '../types/business';

type BusinessBasicsDraft = {
  name: string;
  categories: BusinessCategory[];
  phone: string;
  location: BusinessLocation | null;
};

const initialDraft: BusinessBasicsDraft = {
  name: '',
  categories: [],
  phone: '',
  location: null,
};

type BusinessOnboardingState = {
  draft: BusinessBasicsDraft;
  updateDraft: (patch: Partial<BusinessBasicsDraft>) => void;
  business: Business | null;
  isSubmitting: boolean;
  error: string | null;
  submitBusinessBasics: () => Promise<Business>;
  submitWorkingHours: (weeklyHours: WeeklyHours) => Promise<WeeklyHours>;
};

// Holds the draft business as the owner moves through the Business Basics
// step wizard (name → categories → phone → location), one field group per
// screen, so back navigation doesn't lose what was already entered. Submits
// on the final step. Grows further as more of Phase 1 (reference/TASKS.md)
// lands — currently only Business Basics exists.
export const useBusinessOnboardingStore = create<BusinessOnboardingState>((set, get) => ({
  draft: initialDraft,
  updateDraft: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
  business: null,
  isSubmitting: false,
  error: null,
  submitBusinessBasics: async () => {
    set({ isSubmitting: true, error: null });
    try {
      const { name, categories, phone, location } = get().draft;
      if (!location) {
        throw new Error('Business location is required');
      }
      const business = await createBusiness({ name, categories, phone, location });
      set({ business, isSubmitting: false, draft: initialDraft });
      return business;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Something went wrong' });
      throw err;
    }
  },
  submitWorkingHours: async (weeklyHours) => {
    const business = get().business;
    if (!business) {
      throw new Error('Business must be created before setting working hours');
    }
    set({ isSubmitting: true, error: null });
    try {
      const saved = await setWorkingHours(business.businessId, weeklyHours);
      set({
        business: { ...business, workingHours: saved, onboardingStep: 'working_hours' },
        isSubmitting: false,
      });
      return saved;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Something went wrong' });
      throw err;
    }
  },
}));

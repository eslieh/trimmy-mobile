import { create } from 'zustand';
import {
  createBusiness,
  createService,
  createServiceCategory,
  inviteTeamMember,
  setPaymentDestination,
  setPolicies,
  setTeamMode,
  setWorkingHours,
  uploadBusinessPhoto,
  type InviteTeamMemberInput,
  type SetPaymentDestinationInput,
} from '../api/businessSetup';
import type {
  Business,
  BusinessCategory,
  BusinessLocation,
  BusinessPhoto,
  BusinessPolicies,
  Money,
  PaymentDestination,
  Service,
  ServiceCategory,
  TeamMode,
  WeeklyHours,
} from '../types/business';
import type { TeamInvitation } from '../types/team';

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

export type ServiceDraftItem = {
  name: string;
  durationMinutes: number;
  price: Money;
};

// A category not yet submitted to the backend — localId is only for
// React keys and cross-referencing services within the draft tree.
export type ServiceCategoryDraft = {
  localId: string;
  name: string;
  services: ServiceDraftItem[];
};

let localCategoryIdSequence = 0;

// A picked photo not yet uploaded — localId is only for React keys.
export type PhotoDraftItem = {
  localId: string;
  uri: string;
};

let localPhotoIdSequence = 0;

type BusinessOnboardingState = {
  draft: BusinessBasicsDraft;
  updateDraft: (patch: Partial<BusinessBasicsDraft>) => void;
  business: Business | null;
  isSubmitting: boolean;
  error: string | null;
  submitBusinessBasics: () => Promise<Business>;

  photoDrafts: PhotoDraftItem[];
  addPhotoDraft: (uri: string) => void;
  removePhotoDraft: (localId: string) => void;
  photos: BusinessPhoto[];
  submitPhotos: () => Promise<void>;

  submitWorkingHours: (weeklyHours: WeeklyHours) => Promise<WeeklyHours>;

  serviceCategoryDrafts: ServiceCategoryDraft[];
  addServiceCategoryDraft: (name: string) => void;
  removeServiceCategoryDraft: (localId: string) => void;
  addServiceDraft: (categoryLocalId: string, item: ServiceDraftItem) => void;
  removeServiceDraft: (categoryLocalId: string, index: number) => void;
  serviceCategories: ServiceCategory[];
  services: Service[];
  submitServices: () => Promise<void>;

  submitPolicies: (policies: BusinessPolicies) => Promise<BusinessPolicies>;

  submitPaymentDestination: (input: SetPaymentDestinationInput) => Promise<PaymentDestination>;

  submitTeamMode: (teamMode: TeamMode) => Promise<TeamMode>;

  invitations: TeamInvitation[];
  sendTeamInvite: (input: InviteTeamMemberInput) => Promise<TeamInvitation>;
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
  photoDrafts: [],
  addPhotoDraft: (uri) =>
    set((state) => {
      localPhotoIdSequence += 1;
      return { photoDrafts: [...state.photoDrafts, { localId: `local_photo_${localPhotoIdSequence}`, uri }] };
    }),
  removePhotoDraft: (localId) =>
    set((state) => ({ photoDrafts: state.photoDrafts.filter((p) => p.localId !== localId) })),
  photos: [],
  submitPhotos: async () => {
    const { business, photoDrafts } = get();
    if (!business) {
      throw new Error('Business must be created before adding photos');
    }
    set({ isSubmitting: true, error: null });
    try {
      const savedPhotos: BusinessPhoto[] = [];
      for (let i = 0; i < photoDrafts.length; i += 1) {
        const saved = await uploadBusinessPhoto(business.businessId, {
          uri: photoDrafts[i].uri,
          isCover: i === 0,
        });
        savedPhotos.push(saved);
      }

      set({
        business: { ...business, photos: savedPhotos, onboardingStep: 'photos' },
        photos: savedPhotos,
        photoDrafts: [],
        isSubmitting: false,
      });
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

  serviceCategoryDrafts: [],
  addServiceCategoryDraft: (name) =>
    set((state) => {
      localCategoryIdSequence += 1;
      return {
        serviceCategoryDrafts: [
          ...state.serviceCategoryDrafts,
          { localId: `local_${localCategoryIdSequence}`, name, services: [] },
        ],
      };
    }),
  removeServiceCategoryDraft: (localId) =>
    set((state) => ({
      serviceCategoryDrafts: state.serviceCategoryDrafts.filter((c) => c.localId !== localId),
    })),
  addServiceDraft: (categoryLocalId, item) =>
    set((state) => ({
      serviceCategoryDrafts: state.serviceCategoryDrafts.map((category) =>
        category.localId === categoryLocalId
          ? { ...category, services: [...category.services, item] }
          : category,
      ),
    })),
  removeServiceDraft: (categoryLocalId, index) =>
    set((state) => ({
      serviceCategoryDrafts: state.serviceCategoryDrafts.map((category) =>
        category.localId === categoryLocalId
          ? { ...category, services: category.services.filter((_, i) => i !== index) }
          : category,
      ),
    })),
  serviceCategories: [],
  services: [],
  submitServices: async () => {
    const { business, serviceCategoryDrafts } = get();
    if (!business) {
      throw new Error('Business must be created before adding services');
    }
    set({ isSubmitting: true, error: null });
    try {
      const savedCategories: ServiceCategory[] = [];
      const savedServices: Service[] = [];

      for (const categoryDraft of serviceCategoryDrafts) {
        const savedCategory = await createServiceCategory(business.businessId, categoryDraft.name);
        savedCategories.push(savedCategory);

        for (const serviceDraft of categoryDraft.services) {
          const savedService = await createService(business.businessId, {
            categoryId: savedCategory.categoryId,
            name: serviceDraft.name,
            durationMinutes: serviceDraft.durationMinutes,
            price: serviceDraft.price,
          });
          savedServices.push(savedService);
        }
      }

      set({
        business: { ...business, onboardingStep: 'services' },
        serviceCategories: savedCategories,
        services: savedServices,
        serviceCategoryDrafts: [],
        isSubmitting: false,
      });
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Something went wrong' });
      throw err;
    }
  },

  submitPolicies: async (policies) => {
    const business = get().business;
    if (!business) {
      throw new Error('Business must be created before setting policies');
    }
    set({ isSubmitting: true, error: null });
    try {
      const saved = await setPolicies(business.businessId, policies);
      set({
        business: { ...business, policies: saved, onboardingStep: 'policies' },
        isSubmitting: false,
      });
      return saved;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Something went wrong' });
      throw err;
    }
  },

  submitPaymentDestination: async (input) => {
    const business = get().business;
    if (!business) {
      throw new Error('Business must be created before setting a payment destination');
    }
    set({ isSubmitting: true, error: null });
    try {
      const saved = await setPaymentDestination(business.businessId, input);
      set({
        business: { ...business, paymentDestination: saved, onboardingStep: 'payment_destination' },
        isSubmitting: false,
      });
      return saved;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Something went wrong' });
      throw err;
    }
  },

  submitTeamMode: async (teamMode) => {
    const business = get().business;
    if (!business) {
      throw new Error('Business must be created before setting team mode');
    }
    set({ isSubmitting: true, error: null });
    try {
      const saved = await setTeamMode(business.businessId, teamMode);
      set({
        business: { ...business, teamMode: saved, onboardingStep: 'team_mode' },
        isSubmitting: false,
      });
      return saved;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Something went wrong' });
      throw err;
    }
  },

  invitations: [],
  sendTeamInvite: async (input) => {
    const business = get().business;
    if (!business) {
      throw new Error('Business must be created before inviting team members');
    }
    set({ isSubmitting: true, error: null });
    try {
      const invitation = await inviteTeamMember(business.businessId, input);
      set((state) => ({ invitations: [...state.invitations, invitation], isSubmitting: false }));
      return invitation;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Something went wrong' });
      throw err;
    }
  },
}));

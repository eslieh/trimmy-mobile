import { create } from 'zustand';
import {
  createBusiness,
  createService,
  createServiceCategory,
  deleteBusinessPhoto,
  deleteService,
  deleteServiceCategory,
  inviteTeamMember,
  publishBusiness,
  setPaymentDestination,
  setPolicies,
  setTeamMode,
  setWorkingHours,
  updateBusinessInfo as updateBusinessInfoApi,
  updateService,
  uploadBusinessPhoto,
  type InviteTeamMemberInput,
  type SetPaymentDestinationInput,
  type UpdateBusinessInfoInput,
  type UpdateServiceInput,
} from '../api/businessSetup';
import {
  addTeamMember,
  removeTeamMember as removeTeamMemberApi,
  updateTeamMember as updateTeamMemberApi,
  type AddTeamMemberInput,
  type UpdateTeamMemberInput,
} from '../api/team';
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
  description: string;
  categories: BusinessCategory[];
  phone: string;
  location: BusinessLocation | null;
};

const initialDraft: BusinessBasicsDraft = {
  name: '',
  description: '',
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

  // Post-publish management (EditBusinessInfoScreen) — same "call the API
  // immediately" pattern as the services/photos "Now" actions below.
  updateBusinessInfo: (businessId: string, input: UpdateBusinessInfoInput) => Promise<Business>;

  photoDrafts: PhotoDraftItem[];
  addPhotoDraft: (uri: string) => void;
  removePhotoDraft: (localId: string) => void;
  photos: BusinessPhoto[];
  submitPhotos: () => Promise<void>;

  // Post-publish management (ManagePhotosScreen) — distinct from the draft
  // actions above: these call the API immediately against the live
  // business.photos, not a batched wizard submit.
  addPhotoNow: (businessId: string, uri: string) => Promise<BusinessPhoto>;
  removePhotoNow: (businessId: string, photoId: string) => Promise<void>;

  submitWorkingHours: (weeklyHours: WeeklyHours) => Promise<WeeklyHours>;

  serviceCategoryDrafts: ServiceCategoryDraft[];
  addServiceCategoryDraft: (name: string) => void;
  removeServiceCategoryDraft: (localId: string) => void;
  addServiceDraft: (categoryLocalId: string, item: ServiceDraftItem) => void;
  removeServiceDraft: (categoryLocalId: string, index: number) => void;
  serviceCategories: ServiceCategory[];
  services: Service[];
  submitServices: () => Promise<void>;

  // Post-publish management (ManageServicesScreen) — distinct from the
  // draft actions above: these call the API immediately, one action at a
  // time, against already-live services/serviceCategories, not a batched
  // wizard submit.
  addServiceCategoryNow: (businessId: string, name: string) => Promise<ServiceCategory>;
  addServiceNow: (businessId: string, categoryId: string, input: ServiceDraftItem) => Promise<Service>;
  editService: (businessId: string, serviceId: string, input: UpdateServiceInput) => Promise<Service>;
  removeService: (businessId: string, serviceId: string) => Promise<void>;
  removeServiceCategory: (businessId: string, categoryId: string) => Promise<void>;

  submitPolicies: (policies: BusinessPolicies) => Promise<BusinessPolicies>;

  submitPaymentDestination: (input: SetPaymentDestinationInput) => Promise<PaymentDestination>;

  submitTeamMode: (teamMode: TeamMode) => Promise<TeamMode>;

  invitations: TeamInvitation[];
  sendTeamInvite: (input: InviteTeamMemberInput) => Promise<TeamInvitation>;

  // Post-publish team management (TeamScreen/InviteTeamMemberScreen/
  // TeamMemberDetailScreen) — distinct from sendTeamInvite above (onboarding's
  // Team invite step): these collect the fuller field set (name, commission,
  // working days) and call the API immediately, one action at a time,
  // against already-live invitations, not a batched wizard submit.
  addTeamMemberNow: (businessId: string, input: AddTeamMemberInput) => Promise<TeamInvitation>;
  updateTeamMemberNow: (businessId: string, invitation: TeamInvitation, input: UpdateTeamMemberInput) => Promise<TeamInvitation>;
  removeTeamMemberNow: (businessId: string, invitationId: string) => Promise<void>;
  // Testing convenience, not real auth — simulates the invited person
  // accepting via team.json's respond-to-invitation, which isn't reachable
  // from this app since no Staff/Front Desk session exists yet. Pure local
  // state, no API call, same pattern as WelcomeScreen's role-testing
  // shortcuts.
  markTeamMemberActiveForTesting: (invitationId: string) => void;

  submitReviewPublish: (publish: boolean) => Promise<Business>;
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
      const { name, description, categories, phone, location } = get().draft;
      if (!location) {
        throw new Error('Business location is required');
      }
      const business = await createBusiness({ name, description, categories, phone, location });
      set({ business, isSubmitting: false, draft: initialDraft });
      return business;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Something went wrong' });
      throw err;
    }
  },
  updateBusinessInfo: async (businessId, input) => {
    const business = get().business;
    if (!business) {
      throw new Error('Business must be created before editing its info');
    }
    set({ isSubmitting: true, error: null });
    try {
      const saved = await updateBusinessInfoApi(businessId, input);
      const updated: Business = { ...business, ...saved };
      set({ business: updated, isSubmitting: false });
      return updated;
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

  addPhotoNow: async (businessId, uri) => {
    const business = get().business;
    if (!business) {
      throw new Error('Business must be created before adding photos');
    }
    const existing = business.photos ?? [];
    const saved = await uploadBusinessPhoto(businessId, { uri, isCover: existing.length === 0 });
    set({ business: { ...business, photos: [...existing, saved] } });
    return saved;
  },
  removePhotoNow: async (businessId, photoId) => {
    const business = get().business;
    if (!business) {
      throw new Error('Business must be created before removing photos');
    }
    await deleteBusinessPhoto(businessId, photoId);
    set({ business: { ...business, photos: (business.photos ?? []).filter((p) => p.photoId !== photoId) } });
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

  addServiceCategoryNow: async (businessId, name) => {
    const saved = await createServiceCategory(businessId, name);
    set((state) => ({ serviceCategories: [...state.serviceCategories, saved] }));
    return saved;
  },
  addServiceNow: async (businessId, categoryId, input) => {
    const saved = await createService(businessId, { categoryId, ...input });
    set((state) => ({ services: [...state.services, saved] }));
    return saved;
  },
  editService: async (businessId, serviceId, input) => {
    const saved = await updateService(businessId, serviceId, input);
    set((state) => ({
      services: state.services.map((service) =>
        service.serviceId === serviceId
          ? { ...service, name: saved.name, durationMinutes: saved.durationMinutes, price: saved.price }
          : service,
      ),
    }));
    return saved;
  },
  removeService: async (businessId, serviceId) => {
    await deleteService(businessId, serviceId);
    set((state) => ({ services: state.services.filter((s) => s.serviceId !== serviceId) }));
  },
  removeServiceCategory: async (businessId, categoryId) => {
    await deleteServiceCategory(businessId, categoryId);
    set((state) => ({
      serviceCategories: state.serviceCategories.filter((c) => c.categoryId !== categoryId),
      services: state.services.filter((s) => s.categoryId !== categoryId),
    }));
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

  addTeamMemberNow: async (businessId, input) => {
    const saved = await addTeamMember(businessId, input);
    set((state) => ({ invitations: [...state.invitations, saved] }));
    return saved;
  },
  updateTeamMemberNow: async (businessId, invitation, input) => {
    const saved = await updateTeamMemberApi(businessId, invitation, input);
    set((state) => ({
      invitations: state.invitations.map((i) => (i.invitationId === saved.invitationId ? saved : i)),
    }));
    return saved;
  },
  removeTeamMemberNow: async (businessId, invitationId) => {
    await removeTeamMemberApi(businessId, invitationId);
    set((state) => ({ invitations: state.invitations.filter((i) => i.invitationId !== invitationId) }));
  },
  markTeamMemberActiveForTesting: (invitationId) => {
    set((state) => ({
      invitations: state.invitations.map((i) =>
        i.invitationId === invitationId ? { ...i, status: 'accepted' } : i,
      ),
    }));
  },

  submitReviewPublish: async (publish) => {
    const business = get().business;
    if (!business) {
      throw new Error('Business must be created before reviewing & publishing');
    }
    set({ isSubmitting: true, error: null });
    try {
      if (publish) {
        const result = await publishBusiness(business.businessId);
        const published: Business = {
          ...business,
          status: result.status,
          onboardingStep: 'review_publish',
        };
        set({ business: published, isSubmitting: false });
        return published;
      }

      const reviewed: Business = { ...business, onboardingStep: 'review_publish' };
      set({ business: reviewed, isSubmitting: false });
      return reviewed;
    } catch (err) {
      set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Something went wrong' });
      throw err;
    }
  },
}));

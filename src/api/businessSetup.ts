import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { ApiError, apiRequest } from './client';
import { mockDelay } from './mock/delay';
import { USE_MOCK_API } from '../config/env';
import type {
  Business,
  BusinessCategory,
  BusinessLocation,
  BusinessPhoto,
  BusinessPolicies,
  Money,
  PaymentDestination,
  PaymentDestinationOptions,
  Service,
  ServiceCategory,
  TeamMode,
  WeeklyHours,
} from '../types/business';
import type { TeamInvitation, TeamRole } from '../types/team';

// See reference/api/business-setup.json#create-business for the contract this implements.
export type CreateBusinessInput = {
  name: string;
  description: string;
  categories: BusinessCategory[];
  phone: string;
  location: BusinessLocation;
  // Create-only for now: the server's PATCH ignores amenities.
  amenities?: string[];
};

let mockBusinessSequence = 0;

export function createBusiness(input: CreateBusinessInput): Promise<Business> {
  if (USE_MOCK_API) {
    mockBusinessSequence += 1;
    return mockDelay<Business>({
      businessId: `biz_mock_${mockBusinessSequence}`,
      name: input.name,
      description: input.description,
      categories: input.categories,
      phone: input.phone,
      location: input.location,
      status: 'draft',
      onboardingStep: 'business_basics',
    });
  }

  return apiRequest<Business>('/businesses', { method: 'POST', body: input });
}

// GET /businesses/{id} — the owner's full view of one business (draft or
// published). Nested sections are null/absent until that wizard step has
// been saved. Used to rebuild the owned business after login (see
// utils/restoreOwnedBusiness.ts).
export type BusinessDetail = Omit<
  Business,
  'description' | 'photos' | 'workingHours' | 'policies' | 'paymentDestination' | 'teamMode'
> & {
  description: string | null;
  amenities: string[] | null;
  photos: BusinessPhoto[] | null;
  // Unlike the rest of the app, the server nests the hours one level down.
  workingHours: { weeklyHours: WeeklyHours } | null;
  policies: BusinessPolicies | null;
  paymentDestination: PaymentDestination | null;
  teamMode: TeamMode | null;
  serviceCategories: (ServiceCategory & { services: Service[] })[];
};

export function getBusiness(businessId: string): Promise<BusinessDetail> {
  return apiRequest<BusinessDetail>(`/businesses/${businessId}`);
}

// See reference/api/business-setup.json#update-business-info for the
// contract this implements. Added for post-publish editing (see
// EditBusinessInfoScreen) — onboarding's create-business is the only
// Business Basics endpoint, a combined POST, not a per-field PATCH.
export type UpdateBusinessInfoInput = Omit<CreateBusinessInput, 'amenities'>;

export function updateBusinessInfo(businessId: string, input: UpdateBusinessInfoInput): Promise<UpdateBusinessInfoInput> {
  if (USE_MOCK_API) {
    return mockDelay<UpdateBusinessInfoInput>(input);
  }

  return apiRequest<UpdateBusinessInfoInput>(`/businesses/${businessId}`, { method: 'PATCH', body: input });
}

export type UploadBusinessPhotoInput = {
  uri: string; // local file URI from the image picker
  isCover: boolean;
};

let mockPhotoSequence = 0;

// See reference/api/business-setup.json#upload-business-photo for the contract this implements.
// Direct-to-storage upload in three steps: ask the server for a presigned
// URL, PUT the file bytes there, then tell the server it's done. The server
// checks the stored bytes (JPEG/PNG, ≤10 MB) before recording the photo.
// The first photo, or any with isCover, becomes the single cover.
export function uploadBusinessPhoto(businessId: string, input: UploadBusinessPhotoInput): Promise<BusinessPhoto> {
  if (USE_MOCK_API) {
    mockPhotoSequence += 1;
    return mockDelay<BusinessPhoto>({
      photoId: `photo_mock_${mockPhotoSequence}`,
      businessId,
      url: input.uri,
      isCover: input.isCover,
    });
  }

  return uploadViaPresignedUrl(businessId, input);
}

async function uploadViaPresignedUrl(businessId: string, input: UploadBusinessPhotoInput): Promise<BusinessPhoto> {
  const file = new File(input.uri);
  // The pickers crop + compress, which outputs JPEG; PNG only if that's what we got.
  const contentType = file.type === 'image/png' || input.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

  const { uploadUrl, headers, key } = await apiRequest<{
    uploadUrl: string;
    headers: Record<string, string>;
    key: string;
  }>(`/businesses/${businessId}/photos/upload-url`, {
    method: 'POST',
    body: { contentType, sizeBytes: file.size },
  });

  // The URL is signed over Content-Type and Content-Length, so send exactly
  // the server's headers. expo/fetch streams the File as-is; React Native's
  // own fetch with a Blob body replaces Content-Type with the blob's (empty)
  // type, which fails the signature (SignatureDoesNotMatch). No auth
  // header: this goes to storage, not our API.
  const put = await expoFetch(uploadUrl, { method: 'PUT', headers, body: file });
  if (!put.ok) {
    throw new ApiError(put.status, 'upload_failed', 'Photo upload failed. Please try again.');
  }

  // Safe to retry with the same key — the server returns the same photo.
  return apiRequest<BusinessPhoto>(`/businesses/${businessId}/photos/complete`, {
    method: 'POST',
    body: { key, isCover: input.isCover },
  });
}

// See reference/api/business-setup.json#delete-business-photo for the
// contract this implements — onboarding never removes a photo, only adds.
// Added for post-publish photo management (see ManagePhotosScreen).
export function deleteBusinessPhoto(businessId: string, photoId: string): Promise<void> {
  if (USE_MOCK_API) {
    return mockDelay(undefined);
  }

  return apiRequest<void>(`/businesses/${businessId}/photos/${photoId}`, { method: 'DELETE' });
}

// See reference/api/business-setup.json#set-working-hours for the contract this implements.
export function setWorkingHours(businessId: string, weeklyHours: WeeklyHours): Promise<WeeklyHours> {
  if (USE_MOCK_API) {
    return mockDelay(weeklyHours);
  }

  return apiRequest<{ weeklyHours: WeeklyHours }>(`/businesses/${businessId}/working-hours`, {
    method: 'PUT',
    body: { weeklyHours },
  }).then((res) => res.weeklyHours);
}

let mockServiceCategorySequence = 0;
let mockServiceSequence = 0;

// See reference/api/business-setup.json#create-service-category for the contract this implements.
export function createServiceCategory(businessId: string, name: string): Promise<ServiceCategory> {
  if (USE_MOCK_API) {
    mockServiceCategorySequence += 1;
    return mockDelay<ServiceCategory>({
      categoryId: `svccat_mock_${mockServiceCategorySequence}`,
      businessId,
      name,
    });
  }

  return apiRequest<ServiceCategory>(`/businesses/${businessId}/service-categories`, {
    method: 'POST',
    body: { name },
  });
}

// GET /businesses/{id}/service-categories — each category with its services.
export function listServiceCategories(businessId: string): Promise<(ServiceCategory & { services: Service[] })[]> {
  if (USE_MOCK_API) {
    return mockDelay([]);
  }

  return apiRequest<{ categories: (ServiceCategory & { services: Service[] })[] }>(
    `/businesses/${businessId}/service-categories`,
  ).then((res) => res.categories);
}

export type CreateServiceInput = {
  categoryId: string;
  name: string;
  durationMinutes: number;
  price: Money;
};

// See reference/api/business-setup.json#create-service for the contract this implements.
export function createService(businessId: string, input: CreateServiceInput): Promise<Service> {
  if (USE_MOCK_API) {
    mockServiceSequence += 1;
    return mockDelay<Service>({
      serviceId: `svc_mock_${mockServiceSequence}`,
      businessId,
      categoryId: input.categoryId,
      name: input.name,
      durationMinutes: input.durationMinutes,
      price: input.price,
    });
  }

  return apiRequest<Service>(`/businesses/${businessId}/services`, { method: 'POST', body: input });
}

export type UpdateServiceInput = {
  name: string;
  durationMinutes: number;
  price: Money;
};

// See reference/api/business-setup.json#update-service for the contract
// this implements — onboarding's contracts only cover create. Added for
// post-publish service management (see ManageServicesScreen).
export function updateService(
  businessId: string,
  serviceId: string,
  input: UpdateServiceInput,
): Promise<Service> {
  if (USE_MOCK_API) {
    return mockDelay<Service>({ serviceId, businessId, categoryId: '', ...input });
  }

  return apiRequest<Service>(`/businesses/${businessId}/services/${serviceId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteService(businessId: string, serviceId: string): Promise<void> {
  if (USE_MOCK_API) {
    return mockDelay(undefined);
  }

  return apiRequest<void>(`/businesses/${businessId}/services/${serviceId}`, { method: 'DELETE' });
}

// Mock-only note: cascading removal of the category's services from state
// is handled by the store action, not here — this just simulates the
// backend call succeeding.
export function deleteServiceCategory(businessId: string, categoryId: string): Promise<void> {
  if (USE_MOCK_API) {
    return mockDelay(undefined);
  }

  return apiRequest<void>(`/businesses/${businessId}/service-categories/${categoryId}`, { method: 'DELETE' });
}

// See reference/api/business-setup.json#set-policies for the contract this implements.
export function setPolicies(businessId: string, policies: BusinessPolicies): Promise<BusinessPolicies> {
  if (USE_MOCK_API) {
    return mockDelay(policies);
  }

  return apiRequest<BusinessPolicies>(`/businesses/${businessId}/policies`, {
    method: 'PUT',
    body: policies,
  });
}

// Public; lists the three payout methods with their fields and the known
// Kenyan banks (name + M-Pesa paybill). Drives PaymentDestinationScreen.
export function getPaymentDestinationOptions(): Promise<PaymentDestinationOptions> {
  return apiRequest<PaymentDestinationOptions>('/payment-destinations/options');
}

export type SetPaymentDestinationInput = Omit<PaymentDestination, 'verificationStatus'>;

// See reference/api/business-setup.json#set-payment-destination for the contract this implements.
export function setPaymentDestination(
  businessId: string,
  input: SetPaymentDestinationInput,
): Promise<PaymentDestination> {
  if (USE_MOCK_API) {
    return mockDelay<PaymentDestination>({ ...input, verificationStatus: 'verified' });
  }

  return apiRequest<PaymentDestination>(`/businesses/${businessId}/payment-destination`, {
    method: 'PUT',
    body: input,
  });
}

// See reference/api/business-setup.json#set-team-mode for the contract this implements.
export function setTeamMode(businessId: string, teamMode: TeamMode): Promise<TeamMode> {
  if (USE_MOCK_API) {
    return mockDelay(teamMode);
  }

  return apiRequest<{ teamMode: TeamMode }>(`/businesses/${businessId}/team-mode`, {
    method: 'PATCH',
    body: { teamMode },
  }).then((res) => res.teamMode);
}

export type InviteTeamMemberInput = {
  email?: string;
  phone?: string;
  role: TeamRole;
};

let mockInvitationSequence = 0;

// See reference/api/business-setup.json#invite-team-member for the contract this implements.
// Onboarding's Team invite step only ever collects email/phone/role — name/
// commissionPercent/workingDays are filled in later from the post-publish
// Team screen (see src/api/team.ts#addTeamMember for that fuller version).
export function inviteTeamMember(businessId: string, input: InviteTeamMemberInput): Promise<TeamInvitation> {
  if (USE_MOCK_API) {
    mockInvitationSequence += 1;
    return mockDelay<TeamInvitation>({
      invitationId: `inv_mock_${mockInvitationSequence}`,
      businessId,
      email: input.email,
      phone: input.phone,
      role: input.role,
      status: 'pending',
      commissionPercent: 40,
      workingDays: null,
      sentAt: new Date().toISOString(),
    });
  }

  return apiRequest<TeamInvitation>(`/businesses/${businessId}/team/invitations`, {
    method: 'POST',
    body: input,
  });
}

export type PublishBusinessResult = {
  businessId: string;
  status: 'published';
  visible: boolean;
  publishedAt: string;
};

// See reference/api/business-setup.json#publish-business for the contract this implements.
// Only call this when actually publishing — leaving a business as a draft
// needs no API call at all.
export function publishBusiness(businessId: string): Promise<PublishBusinessResult> {
  if (USE_MOCK_API) {
    return mockDelay<PublishBusinessResult>({
      businessId,
      status: 'published',
      visible: true,
      publishedAt: new Date().toISOString(),
    });
  }

  return apiRequest<PublishBusinessResult>(`/businesses/${businessId}/publish`, {
    method: 'PATCH',
    body: { visible: true },
  });
}

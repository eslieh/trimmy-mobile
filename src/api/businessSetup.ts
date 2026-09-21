import { apiRequest } from './client';
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
  Service,
  ServiceCategory,
  TeamMode,
  WeeklyHours,
} from '../types/business';
import type { TeamInvitation, TeamRole } from '../types/team';

// See reference/api/business-setup.json#create-business for the contract this implements.
export type CreateBusinessInput = {
  name: string;
  categories: BusinessCategory[];
  phone: string;
  location: BusinessLocation;
};

let mockBusinessSequence = 0;

export function createBusiness(input: CreateBusinessInput): Promise<Business> {
  if (USE_MOCK_API) {
    mockBusinessSequence += 1;
    return mockDelay<Business>({
      businessId: `biz_mock_${mockBusinessSequence}`,
      name: input.name,
      categories: input.categories,
      phone: input.phone,
      location: input.location,
      status: 'draft',
      onboardingStep: 'business_basics',
    });
  }

  return apiRequest<Business>('/businesses', { method: 'POST', body: input });
}

export type UploadBusinessPhotoInput = {
  uri: string; // local file URI from the image picker
  isCover: boolean;
};

let mockPhotoSequence = 0;

// See reference/api/business-setup.json#upload-business-photo for the contract this implements.
// Multipart upload, not JSON — see that contract entry for why.
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

  const formData = new FormData();
  formData.append('photo', {
    uri: input.uri,
    name: `photo_${Date.now()}.jpg`,
    type: 'image/jpeg',
  } as unknown as Blob);
  formData.append('isCover', String(input.isCover));

  return apiRequest<BusinessPhoto>(`/businesses/${businessId}/photos`, {
    method: 'POST',
    body: formData,
  });
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
      sentAt: new Date().toISOString(),
    });
  }

  return apiRequest<TeamInvitation>(`/businesses/${businessId}/team/invitations`, {
    method: 'POST',
    body: input,
  });
}

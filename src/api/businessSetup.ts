import { apiRequest } from './client';
import { mockDelay } from './mock/delay';
import { USE_MOCK_API } from '../config/env';
import type {
  Business,
  BusinessCategory,
  BusinessLocation,
  BusinessPolicies,
  Money,
  PaymentDestination,
  Service,
  ServiceCategory,
  TeamMode,
  WeeklyHours,
} from '../types/business';

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

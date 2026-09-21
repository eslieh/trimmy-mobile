import { apiRequest } from './client';
import { mockDelay } from './mock/delay';
import { USE_MOCK_API } from '../config/env';
import type { Business, BusinessCategory, BusinessLocation } from '../types/business';

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

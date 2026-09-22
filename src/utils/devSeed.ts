import { MOCK_BUSINESS_PROFILES } from '../api/mock/discoveryData';
import { useBusinessOnboardingStore } from '../store/useBusinessOnboardingStore';
import type { OwnedBusiness } from '../store/useOwnedBusinessStore';
import type { Business, Service, ServiceCategory, TeamMode } from '../types/business';

// Dev/testing-only: builds a plausible OwnedBusiness projection from mock
// discovery data for shortcuts that skip the real onboarding wizard
// (WelcomeScreen's social login buttons, ProfileScreen's "Switch to
// hosting"). Not real auth or real business ownership — there's no actual
// connection between "which login button was tapped" and business
// ownership in a real product; this only exists to make manual testing of
// the business-owner app fast. See TASKS.md.
export function seedOwnedBusinessForTesting(seedIndex: number, teamMode: TeamMode): OwnedBusiness {
  const seed = MOCK_BUSINESS_PROFILES[seedIndex] ?? MOCK_BUSINESS_PROFILES[0];

  // Manage Business reads live from useBusinessOnboardingStore (business +
  // services + serviceCategories), not this slim OwnedBusiness projection —
  // without also seeding that store, this shortcut would land on Today but
  // "Manage business" would stay disabled (its guard checks the two stores'
  // businessId match). Converts the mock discovery profile's customer-facing
  // services shape (categoryName strings) into the owner-side shape
  // (ServiceCategory records + categoryId-linked Service records).
  const categoryNames = Array.from(new Set(seed.services.map((s) => s.categoryName)));
  const categoryIdByName = new Map(categoryNames.map((name) => [name, `svccat_seed_${seed.businessId}_${name}`]));

  const serviceCategories: ServiceCategory[] = categoryNames.map((name) => ({
    categoryId: categoryIdByName.get(name)!,
    businessId: seed.businessId,
    name,
  }));

  const services: Service[] = seed.services.map((service) => ({
    serviceId: service.serviceId,
    businessId: seed.businessId,
    categoryId: categoryIdByName.get(service.categoryName)!,
    name: service.name,
    durationMinutes: service.durationMinutes,
    price: service.price,
  }));

  const business: Business = {
    businessId: seed.businessId,
    name: seed.name,
    description: seed.description,
    categories: seed.categories,
    phone: '+254700000000',
    location: { address: seed.address, lat: seed.lat, lng: seed.lng },
    status: 'published',
    onboardingStep: 'review_publish',
    workingHours: seed.workingHours,
    policies: seed.policies,
    paymentDestination: { type: 'mpesa_till', tillNumber: '000000', verificationStatus: 'verified' },
    teamMode,
  };

  useBusinessOnboardingStore.setState({ business, serviceCategories, services });

  return {
    businessId: seed.businessId,
    name: seed.name,
    teamMode,
    workingHours: seed.workingHours,
  };
}

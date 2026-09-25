import { MOCK_BUSINESS_PROFILES } from '../api/mock/discoveryData';
import { useBusinessOnboardingStore } from '../store/useBusinessOnboardingStore';
import type { OwnedBusiness, StaffSession } from '../store/useOwnedBusinessStore';
import type { Business, Service, ServiceCategory, TeamMode } from '../types/business';
import type { TeamInvitation } from '../types/team';

// Shared by both seed helpers below — converts a mock discovery profile
// into the owner-side shape (ServiceCategory + categoryId-linked Service
// records) and writes it into useBusinessOnboardingStore, which is what
// every business-owner/staff screen actually reads from (not the slim
// OwnedBusiness/StaffSession projections, which only carry what each
// app's tab shell itself needs to decide what to show).
function seedBusinessData(seed: (typeof MOCK_BUSINESS_PROFILES)[number], teamMode: TeamMode): void {
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
}

// Dev/testing-only: builds a plausible OwnedBusiness projection from mock
// discovery data for shortcuts that skip the real onboarding wizard
// (WelcomeScreen's social login buttons, ProfileScreen's "Switch to
// hosting"). Not real auth or real business ownership — there's no actual
// connection between "which login button was tapped" and business
// ownership in a real product; this only exists to make manual testing of
// the business-owner app fast. See TASKS.md.
export function seedOwnedBusinessForTesting(seedIndex: number, teamMode: TeamMode): OwnedBusiness {
  const seed = MOCK_BUSINESS_PROFILES[seedIndex] ?? MOCK_BUSINESS_PROFILES[0];
  seedBusinessData(seed, teamMode);

  return {
    businessId: seed.businessId,
    name: seed.name,
    teamMode,
    workingHours: seed.workingHours,
  };
}

// Fixed id so re-tapping the test button updates the same record instead
// of piling up duplicates.
const SELF_STAFF_INVITATION_ID = 'inv_self_test';

// Dev/testing-only, same spirit as seedOwnedBusinessForTesting above but
// for the staff app: seeds a team-mode business (staff only makes sense
// there) and ensures a single deterministic "you" TeamInvitation exists —
// role 'staff', already 'accepted' (skipping the real invite/accept flow,
// which isn't reachable from this shortcut) — so the staff app's "my
// schedule"/"my earnings" screens have a real invitationId to scope
// bookings to. Reuses whatever's already seeded if this business already
// has team members from prior testing, rather than clearing them.
export function seedSelfAsStaffForTesting(seedIndex: number, displayName: string): StaffSession {
  const seed = MOCK_BUSINESS_PROFILES[seedIndex] ?? MOCK_BUSINESS_PROFILES[0];
  seedBusinessData(seed, 'team');

  const selfInvitation: TeamInvitation = {
    invitationId: SELF_STAFF_INVITATION_ID,
    businessId: seed.businessId,
    name: displayName,
    role: 'staff',
    status: 'accepted',
    commissionPercent: 40,
    workingDays: null,
    sentAt: new Date().toISOString(),
  };

  useBusinessOnboardingStore.setState((state) => ({
    invitations: [selfInvitation, ...state.invitations.filter((i) => i.invitationId !== SELF_STAFF_INVITATION_ID)],
  }));

  return {
    businessId: seed.businessId,
    businessName: seed.name,
    invitationId: SELF_STAFF_INVITATION_ID,
  };
}

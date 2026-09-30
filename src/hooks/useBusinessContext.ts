import { useMemo } from 'react';
import { useBusinessOnboardingStore } from '../store/useBusinessOnboardingStore';
import { useFrontDeskStore } from '../store/useFrontDeskStore';
import { useOwnedBusinessStore } from '../store/useOwnedBusinessStore';
import { bookableStaff, teamMemberDisplayName } from '../utils/team';
import type { Money, TeamMode, WeeklyHours } from '../types/business';

export type ContextService = {
  serviceId: string;
  categoryId: string;
  name: string;
  durationMinutes: number;
  price: Money;
};

// The business the business-side screens (Today, Calendar, walk-in,
// schedule, appointment detail, customers, queues) are working on, in one
// shape whether the user is its owner or its front desk:
//   owner      → the owned-business slot + the setup store (full detail,
//                team roster);
//   front desk → the staff session + the public profile (useFrontDeskStore),
//                since the owner-only endpoints are off limits.
export type BusinessContext = {
  role: 'owner' | 'front_desk';
  businessId: string;
  name: string;
  teamMode: TeamMode;
  workingHours: WeeklyHours;
  serviceCategories: { categoryId: string; name: string }[];
  services: ContextService[];
  staff: { staffId: string; name: string }[]; // who bookings can be assigned to
};

export function useBusinessContext(): BusinessContext | null {
  const activeMode = useOwnedBusinessStore((s) => s.activeMode);
  const owned = useOwnedBusinessStore((s) => s.business);
  const staffSession = useOwnedBusinessStore((s) => s.staffSession);
  const categories = useBusinessOnboardingStore((s) => s.serviceCategories);
  const services = useBusinessOnboardingStore((s) => s.services);
  const invitations = useBusinessOnboardingStore((s) => s.invitations);
  const profile = useFrontDeskStore((s) => s.profile);

  return useMemo(() => {
    if (activeMode === 'front_desk') {
      if (!staffSession || !profile || profile.businessId !== staffSession.businessId) return null;
      // The profile groups services by category name only.
      const categoryNames = [...new Set(profile.services.map((service) => service.categoryName))];
      return {
        role: 'front_desk',
        businessId: staffSession.businessId,
        name: profile.name,
        teamMode: 'team',
        workingHours: profile.workingHours,
        serviceCategories: categoryNames.map((name) => ({ categoryId: name, name })),
        services: profile.services.map((service) => ({
          serviceId: service.serviceId,
          categoryId: service.categoryName,
          name: service.name,
          durationMinutes: service.durationMinutes,
          price: service.price,
        })),
        staff: profile.staff
          .filter((member) => member.role !== 'front_desk')
          .map((member) => ({ staffId: member.staffId, name: member.name })),
      };
    }

    if (!owned) return null;
    return {
      role: 'owner',
      businessId: owned.businessId,
      name: owned.name,
      teamMode: owned.teamMode,
      workingHours: owned.workingHours,
      serviceCategories: categories.map((category) => ({ categoryId: category.categoryId, name: category.name })),
      services,
      staff: bookableStaff(invitations).map((member) => ({
        staffId: member.staffId,
        name: teamMemberDisplayName(member),
      })),
    };
  }, [activeMode, owned, staffSession, profile, categories, services, invitations]);
}

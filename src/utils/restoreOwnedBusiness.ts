import type { Href } from 'expo-router';
import { authApi } from '../api/auth';
import { getBusiness } from '../api/businessSetup';
import { useBusinessOnboardingStore } from '../store/useBusinessOnboardingStore';
import { useOwnedBusinessStore } from '../store/useOwnedBusinessStore';
import type { OnboardingStep, TeamMode } from '../types/business';

// Rebuilds the owner's business from the server after login, so a fresh
// install (or restart, or second device) gets back to where they were:
//   - published → the business-app screens (Manage, Team…) have their data,
//     and the owned-business slot is set so they can switch into it;
//   - draft → the wizard store holds it, so setup can resume at the next
//     step (see nextSetupRoute).
// Doesn't change activeMode: switching modes stays a manual action.
export async function restoreOwnedBusiness(): Promise<void> {
  const businesses = await authApi.listMyBusinesses();
  const owned =
    businesses.find((b) => b.role === 'owner' && b.status === 'published') ??
    businesses.find((b) => b.role === 'owner');
  if (!owned) return;

  const detail = await getBusiness(owned.businessId);
  const onboarding = useBusinessOnboardingStore.getState();
  onboarding.hydrateFromServer(detail);
  if (detail.teamMode === 'team') {
    await onboarding.loadTeamMembers(detail.businessId).catch(() => {});
  }

  if (detail.status === 'published' && detail.teamMode && detail.workingHours) {
    useOwnedBusinessStore.getState().setOwnedBusiness({
      businessId: detail.businessId,
      name: detail.name,
      teamMode: detail.teamMode,
      workingHours: detail.workingHours.weeklyHours,
    });
  }
}

// onboardingStep is the last step the server has saved — resume at the one
// after it.
export function nextSetupRoute(step: OnboardingStep, teamMode: TeamMode | undefined): Href {
  switch (step) {
    case 'business_basics':
      return '/business-photos';
    case 'photos':
      return '/business-hours';
    case 'working_hours':
      return '/business-services';
    case 'services':
      return '/business-policies';
    case 'policies':
      return '/business-payment';
    case 'payment_destination':
      return '/business-team-mode';
    case 'team_mode':
      return teamMode === 'team' ? '/business-team-invite' : '/business-review';
    case 'review_publish':
      return '/business-review';
  }
}

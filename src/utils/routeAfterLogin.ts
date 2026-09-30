import type { Href, useRouter } from 'expo-router';
import { restoreOwnedBusiness } from './restoreOwnedBusiness';
import { useOwnedBusinessStore } from '../store/useOwnedBusinessStore';
import { listMyInvitations } from '../api/team';

type Router = ReturnType<typeof useRouter>;

// Where a signed-in user belongs, by role (GET /me/businesses via
// restoreOwnedBusiness): an owner with a published business → the business
// app; staff → their schedule in the staff app; front desk → the front desk
// app; anyone else → `fallback`
// (the customer app, or Get Started right after signing up). Replaces the
// whole stack so Back can't return to the auth screens.
export async function routeAfterLogin(router: Router, fallback: Href = '/explore'): Promise<void> {
  try {
    await restoreOwnedBusiness();
  } catch {
    // Offline or the lookup failed — still let them into the app.
  }

  const { business, staffSession, setActiveMode } = useOwnedBusinessStore.getState();
  let target: Href = fallback;
  if (business) {
    setActiveMode('business');
    target = business.teamMode === 'solo' ? '/today' : '/earnings';
  } else if (staffSession?.role === 'staff') {
    setActiveMode('staff');
    target = '/staff/today';
  } else if (staffSession?.role === 'front_desk') {
    setActiveMode('front_desk');
    target = '/front-desk/today';
  } else {
    setActiveMode('customer');
    // Invited to a team but not in one yet: Get Started, where the invite
    // can be accepted, instead of the customer app.
    const invitations = await listMyInvitations().catch(() => []);
    if (invitations.length > 0) target = '/get-started';
  }

  if (router.canDismiss()) router.dismissAll();
  router.replace(target);
}

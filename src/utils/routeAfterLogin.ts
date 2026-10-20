import type { Href, useRouter } from 'expo-router';
import { restoreOwnedBusiness } from './restoreOwnedBusiness';
import { useAppTransitionStore } from '../store/useAppTransitionStore';
import { useOwnedBusinessStore, type AppMode } from '../store/useOwnedBusinessStore';
import { clearModeState, homeFor } from './switchMode';

type Router = ReturnType<typeof useRouter>;

// A notification tapped before the post-login redirect finished (cold start
// from a push): opened once the redirect has replaced the stack, so it
// isn't wiped out by it. See components/NotificationTapRouter.
let redirectDone = false;
let pendingRoute: { route: Href; apply: () => void } | null = null;

export function openAfterLoginRedirect(route: Href, apply: () => void, router: Router): void {
  if (redirectDone) {
    apply();
    router.push(route);
  } else {
    pendingRoute = { route, apply };
  }
}

// Where a signed-in user belongs, by role (GET /me/businesses via
// restoreOwnedBusiness): an owner with a published business → the business
// app; staff → their schedule; front desk → the front desk app; anyone else
// → `fallback`, the customer app. Team invitations don't detour here any
// more: the invitation sheet (components/InvitationSheet) offers them in the
// app. The app logo covers the lookup, and the whole stack is replaced so
// Back can't return to the auth screens.
export async function routeAfterLogin(router: Router, fallback: Href = '/explore'): Promise<void> {
  useAppTransitionStore.getState().show('Getting things ready…');
  try {
    await restoreOwnedBusiness();
  } catch {
    // Offline or the lookup failed — still let them into the app.
  }

  const { business, staffSession } = useOwnedBusinessStore.getState();
  let mode: AppMode = 'customer';
  if (business) mode = 'business';
  else if (staffSession?.role === 'staff') mode = 'staff';
  else if (staffSession?.role === 'front_desk') mode = 'front_desk';

  clearModeState();
  useOwnedBusinessStore.getState().setActiveMode(mode);
  if (router.canDismiss()) router.dismissAll();
  router.replace(mode === 'customer' ? fallback : homeFor(mode));

  redirectDone = true;
  if (pendingRoute) {
    const { route, apply } = pendingRoute;
    pendingRoute = null;
    apply();
    router.push(route);
  }
  // Let the first screen mount behind the logo before showing it.
  setTimeout(() => useAppTransitionStore.getState().hide(), 300);
}

// A session reopened from the device: back into the mode they were in (if
// its workplace is still there), with no network wait. The server check runs
// in the background (AuthContext → restoreOwnedBusiness) and SessionGuard
// moves them if it disagrees.
export function resumeSession(router: Router): void {
  const { activeMode, business, staffSession } = useOwnedBusinessStore.getState();
  const usable =
    (activeMode === 'business' && business) ||
    ((activeMode === 'staff' || activeMode === 'front_desk') && staffSession) ||
    activeMode === 'customer';
  const mode: AppMode = usable ? activeMode : 'customer';
  useOwnedBusinessStore.getState().setActiveMode(mode);
  if (router.canDismiss()) router.dismissAll();
  router.replace(homeFor(mode));
  redirectDone = true;
  if (pendingRoute) {
    const { route, apply } = pendingRoute;
    pendingRoute = null;
    apply();
    router.push(route);
  }
}

import type { Href, useRouter } from 'expo-router';
import { useAppTransitionStore } from '../store/useAppTransitionStore';
import { useBookingDraftStore } from '../store/useBookingDraftStore';
import { useBookingsStore } from '../store/useBookingsStore';
import { useCustomersStore } from '../store/useCustomersStore';
import { useOwnedBusinessStore, type AppMode } from '../store/useOwnedBusinessStore';
import { usePayoutsStore } from '../store/usePayoutsStore';
import { useToastStore } from '../store/useToastStore';

type Router = ReturnType<typeof useRouter>;

// Long enough for the new mode's first screen to mount behind the logo, so
// it never flashes in half-built; short enough not to feel like a wait.
const MIN_TRANSITION_MS = 450;

// Where each mode opens.
export function homeFor(mode: AppMode): Href {
  const { business } = useOwnedBusinessStore.getState();
  switch (mode) {
    case 'business':
      return business?.teamMode === 'team' && !business.staffId ? '/earnings' : '/today';
    case 'staff':
      return '/staff/today';
    case 'front_desk':
      return '/front-desk/today';
    default:
      return '/explore';
  }
}

// Data cached for one mode that another must not show: bookings (a business's
// calendar vs. nothing for a customer), customers, payouts, an unfinished
// booking draft, queued toasts. Each mode loads its own on focus.
export function clearModeState(): void {
  useBookingsStore.setState({ bookings: [] });
  useCustomersStore.setState({ customers: [] });
  usePayoutsStore.setState({ payouts: [] });
  useBookingDraftStore.getState().reset();
  useToastStore.getState().clear();
}

// The one way to change app mode: the logo covers the change, the old mode's
// data and screens go, and the new mode opens on its home tab with a fresh
// stack (so Back can't return to the other mode).
export function switchMode(router: Router, mode: AppMode, options: { route?: Href; message?: string } = {}): void {
  const transition = useAppTransitionStore.getState();
  transition.show(options.message ?? '');
  clearModeState();
  useOwnedBusinessStore.getState().setActiveMode(mode);
  if (router.canDismiss()) router.dismissAll();
  router.replace(options.route ?? homeFor(mode));
  setTimeout(() => useAppTransitionStore.getState().hide(), MIN_TRANSITION_MS);
}

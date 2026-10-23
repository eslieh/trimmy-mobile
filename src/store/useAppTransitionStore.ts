import { create } from 'zustand';

// The full-screen logo shown while the app does work the user shouldn't see
// half-done: restoring their business after login, or switching app modes
// (components/AppTransitionOverlay). `message` null = hidden.
type AppTransitionState = {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
};

export const useAppTransitionStore = create<AppTransitionState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  hide: () => set({ message: null }),
}));

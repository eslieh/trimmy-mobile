import { create } from 'zustand';

const MAX_RECENTLY_VIEWED = 10;

type RecentlyViewedState = {
  businessIds: string[];
  recordView: (businessId: string) => void;
};

// Client-only, in-memory (resets on app restart) — powers Explore's
// "Recently viewed" section. BusinessProfileScreen calls recordView on mount.
export const useRecentlyViewedStore = create<RecentlyViewedState>((set) => ({
  businessIds: [],
  recordView: (businessId) =>
    set((state) => ({
      businessIds: [businessId, ...state.businessIds.filter((id) => id !== businessId)].slice(
        0,
        MAX_RECENTLY_VIEWED,
      ),
    })),
}));

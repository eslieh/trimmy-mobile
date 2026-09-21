import { create } from 'zustand';

type FavoritesState = {
  businessIds: Set<string>;
  isFavorite: (businessId: string) => boolean;
  toggleFavorite: (businessId: string) => void;
};

// Client-only for now — no favorites endpoint exists yet (see
// reference/customer.md's Profile & preferences capability). In-memory only,
// so it resets on app restart; swap for a persisted/synced store once a
// backend endpoint exists.
export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  businessIds: new Set(),
  isFavorite: (businessId) => get().businessIds.has(businessId),
  toggleFavorite: (businessId) =>
    set((state) => {
      const next = new Set(state.businessIds);
      if (next.has(businessId)) {
        next.delete(businessId);
      } else {
        next.add(businessId);
      }
      return { businessIds: next };
    }),
}));

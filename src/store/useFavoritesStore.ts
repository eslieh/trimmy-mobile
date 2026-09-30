import { create } from 'zustand';
import { getFavorites, setBusinessFavorite, setStaffFavorite, type FavoriteStaff } from '../api/favorites';
import { showApiError } from '../utils/showApiError';
import type { BusinessSummary } from '../types/discovery';

// Saved businesses and staff (C1). Signed in: synced with the server
// (GET/PUT/DELETE /me/favorites) — loaded after login by AuthContext,
// cleared on logout — so the Wishlist survives reinstalls and devices.
// Signed out: kept on this device only, as before.
type FavoritesState = {
  synced: boolean; // true while signed in and loaded from the server
  businessIds: Set<string>;
  staffIds: Set<string>;
  businesses: BusinessSummary[]; // full cards for the Wishlist (server only)
  staff: FavoriteStaff[];
  isFavorite: (businessId: string) => boolean;
  isStaffFavorite: (staffId: string) => boolean;
  toggleFavorite: (businessId: string) => void;
  toggleStaffFavorite: (staffId: string) => void;
  load: () => Promise<void>;
  clear: () => void;
};

function toggled(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  synced: false,
  businessIds: new Set(),
  staffIds: new Set(),
  businesses: [],
  staff: [],
  isFavorite: (businessId) => get().businessIds.has(businessId),
  isStaffFavorite: (staffId) => get().staffIds.has(staffId),

  // Update the screen first (the calls are idempotent); undo on failure.
  toggleFavorite: (businessId) => {
    const wasFavorite = get().businessIds.has(businessId);
    set((state) => ({
      businessIds: toggled(state.businessIds, businessId),
      businesses: wasFavorite ? state.businesses.filter((b) => b.businessId !== businessId) : state.businesses,
    }));
    if (!get().synced) return;
    setBusinessFavorite(businessId, !wasFavorite)
      .then(() => {
        // A new save needs its card for the Wishlist.
        if (!wasFavorite) get().load().catch(() => {});
      })
      .catch((err) => {
        set((state) => ({ businessIds: toggled(state.businessIds, businessId) }));
        showApiError("Couldn't update your wishlist", err);
      });
  },
  toggleStaffFavorite: (staffId) => {
    const wasFavorite = get().staffIds.has(staffId);
    set((state) => ({
      staffIds: toggled(state.staffIds, staffId),
      staff: wasFavorite ? state.staff.filter((s) => s.staffId !== staffId) : state.staff,
    }));
    if (!get().synced) return;
    setStaffFavorite(staffId, !wasFavorite)
      .then(() => {
        if (!wasFavorite) get().load().catch(() => {});
      })
      .catch((err) => {
        set((state) => ({ staffIds: toggled(state.staffIds, staffId) }));
        showApiError("Couldn't update your wishlist", err);
      });
  },

  load: async () => {
    const { businesses, staff } = await getFavorites();
    set({
      synced: true,
      businesses,
      staff,
      businessIds: new Set(businesses.map((b) => b.businessId)),
      staffIds: new Set(staff.map((s) => s.staffId)),
    });
  },
  clear: () => set({ synced: false, businessIds: new Set(), staffIds: new Set(), businesses: [], staff: [] }),
}));

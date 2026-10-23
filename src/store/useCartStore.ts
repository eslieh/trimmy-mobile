import { create } from 'zustand';

type CartState = {
  businessId: string | null;
  quantities: Record<string, number>;
  add: (businessId: string, serviceId: string) => void;
  remove: (businessId: string, serviceId: string) => void;
  quantityOf: (serviceId: string) => number;
  totalCount: () => number;
  clear: () => void;
};

// Client-only, single-business cart — Trimmy doesn't support checking out
// services from two businesses at once, so adding a service from a
// different business than the one already in the cart replaces it rather
// than merging. No checkout/booking endpoint exists yet; BusinessServicesScreen
// routes "Continue" to the shared success-screen stub, same pattern as the
// old "Book now" button used.
export const useCartStore = create<CartState>((set, get) => ({
  businessId: null,
  quantities: {},
  add: (businessId, serviceId) =>
    set((state) => {
      const quantities = state.businessId === businessId ? { ...state.quantities } : {};
      quantities[serviceId] = (quantities[serviceId] ?? 0) + 1;
      return { businessId, quantities };
    }),
  remove: (businessId, serviceId) =>
    set((state) => {
      if (state.businessId !== businessId) return state;
      const quantities = { ...state.quantities };
      const current = quantities[serviceId] ?? 0;
      if (current <= 1) {
        delete quantities[serviceId];
      } else {
        quantities[serviceId] = current - 1;
      }
      return { quantities };
    }),
  quantityOf: (serviceId) => get().quantities[serviceId] ?? 0,
  totalCount: () => Object.values(get().quantities).reduce((sum, quantity) => sum + quantity, 0),
  clear: () => set({ businessId: null, quantities: {} }),
}));

import { create } from 'zustand';
import type { Customer } from '../types/customer';

export type SaveCustomerInput = {
  name: string;
  phone: string | null;
  email: string | null;
};

type CustomersState = {
  customers: Customer[];
  saveCustomer: (businessId: string, input: SaveCustomerInput) => Customer;
};

let customerSequence = 0;

// Client-only, in-memory — no backend endpoint exists yet, same caveat as
// useBookingsStore/useFavoritesStore. Dedupes by phone within a business
// (the closest thing to a stable identifier this mock data has): typing an
// existing customer's phone again updates their name/email instead of
// creating a duplicate row.
export const useCustomersStore = create<CustomersState>((set, get) => ({
  customers: [],
  saveCustomer: (businessId, input) => {
    const existing = input.phone
      ? get().customers.find((c) => c.businessId === businessId && c.phone === input.phone)
      : undefined;

    if (existing) {
      const updated: Customer = { ...existing, name: input.name, email: input.email ?? existing.email };
      set((state) => ({
        customers: state.customers.map((c) => (c.customerId === existing.customerId ? updated : c)),
      }));
      return updated;
    }

    customerSequence += 1;
    const created: Customer = {
      customerId: `customer_mock_${customerSequence}`,
      businessId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ customers: [...state.customers, created] }));
    return created;
  },
}));

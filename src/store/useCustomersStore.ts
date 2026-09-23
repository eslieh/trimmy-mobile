import { create } from 'zustand';
import { saveCustomer as saveCustomerApi } from '../api/customers';
import type { Customer } from '../types/customer';

export type SaveCustomerInput = {
  name: string;
  phone: string | null;
  email: string | null;
};

type CustomersState = {
  customers: Customer[];
  saveCustomer: (businessId: string, input: SaveCustomerInput) => Promise<Customer>;
};

// Client-only, in-memory — no real fetch-on-mount exists yet, same caveat as
// useBookingsStore/useFavoritesStore (this only ever reflects what this
// session itself saved). The write itself does go through the mock API
// layer, though (see src/api/customers.ts), same as every other store's
// writes. Dedupes by phone within a business (the closest thing to a stable
// identifier this mock data has): saving with an existing customer's phone
// updates their name/email instead of creating a duplicate row.
export const useCustomersStore = create<CustomersState>((set, get) => ({
  customers: [],
  saveCustomer: async (businessId, input) => {
    const existing = input.phone
      ? get().customers.find((c) => c.businessId === businessId && c.phone === input.phone)
      : undefined;

    const saved = await saveCustomerApi(businessId, {
      customerId: existing?.customerId,
      name: input.name,
      phone: input.phone,
      email: input.email ?? existing?.email ?? null,
    });

    set((state) => ({
      customers: existing
        ? state.customers.map((c) => (c.customerId === saved.customerId ? saved : c))
        : [...state.customers, saved],
    }));

    return saved;
  },
}));

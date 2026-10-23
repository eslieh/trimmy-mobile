import { create } from 'zustand';
import { listCustomers as listCustomersApi, saveCustomer as saveCustomerApi } from '../api/customers';
import type { Customer } from '../types/customer';

export type SaveCustomerInput = {
  name: string;
  phone: string | null;
  email: string | null;
};

type CustomersState = {
  customers: Customer[];
  // Server → cache (list-customers). The Customers screen calls this on focus.
  loadCustomers: (businessId: string, query?: string) => Promise<void>;
  saveCustomer: (businessId: string, input: SaveCustomerInput & { customerId?: string }) => Promise<Customer>;
};

// A cache of the server's customer list (see api/customers.ts). The server
// dedupes by phone, so saving just sends what was typed.
export const useCustomersStore = create<CustomersState>((set) => ({
  customers: [],
  loadCustomers: async (businessId, query) => {
    const { customers } = await listCustomersApi(businessId, { query });
    set({ customers });
  },
  saveCustomer: async (businessId, input) => {
    const saved = await saveCustomerApi(businessId, input);
    set((state) => ({
      customers: state.customers.some((c) => c.customerId === saved.customerId)
        ? state.customers.map((c) => (c.customerId === saved.customerId ? saved : c))
        : [...state.customers, saved],
    }));
    return saved;
  },
}));

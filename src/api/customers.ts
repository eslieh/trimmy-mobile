import { apiRequest } from './client';
import { mockDelay } from './mock/delay';
import { USE_MOCK_FULFILLMENT } from '../config/env';
import type { Customer } from '../types/customer';

// See reference/api/fulfillment.json#save-customer for the contract this
// implements. `customerId` present = updating an existing customer
// (useCustomersStore already resolved the dedupe-by-phone match before
// calling this); absent = creating a new one.
export type SaveCustomerInput = {
  customerId?: string;
  name: string;
  phone: string | null;
  email: string | null;
};

let mockCustomerSequence = 0;

export function saveCustomer(businessId: string, input: SaveCustomerInput): Promise<Customer> {
  if (USE_MOCK_FULFILLMENT) {
    const customerId = input.customerId ?? `customer_mock_${(mockCustomerSequence += 1)}`;
    return mockDelay<Customer>({
      customerId,
      businessId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      createdAt: new Date().toISOString(),
    });
  }

  return apiRequest<Customer>(`/businesses/${businessId}/customers`, { method: 'POST', body: input });
}

// `list-customers` is documented in reference/api/fulfillment.json for the
// real backend but has no mock implementation here — same as
// list-service-categories in businessSetup.ts, which has the same gap.
// CustomersScreen reads useCustomersStore directly (no fetch-on-mount, same
// pattern every other post-publish store in this app already uses).

import { apiRequest, toQueryString } from './client';
import { mockDelay } from './mock/delay';
import { USE_MOCK_CUSTOMERS } from '../config/env';
import type { Customer } from '../types/customer';

// See reference/api/fulfillment.json#save-customer. With customerId:
// updates that customer. Without: the server updates whoever already has
// that phone (any format), otherwise creates one. Customers without a phone
// are allowed and aren't deduplicated. 409 phone_taken if updating to a
// phone another customer has.
export type SaveCustomerInput = {
  customerId?: string;
  name: string;
  phone: string | null;
  email: string | null;
};

let mockCustomerSequence = 0;

export function saveCustomer(businessId: string, input: SaveCustomerInput): Promise<Customer> {
  if (USE_MOCK_CUSTOMERS) {
    const customerId = input.customerId ?? `customer_mock_${(mockCustomerSequence += 1)}`;
    return mockDelay<Customer>({
      customerId,
      businessId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      createdAt: new Date().toISOString(),
      bookingsCount: 0,
      lastBookingAt: null,
    });
  }

  return apiRequest<Customer>(`/businesses/${businessId}/customers`, { method: 'POST', body: input });
}

// See reference/api/fulfillment.json#list-customers. The list fills itself
// from bookings (every booking with a phone adds or refreshes that person),
// so the app never needs to save a customer after booking. A–Z; query
// searches name, email and phone digits.
export function listCustomers(
  businessId: string,
  options: { query?: string; limit?: number; offset?: number } = {},
): Promise<{ customers: Customer[]; total: number }> {
  if (USE_MOCK_CUSTOMERS) {
    return mockDelay({ customers: [], total: 0 });
  }

  const qs = toQueryString([
    ['query', options.query || undefined],
    ['limit', options.limit ?? 100],
    ['offset', options.offset],
  ]);
  return apiRequest(`/businesses/${businessId}/customers?${qs}`);
}

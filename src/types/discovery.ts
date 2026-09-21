import type { BusinessCategory, Money } from './business';

// Card shown in "near me" results / search results — a lighter projection
// of a business than the full profile, per reference/customer.md C1.
export type BusinessSummary = {
  businessId: string;
  name: string;
  categories: BusinessCategory[];
  thumbnailUrl: string;
  address: string;
  distanceKm: number;
  startingPrice: Money;
  rating: number;
  reviewCount: number;
};

export type BusinessProfileService = {
  serviceId: string;
  categoryName: string;
  name: string;
  durationMinutes: number;
  price: Money;
};

export type BusinessProfileStaffMember = {
  staffId: string;
  name: string;
  role: string;
  rating: number;
};

export type BusinessProfileReview = {
  reviewId: string;
  authorName: string;
  rating: number;
  text: string;
  createdAt: string;
};

// The full customer-facing profile — what C1's "tapping a result opens a
// business profile" and the Business Profile candidate screen need.
export type BusinessProfile = {
  businessId: string;
  name: string;
  description: string;
  categories: BusinessCategory[];
  photos: string[];
  rating: number;
  reviewCount: number;
  address: string;
  lat: number;
  lng: number;
  depositSummary: string;
  cancellationSummary: string;
  services: BusinessProfileService[];
  staff: BusinessProfileStaffMember[];
  reviews: BusinessProfileReview[];
};

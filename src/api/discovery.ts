import { apiRequest } from './client';
import { mockDelay } from './mock/delay';
import { MOCK_BUSINESS_PROFILES } from './mock/discoveryData';
import { USE_MOCK_API } from '../config/env';
import type { BusinessCategory } from '../types/business';
import type { BusinessProfile, BusinessSummary } from '../types/discovery';

// See reference/api/discovery.json#search-businesses for the contract this implements.
export type SearchBusinessesParams = {
  lat?: number;
  lng?: number;
  query?: string;
  category?: BusinessCategory;
  priceMax?: number;
  ratingMin?: number;
  radiusKm?: number;
};

function toSummary(profile: BusinessProfile, distanceKm: number): BusinessSummary {
  const startingPrice = profile.services.reduce(
    (min, service) => (service.price.amount < min.amount ? service.price : min),
    profile.services[0]?.price ?? { amount: 0, currency: 'KES' as const },
  );

  return {
    businessId: profile.businessId,
    name: profile.name,
    categories: profile.categories,
    thumbnailUrl: profile.photos[0] ?? '',
    photos: profile.photos,
    address: profile.address,
    lat: profile.lat,
    lng: profile.lng,
    distanceKm,
    startingPrice,
    rating: profile.rating,
    reviewCount: profile.reviewCount,
  };
}

// Deterministic mock "distance" from the seed data's fixed coordinates —
// close enough for browsing a mock list, not real geodistance.
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export function searchBusinesses(params: SearchBusinessesParams): Promise<BusinessSummary[]> {
  if (USE_MOCK_API) {
    const query = params.query?.trim().toLowerCase();

    const filtered = MOCK_BUSINESS_PROFILES.filter((profile) => {
      const matchesQuery =
        !query ||
        profile.name.toLowerCase().includes(query) ||
        profile.services.some((s) => s.name.toLowerCase().includes(query));
      const matchesCategory = !params.category || profile.categories.includes(params.category);
      const matchesRating = !params.ratingMin || profile.rating >= params.ratingMin;
      const matchesPrice =
        !params.priceMax || profile.services.some((s) => s.price.amount <= params.priceMax!);
      return matchesQuery && matchesCategory && matchesRating && matchesPrice;
    });

    const hasCoords = params.lat !== undefined && params.lng !== undefined;

    const summaries = filtered
      .map((profile) => {
        const distanceKm = hasCoords
          ? haversineKm(params.lat!, params.lng!, profile.lat, profile.lng)
          : Math.round((1 + Math.random() * 8) * 10) / 10;
        return toSummary(profile, distanceKm);
      })
      // Only meaningful with real coordinates — the fallback distance above
      // is a random placeholder, not something a radius filter should apply to.
      .filter((summary) => !hasCoords || !params.radiusKm || summary.distanceKm <= params.radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return mockDelay(summaries);
  }

  const query = new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined) acc[key] = String(value);
      return acc;
    }, {}),
  ).toString();

  return apiRequest<{ businesses: BusinessSummary[] }>(`/businesses/search?${query}`).then((res) => res.businesses);
}

// Not a distinct backend endpoint — just search-businesses with no filters,
// re-ordered to match `ids` (most-recent-first for Explore's "Recently
// viewed" section, backed by the client-only useRecentlyViewedStore).
export async function getBusinessesByIds(ids: string[]): Promise<BusinessSummary[]> {
  if (ids.length === 0) return [];
  const all = await searchBusinesses({});
  const byId = new Map(all.map((business) => [business.businessId, business]));
  return ids.map((id) => byId.get(id)).filter((business): business is BusinessSummary => business !== undefined);
}

// See reference/api/discovery.json#get-business-profile for the contract this implements.
export function getBusinessProfile(businessId: string): Promise<BusinessProfile> {
  if (USE_MOCK_API) {
    const profile = MOCK_BUSINESS_PROFILES.find((p) => p.businessId === businessId);
    if (!profile) {
      return Promise.reject(new Error('Business not found'));
    }
    return mockDelay(profile);
  }

  return apiRequest<BusinessProfile>(`/businesses/${businessId}/profile`);
}

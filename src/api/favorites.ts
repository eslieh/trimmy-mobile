import { apiRequest } from './client';
import type { BusinessSummary } from '../types/discovery';

// See reference/api/discovery.json#favorites. Any signed-in user. PUT and
// DELETE are idempotent (204), so the app updates the screen first.
export type FavoriteStaff = {
  staffId: string;
  name: string;
  businessId: string;
  businessName: string;
  avatarUrl: string | null;
  role: string;
  rating: number;
};

// Newest saved first. Businesses use the search result shape (distanceKm 0).
export function getFavorites(): Promise<{ businesses: BusinessSummary[]; staff: FavoriteStaff[] }> {
  return apiRequest('/me/favorites');
}

export function setBusinessFavorite(businessId: string, favorite: boolean): Promise<void> {
  return apiRequest<void>(`/me/favorites/businesses/${businessId}`, { method: favorite ? 'PUT' : 'DELETE' });
}

export function setStaffFavorite(staffId: string, favorite: boolean): Promise<void> {
  return apiRequest<void>(`/me/favorites/staff/${staffId}`, { method: favorite ? 'PUT' : 'DELETE' });
}

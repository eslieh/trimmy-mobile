import { apiRequest } from './client';
import type { BusinessProfileReview, ReviewPage } from '../types/discovery';

// Reviews (reference/api/discovery.json#list-reviews, auth.json#my-reviews,
// fulfillment.json#reply-to-review).

export function listBusinessReviews(
  businessId: string,
  options: { staffId?: string; unreplied?: boolean; limit?: number; offset?: number } = {},
): Promise<ReviewPage> {
  const query = new URLSearchParams({ limit: String(options.limit ?? 20), offset: String(options.offset ?? 0) });
  if (options.staffId) query.set('staffId', options.staffId);
  if (options.unreplied) query.set('unreplied', 'true');
  return apiRequest<ReviewPage>(`/businesses/${businessId}/reviews?${query}`);
}

export function listMyReviews(limit = 50): Promise<ReviewPage> {
  return apiRequest<ReviewPage>(`/me/reviews?limit=${limit}`);
}

// Owner or front desk. text null removes the reply.
export function replyToReview(reviewId: string, text: string | null): Promise<BusinessProfileReview> {
  return apiRequest<BusinessProfileReview>(`/reviews/${reviewId}/reply`, text === null
    ? { method: 'DELETE' }
    : { method: 'PUT', body: { text } });
}

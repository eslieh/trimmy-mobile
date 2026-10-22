import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { ApiError, apiRequest } from './client';
import { mockDelay } from './mock/delay';
import { USE_MOCK_API } from '../config/env';

// A staff member's portfolio: photos of their work, shown on their profile.
// The member manages their own; the owner manages anyone's.
// Server: /businesses/{businessId}/staff/{staffId}/portfolio.

export type PortfolioPhoto = {
  photoId: string;
  staffId: string;
  url: string;
  createdAt: string;
};

export type Portfolio = {
  staffId: string;
  photos: PortfolioPhoto[]; // newest first
  maxPhotos: number;
};

const base = (businessId: string, staffId: string) => `/businesses/${businessId}/staff/${staffId}/portfolio`;

let mockPhotos: PortfolioPhoto[] = [];

export function getPortfolio(businessId: string, staffId: string): Promise<Portfolio> {
  if (USE_MOCK_API) {
    return mockDelay<Portfolio>({ staffId, photos: mockPhotos.filter((p) => p.staffId === staffId), maxPhotos: 30 });
  }
  return apiRequest<Portfolio>(base(businessId, staffId));
}

// Same three steps as business photos (businessSetup.ts#uploadViaPresignedUrl):
// ask for a presigned URL, PUT the bytes straight to storage, then complete.
// A server without direct uploads (local storage, 501) gets a multipart POST.
export async function uploadPortfolioPhoto(businessId: string, staffId: string, uri: string): Promise<PortfolioPhoto> {
  if (USE_MOCK_API) {
    const photo = { photoId: `portfolio_mock_${Date.now()}`, staffId, url: uri, createdAt: new Date().toISOString() };
    mockPhotos = [photo, ...mockPhotos];
    return mockDelay(photo);
  }

  const file = new File(uri);
  // The picker crops + compresses, which outputs JPEG; PNG only if that's what we got.
  const contentType = file.type === 'image/png' || uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

  let grant: { uploadUrl: string; headers: Record<string, string>; key: string };
  try {
    grant = await apiRequest(`${base(businessId, staffId)}/upload-url`, {
      method: 'POST',
      body: { contentType, sizeBytes: file.size },
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 501) {
      const form = new FormData();
      // A File (expo/fetch rejects React Native's { uri, name, type } parts).
      form.append('photo', file as unknown as Blob);
      return apiRequest<PortfolioPhoto>(base(businessId, staffId), { method: 'POST', body: form });
    }
    throw err;
  }

  // Exactly the server's headers (the URL is signed over them); expo/fetch
  // streams the File as-is. No auth header: this goes to storage.
  const put = await expoFetch(grant.uploadUrl, { method: 'PUT', headers: grant.headers, body: file });
  if (!put.ok) {
    throw new ApiError(put.status, 'upload_failed', 'Photo upload failed. Please try again.');
  }

  // Safe to retry with the same key: the server returns the same photo.
  return apiRequest<PortfolioPhoto>(`${base(businessId, staffId)}/complete`, { method: 'POST', body: { key: grant.key } });
}

export function deletePortfolioPhoto(businessId: string, staffId: string, photoId: string): Promise<void> {
  if (USE_MOCK_API) {
    mockPhotos = mockPhotos.filter((p) => p.photoId !== photoId);
    return mockDelay(undefined);
  }
  return apiRequest<void>(`${base(businessId, staffId)}/${photoId}`, { method: 'DELETE' });
}

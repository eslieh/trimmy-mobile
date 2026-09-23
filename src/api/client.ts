import axios from 'axios';
import { config } from '../config/env';
import { tokenStorage } from '../storage/tokenStorage';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const token = await tokenStorage.getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;
  try {
    const response = await axios.post(`${config.apiBaseUrl}/api/v1/auth/refresh`, {
      refresh_token: refreshToken,
    });
    await tokenStorage.setTokens(response.data.access_token, response.data.refresh_token);
    return response.data.access_token;
  } catch {
    await tokenStorage.clearTokens();
    return null;
  }
}

// Fetch-based helper for non-axios calls (public discovery, multipart
// uploads, booking/fulfillment). Attaches the Bearer token and mirrors
// apiClient's one-shot refresh on 401.
export async function apiRequest<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  // FormData (file uploads) must not be JSON-stringified, and fetch needs to
  // set its own multipart Content-Type (with boundary) — never set it manually.
  const isFormData = options.body instanceof FormData;

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' };
    Object.assign(headers, await getAuthHeaders());

    return fetch(`${config.apiBaseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: isFormData ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
    });
  };

  let response = await doFetch();

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await doFetch();
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Backend error shape is { error, message } (see main.py exception handler).
    throw new ApiError(response.status, data?.error ?? 'unknown_error', data?.message ?? 'Request failed');
  }

  return data as TResponse;
}

export const apiClient = axios.create({
  baseURL: `${config.apiBaseUrl}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (requestConfig) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error || !token) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(
          `${config.apiBaseUrl}/api/v1/auth/refresh`,
          { refresh_token: refreshToken },
        );

        await tokenStorage.setTokens(data.access_token, data.refresh_token);
        apiClient.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
        processQueue(null, data.access_token);

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await tokenStorage.clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

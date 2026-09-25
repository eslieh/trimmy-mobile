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

// Backend errors come in two shapes (see main.py exception handlers):
//   - app errors:        { error: 'invalid_otp', message: 'Invalid or expired verification code' }
//   - FastAPI 422s:      { detail: [{ loc: ['body', 'email'], msg: '...' }, ...] }
// Screens should go through these two helpers instead of poking at
// err.response.data directly, so both axios (apiClient) and fetch
// (apiRequest / ApiError) failures read the same way.
type ErrorBody = {
  error?: string;
  message?: string;
  detail?: Array<{ loc?: (string | number)[]; msg?: string }> | string;
};

function getErrorBody(err: unknown): ErrorBody | null {
  if (axios.isAxiosError(err)) return (err.response?.data as ErrorBody) ?? null;
  return null;
}

export function getApiErrorCode(err: unknown): string | null {
  if (err instanceof ApiError) return err.code;
  const body = getErrorBody(err);
  if (body?.error) return body.error;
  if (Array.isArray(body?.detail)) return 'validation_error';
  return null;
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  const body = getErrorBody(err);
  if (!body) return fallback;
  if (body.message) return body.message;
  if (Array.isArray(body.detail) && body.detail[0]?.msg) {
    // Pydantic prefixes some messages ("Value error, ...") — the first
    // field's message is enough for a single inline error line.
    return body.detail[0].msg.replace(/^Value error, /, '');
  }
  if (typeof body.detail === 'string') return body.detail;
  return fallback;
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

    // `path` is relative to /api/v1, same as apiClient's baseURL below.
    return fetch(`${config.apiBaseUrl}/api/v1${path}`, {
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
    // Backend error shape is { error, message } (see main.py exception
    // handler); FastAPI's own 404/422s are { detail } instead.
    const detail = Array.isArray(data?.detail) ? data.detail[0]?.msg : data?.detail;
    throw new ApiError(
      response.status,
      data?.error ?? (Array.isArray(data?.detail) ? 'validation_error' : 'unknown_error'),
      data?.message ?? (typeof detail === 'string' ? detail : 'Request failed'),
    );
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

const PUBLIC_AUTH_PATHS = [
  '/auth/register',
  '/auth/login',
  '/auth/refresh',
  '/auth/check-email',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/verify-reset-otp',
  '/auth/reset-password',
  '/auth/resend-otp',
  '/auth/google/url',
  '/auth/google/exchange',
];

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

    // A 401 from the public auth endpoints (wrong password on login, bad
    // refresh token) is the real answer, not an expired access token —
    // retrying via refresh would swallow e.g. `invalid_credentials`.
    const isPublicAuthEndpoint = PUBLIC_AUTH_PATHS.includes(originalRequest?.url);

    if (error.response?.status === 401 && !originalRequest._retry && !isPublicAuthEndpoint) {
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

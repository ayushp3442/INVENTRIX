/**
 * core/api/httpClient.ts
 * Centralized HTTP client — Priyanshu-style core/api layer
 */

const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('inventrix_user_session');
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  const body: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    message: `HTTP ${res.status}`,
    data: null as T,
    timestamp: new Date().toISOString(),
  }));

  if (!res.ok || !body.success) {
    throw new ApiError(res.status, body.message ?? `Request failed: ${res.status}`);
  }

  return body.data;
}

export const httpClient = {
  get: <T>(endpoint: string, init?: RequestInit) =>
    request<T>(endpoint, { method: 'GET', ...init }),
  post: <T>(endpoint: string, body: unknown, init?: RequestInit) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body), ...init }),
  put: <T>(endpoint: string, body: unknown, init?: RequestInit) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), ...init }),
  delete: <T = void>(endpoint: string, init?: RequestInit) =>
    request<T>(endpoint, { method: 'DELETE', ...init }),
};

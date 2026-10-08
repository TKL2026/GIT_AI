import type { AdminAuthResponseDto, PlatformAdminDto } from '@copilote/shared';
import { ApiError } from '../lib/apiClient';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const ADMIN_ACCESS_TOKEN_KEY = 'uge_admin_access_token';

/**
 * Stockage de session dédié, distinct de `tokenStorage` (apiClient.ts) :
 * un token PLATFORM_ADMIN ne doit jamais se mélanger avec une session
 * d'organisation (clés localStorage différentes, pas de refresh token —
 * session unique à durée fixe, voir JWT_PLATFORM_ADMIN_EXPIRES_IN).
 */
export const adminTokenStorage = {
  getAccessToken: () => localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, token),
  clear: () => localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY),
};

interface Envelope<T> {
  success: true;
  data: T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = adminTokenStorage.getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, body.message ?? 'Une erreur est survenue.', body.code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const envelope = (await response.json()) as Envelope<T>;
  return envelope.data;
}

export const adminApiClient = {
  login: (email: string, password: string) =>
    request<AdminAuthResponseDto>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<PlatformAdminDto>('/admin/auth/me'),

  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
};

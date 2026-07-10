import type { AuthResponseDto } from '@copilote/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const ACCESS_TOKEN_KEY = 'copilote_access_token';
const REFRESH_TOKEN_KEY = 'copilote_refresh_token';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

interface Envelope<T> {
  success: true;
  data: T;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const accessToken = tokenStorage.getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 && retry && tokenStorage.getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, options, false);
    }
    tokenStorage.clear();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, body.message ?? 'Une erreur est survenue.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const envelope = (await response.json()) as Envelope<T>;
  return envelope.data;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return false;
    const envelope = (await response.json()) as Envelope<{
      accessToken: string;
      refreshToken: string;
    }>;
    tokenStorage.setTokens(envelope.data.accessToken, envelope.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export const apiClient = {
  login: (email: string, password: string) =>
    request<AuthResponseDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: {
    organizationName: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) =>
    request<AuthResponseDto>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
};

export { ApiError };

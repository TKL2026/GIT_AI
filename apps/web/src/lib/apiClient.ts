import type { AuthResponseDto, LoginChallengeResponseDto } from '@copilote/shared';

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
    public code?: string,
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
    throw new ApiError(response.status, body.message ?? 'Une erreur est survenue.', body.code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const envelope = (await response.json()) as Envelope<T>;
  return envelope.data;
}

/** Pour les réponses binaires (ex: téléchargement PDF) — `request()` ne
 * sait lire que l'enveloppe JSON `{ success, data }`. */
async function requestBlob(path: string, retry = true): Promise<Blob> {
  const accessToken = tokenStorage.getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  if (response.status === 401 && retry && tokenStorage.getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return requestBlob(path, false);
    }
    tokenStorage.clear();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, body.message ?? 'Une erreur est survenue.', body.code);
  }

  return response.blob();
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
  /** Étape 1/2 : identifiants corrects => un code à 6 chiffres est envoyé
   * par email, aucune session n'est encore ouverte (voir verifyLoginCode). */
  login: (email: string, password: string) =>
    request<LoginChallengeResponseDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /** Étape 2/2 : seul ce point d'entrée peut ouvrir une vraie session. */
  verifyLoginCode: (challengeToken: string, code: string) =>
    request<AuthResponseDto>('/auth/verify-login-code', {
      method: 'POST',
      body: JSON.stringify({ challengeToken, code }),
    }),

  resendLoginCode: (challengeToken: string) =>
    request<LoginChallengeResponseDto>('/auth/resend-login-code', {
      method: 'POST',
      body: JSON.stringify({ challengeToken }),
    }),

  register: (payload: {
    organizationName?: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    /** Code de l'offre payante choisie avant l'inscription (voir
     * pendingPlan.ts) — jamais un prix, le backend revérifie toujours le
     * plan réel. Absent = essai gratuit de 7 jours. */
    planCode?: string;
  }) =>
    request<AuthResponseDto>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  demoLogin: () => request<AuthResponseDto>('/auth/demo-login', { method: 'POST' }),

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

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  getBlob: (path: string) => requestBlob(path),
};

export function toQueryString(params: object): string {
  const entries = Object.entries(params).filter((entry): entry is [string, string] => !!entry[1]);
  if (entries.length === 0) return '';
  return `?${new URLSearchParams(entries).toString()}`;
}

export { ApiError };

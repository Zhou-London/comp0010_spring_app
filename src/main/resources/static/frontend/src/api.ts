export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

const AUTH_STORAGE_KEY = 'auth-user';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiOptions {
  method?: HttpMethod;
  body?: unknown;
}

export function getStoredToken(): string | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { token?: string };
    return parsed.token ?? null;
  } catch (err) {
    console.error('Unable to read auth token', err);
    return null;
  }
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;
  const headers: HeadersInit = {
    Accept: 'application/hal+json, application/json',
    'Content-Type': 'application/json',
  };

  const token = getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const init: RequestInit = { method, headers };

  if (method !== 'GET' && body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export type CollectionResponse<T> = { _embedded?: Record<string, T[]> } | T[];

export function unwrapCollection<T>(collection: CollectionResponse<T>, key: string): T[] {
  if (Array.isArray(collection)) {
    return collection;
  }

  return collection?._embedded?.[key] ?? [];
}

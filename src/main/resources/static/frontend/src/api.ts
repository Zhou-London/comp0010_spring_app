const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:2800';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiOptions {
  method?: HttpMethod;
  body?: unknown;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;
  const headers: HeadersInit = {
    Accept: 'application/hal+json, application/json',
    'Content-Type': 'application/json',
  };

  const init: RequestInit = { method, headers };

  if (method !== 'GET') {
    const payload = typeof body === 'object' && body !== null
      ? { password: 'team007', ...body as Record<string, unknown> }
      : { password: 'team007' };

    init.body = JSON.stringify(payload);
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

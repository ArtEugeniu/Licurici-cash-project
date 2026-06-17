const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace(/\/$/, '');

type ApiRequestOptions = Omit<RequestInit, 'body' | 'method'>;

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init);
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const error = (data as { error?: unknown }).error;
    if (typeof error === 'string' && error.trim() !== '') {
      return error;
    }
  }

  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim() !== '') {
      return message;
    }
  }

  return fallback;
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  const data = await readResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, `API error ${response.status}`),
      response.status,
      data
    );
  }

  return data as T;
}

function withJsonBody(body: unknown, init?: ApiRequestOptions): RequestInit {
  return {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  };
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export async function apiGet<T>(path: string, init?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>(path, { ...init, method: 'GET' });
}

export async function apiPost<T, Body = unknown>(
  path: string,
  body: Body,
  init?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(path, { ...withJsonBody(body, init), method: 'POST' });
}

export async function apiPut<T, Body = unknown>(
  path: string,
  body: Body,
  init?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(path, { ...withJsonBody(body, init), method: 'PUT' });
}

export async function apiDelete<T>(path: string, init?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>(path, { ...init, method: 'DELETE' });
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  return apiRequest<T>(path, init ?? { method: 'GET' });
}

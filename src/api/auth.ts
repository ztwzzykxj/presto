import type { Store } from '../types';
import backendConfig from '../config.json' with { type: 'json' };

const BASE_URL = `http://localhost:${backendConfig.BACKEND_PORT}`;

async function request<T>(
  method: 'GET' | 'PUT' | 'POST',
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data as T;
}

// Auth API
export async function login(email: string, password: string): Promise<{ token: string }> {
  return request<{ token: string }>('POST', '/admin/auth/login', { email, password });
}

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<{ token: string }> {
  return request<{ token: string }>('POST', '/admin/auth/register', { email, password, name });
}

export async function logout(token: string): Promise<Record<string, never>> {
  return request<Record<string, never>>('POST', '/admin/auth/logout', {}, token);
}

// Store API
export async function getStore(token: string): Promise<{ store: Store }> {
  return request<{ store: Store }>('GET', '/store', undefined, token);
}

export async function putStore(token: string, store: Store): Promise<Record<string, never>> {
  return request<Record<string, never>>('PUT', '/store', { store }, token);
}

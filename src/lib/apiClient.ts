import { supabase } from '@/integrations/supabase/client';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Backend wake-up configuration for Render Free Tier (sleeps after 15 min idle)
const WAKE_TIMEOUT_MS = 90_000;
const WAKE_RETRY_MS = 2_500;

let backendReady = false;
let wakePromise: Promise<void> | null = null;
const readyListeners = new Set<() => void>();

export function isBackendReady(): boolean {
  return backendReady;
}

export function onBackendReady(cb: () => void): () => void {
  readyListeners.add(cb);
  return () => readyListeners.delete(cb);
}

/**
 * Pings /api/health to wake up sleeping instances (e.g. Render free tier).
 * Resolves once the server responds with 200 OK or after WAKE_TIMEOUT_MS.
 */
export function waitForBackend(): Promise<void> {
  if (backendReady) {
    // Send a keep-alive ping in the background
    fetch(`${API_URL}/api/health`, { cache: 'no-store' }).catch(() => {});
    return Promise.resolve();
  }

  if (!wakePromise) {
    wakePromise = (async () => {
      const deadline = Date.now() + WAKE_TIMEOUT_MS;
      while (Date.now() < deadline) {
        try {
          const res = await fetch(`${API_URL}/api/health`, { cache: 'no-store' });
          if (res.ok) {
            backendReady = true;
            readyListeners.forEach((cb) => cb());
            return;
          }
        } catch {
          // Cold starting (connection refused / 502 / network error while booting)
        }
        await new Promise((r) => setTimeout(r, WAKE_RETRY_MS));
      }
    })().finally(() => {
      if (!backendReady) wakePromise = null;
    });
  }

  return wakePromise;
}

interface RequestOptions extends RequestInit {
  useAuth?: boolean;
}

class ApiClient {
  private async getHeaders(useAuth = true): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (useAuth) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }

    return headers;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const isHealthCheck = path.includes('/api/health') || path === 'api/health';
    if (!isHealthCheck && !backendReady) {
      await waitForBackend();
    }

    const { useAuth = true, ...fetchOptions } = options;
    const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
    
    const headers = await this.getHeaders(useAuth);
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMsg = 'Erro na requisição ao servidor';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch {
        // Fallback to status text
        errorMsg = response.statusText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    // Handle no content response
    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async post<T>(path: string, body?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;

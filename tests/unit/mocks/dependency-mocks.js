// Shared mocks and utilities for tests
import { vi } from 'vitest';

// Ensure atob/btoa exist in Node/jsdom
export function ensureBase64Polyfill() {
  if (typeof globalThis.atob !== 'function') {
    globalThis.atob = (str) => Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('binary');
  }
  if (typeof globalThis.btoa !== 'function') {
    globalThis.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
  }
}

// Mock fetch once with a JSON body
export function mockFetchOnce(data, init = { status: 200, headers: {} }) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: init.status >= 200 && init.status < 300,
    status: init.status,
    headers: { get: () => null, ...init.headers },
    json: async () => data,
    text: async () => JSON.stringify(data),
  });
}

// Stub window.location.replace, returns spy to assert calls
export function stubLocationReplace() {
  const original = globalThis.window.location;
  const spy = vi.fn();
  Object.defineProperty(window, 'location', {
    value: { ...original, replace: spy, pathname: original.pathname || '/' },
    writable: true,
  });
  return spy;
}

// Create a simple Axios adapter that echoes the request without network calls
export function createAxiosEchoAdapter({ status = 200, data = { ok: true } } = {}) {
  return async (config) => ({
    data,
    status,
    statusText: status === 200 ? 'OK' : 'ERROR',
    headers: config.headers || {},
    config,
    request: { mock: true },
  });
}

// Restore mocks
export function restoreAllMocks() {
  vi.restoreAllMocks();
  if (globalThis.fetch) delete globalThis.fetch;
}


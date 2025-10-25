import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

// Import the axios instance and helpers
import api, { endpoints } from '../../packages/frontend/src/lib/api.js';
import { setTokens, clearAllTokens } from '../../packages/frontend/src/lib/tokenManager.js';
import { ensureBase64Polyfill, createAxiosEchoAdapter, stubLocationReplace, restoreAllMocks } from './mocks/dependency-mocks.js';

const makeJwt = (payload) => {
  const base64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${base64({ alg: 'none', typ: 'JWT' })}.${base64(payload)}.`;
};

describe('Integration: axios api interceptors', () => {
  beforeEach(() => {
    ensureBase64Polyfill();
    clearAllTokens();
    vi.restoreAllMocks();
    api.defaults.adapter = createAxiosEchoAdapter();
  });

  it('adds Authorization header for protected routes when token present', async () => {
    const now = Math.floor(Date.now() / 1000);
    const access = makeJwt({ sub: 'u', exp: now + 3600 });
    setTokens(access, 'REFRESH.123', true);
    const res = await api.get('/api/plans');
    expect(res.status).toBe(200);
    expect(res.config.headers.Authorization).toBe(`Bearer ${access}`);
    expect(res.data).toEqual({ ok: true });
  });

  it('does not add Authorization for pass-through when no token', async () => {
    const res = await api.get(endpoints.auth.login);
    expect(res.status).toBe(200);
    expect(res.config.headers.Authorization).toBeUndefined();
    expect(res.data.ok).toBe(true);
  });

  it('refreshes expired token on request and updates Authorization', async () => {
    const now = Math.floor(Date.now() / 1000);
    const expired = makeJwt({ sub: 'u', exp: now - 10 });
    const newAccess = makeJwt({ sub: 'u', exp: now + 3600 });
    setTokens(expired, 'R.TOKEN', true);

    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { data: { token: newAccess, refreshToken: 'R.NEW' } },
    });

    const res = await api.get('/api/plans');
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(res.config.headers.Authorization).toBe(`Bearer ${newAccess}`);
    expect(res.statusText).toBe('OK');
  });

  it('response 423 clears tokens and redirects to /login', async () => {
    const replaceSpy = stubLocationReplace();
    api.defaults.adapter = async (config) => {
      const error = new Error('Locked');
      error.config = config;
      error.response = { status: 423 };
      error.isAxiosError = true;
      throw error;
    };

    await expect(api.get('/api/plans')).rejects.toBeTruthy();
    expect(replaceSpy).toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(sessionStorage.getItem('accessToken')).toBeNull();
  });

  it('response 401 triggers single refresh and retries original request', async () => {
    const now = Math.floor(Date.now() / 1000);
    const access = makeJwt({ sub: 'u', exp: now + 10 });
    const refreshed = makeJwt({ sub: 'u', exp: now + 7200 });
    setTokens(access, 'R1', true);

    let first = true;
    let calls = 0;

    api.defaults.adapter = async (config) => {
      calls += 1;
      if (first) {
        first = false;
        const err = new Error('Unauthorized');
        err.config = { ...config };
        err.response = { status: 401 };
        err.isAxiosError = true;
        throw err;
      }
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: config.headers || {}, config };
    };

    vi.spyOn(axios, 'post').mockResolvedValue({
      data: { data: { token: refreshed, refreshToken: 'R2' } },
    });

    const res = await api.get('/api/plans');
    expect(calls).toBe(2); // initial + retry
    expect(res.data.ok).toBe(true);
    expect(localStorage.getItem('accessToken')).not.toBe(access);
    expect(localStorage.getItem('accessToken')).toBeTruthy();
  });
});

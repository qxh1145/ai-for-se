import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setTokens,
  getToken,
  getRefreshToken,
  isRemembered,
  clearAllTokens,
  isTokenExpired,
  getTokenInfo,
} from '../lib/tokenManager';

const makeJwt = (payload) => {
  const base64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${base64({ alg: 'none', typ: 'JWT' })}.${base64(payload)}.`;
};

describe('Core Feature: Auth Token Manager', () => {
  beforeEach(() => {
    // reset storages and in‑memory state
    clearAllTokens();
    localStorage.clear();
    sessionStorage.clear();
    vi.useRealTimers();
  });

  // setTokens
  describe('setTokens', () => {
    it('stores to sessionStorage when rememberMe=false', () => {
      setTokens('acc.1', 'ref.1', false);
      expect(sessionStorage.getItem('accessToken')).toBe('acc.1');
      expect(sessionStorage.getItem('refreshToken')).toBe('ref.1');
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(getToken()).toBe('acc.1');
      expect(getRefreshToken()).toBe('ref.1');
    });

    it('stores to localStorage when rememberMe=true', () => {
      setTokens('acc.2', 'ref.2', true);
      expect(localStorage.getItem('accessToken')).toBe('acc.2');
      expect(localStorage.getItem('refreshToken')).toBe('ref.2');
      expect(sessionStorage.getItem('accessToken')).toBeNull();
    });

    it('clears previous storages before setting new tokens', () => {
      setTokens('old', 'r-old', true);
      setTokens('new', null, false);
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(sessionStorage.getItem('accessToken')).toBe('new');
      expect(sessionStorage.getItem('refreshToken')).toBeNull();
    });

    it('handles null refreshToken gracefully', () => {
      setTokens('acc.only', null, true);
      expect(localStorage.getItem('accessToken')).toBe('acc.only');
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  // getToken
  describe('getToken', () => {
    it('prefers in‑memory cache over storage', () => {
      setTokens('mem', null, false);
      // after first call, token is cached already; update storage shouldn't change return
      sessionStorage.setItem('accessToken', 'other');
      expect(getToken()).toBe('mem');
    });

    it('prefers sessionStorage over localStorage when not cached', () => {
      sessionStorage.setItem('accessToken', 'sess');
      localStorage.setItem('accessToken', 'loc');
      expect(getToken()).toBe('sess');
    });

    it('returns null when nothing is set', () => {
      expect(getToken()).toBeNull();
    });
  });

  // getRefreshToken
  describe('getRefreshToken', () => {
    it('returns in‑memory refresh token when available', () => {
      setTokens('acc', 'refresh.mem', false);
      // overwrite storage to ensure memory wins
      sessionStorage.setItem('refreshToken', 'refresh.sess');
      expect(getRefreshToken()).toBe('refresh.mem');
    });

    it('prefers sessionStorage over localStorage', () => {
      sessionStorage.setItem('refreshToken', 'r.sess');
      localStorage.setItem('refreshToken', 'r.loc');
      expect(getRefreshToken()).toBe('r.sess');
    });

    it('returns null when missing', () => {
      expect(getRefreshToken()).toBeNull();
    });
  });

  // isRemembered
  describe('isRemembered', () => {
    it('is true when REMEMBER_KEY flag is true', () => {
      localStorage.setItem('accessToken', 't');
      localStorage.setItem('rememberMe', 'true');
      expect(isRemembered()).toBe(true);
    });

    it('is true when access token exists in localStorage', () => {
      localStorage.removeItem('rememberMe');
      localStorage.setItem('accessToken', 't');
      expect(isRemembered()).toBe(true);
    });

    it('is false otherwise', () => {
      expect(isRemembered()).toBe(false);
    });
  });

  // clearAllTokens
  describe('clearAllTokens', () => {
    it('clears memory and both storages', () => {
      setTokens('a', 'r', true);
      clearAllTokens();
      expect(getToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(sessionStorage.getItem('accessToken')).toBeNull();
    });

    it('is idempotent', () => {
      clearAllTokens();
      clearAllTokens();
      expect(getToken()).toBeNull();
    });

    it('removes remember flag and refresh across storages', () => {
      // set in local (remember)
      setTokens('L', 'RL', true);
      // also simulate stray session values
      sessionStorage.setItem('accessToken', 'S');
      sessionStorage.setItem('refreshToken', 'RS');
      sessionStorage.setItem('rememberMe', 'false');

      clearAllTokens();
      expect(localStorage.getItem('rememberMe')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(sessionStorage.getItem('refreshToken')).toBeNull();
    });
  });

  // isTokenExpired
  describe('isTokenExpired', () => {
    it('returns true for missing token', () => {
      expect(isTokenExpired(null)).toBe(true);
    });

    it('returns true for malformed token', () => {
      expect(isTokenExpired('not.a.jwt')).toBe(true);
    });

    it('uses 5-minute buffer before exp', () => {
      vi.useFakeTimers();
      const now = new Date('2025-01-01T00:00:00Z');
      vi.setSystemTime(now);
      const exp = Math.floor(now.getTime() / 1000) + 60 * 6; // +6 minutes
      const t = makeJwt({ sub: 'u', exp });
      // With 5 min buffer, 6 minutes later should be not expired yet
      expect(isTokenExpired(t)).toBe(false);
      // Move time to exp - 2 minutes (within buffer)
      vi.setSystemTime(new Date(now.getTime() + 4 * 60 * 1000));
      expect(isTokenExpired(t)).toBe(true);
    });

    it('returns false when exp is well in the future', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      expect(isTokenExpired(makeJwt({ sub: 'u', exp }))).toBe(false);
    });
  });

  // getTokenInfo
  describe('getTokenInfo', () => {
    it('returns null when no token present', () => {
      expect(getTokenInfo()).toBeNull();
    });

    it('returns null for malformed token', () => {
      setTokens('abc', 'r', false);
      expect(getTokenInfo()).toBeNull();
    });

    it('returns parsed info for valid token', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      setTokens(makeJwt({ sub: '123', role: 'ADMIN', exp, rememberMe: true }), 'r', true);
      const info = getTokenInfo();
      expect(info.userId).toBe('123');
      expect(info.role).toBe('ADMIN');
      expect(info.rememberMe).toBe(true);
      expect(info.isExpired).toBe(false);
      expect(info.expiresAt).toBeInstanceOf(Date);
    });

    it('flags isExpired when within buffer window', () => {
      vi.useFakeTimers();
      const now = new Date('2025-01-01T00:00:00Z');
      vi.setSystemTime(now);
      const exp = Math.floor(now.getTime() / 1000) + 60 * 3; // +3 minutes
      setTokens(makeJwt({ sub: '1', role: 'USER', exp }), 'r', false);
      const info = getTokenInfo();
      expect(info.isExpired).toBe(true);
    });
  });
});

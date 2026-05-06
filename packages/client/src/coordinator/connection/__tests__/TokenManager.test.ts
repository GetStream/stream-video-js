import { describe, expect, it, vi } from 'vitest';
import { TokenManager } from '../token_manager';
import { promiseWithResolvers } from '../../../helpers/promise';
import type { UserWithId } from '../types';

const encodeBase64Url = (input: string): string => {
  const b64 =
    typeof btoa === 'function'
      ? btoa(input)
      : Buffer.from(input, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const createValidJwtFor = (userId: string): string => {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify({ user_id: userId }));
  return `${header}.${body}.signature`;
};

const user = (id: string): UserWithId => ({ id });

describe('TokenManager', () => {
  it('accepts a static string token and reports static mode', async () => {
    const tm = new TokenManager();
    const token = createValidJwtFor('jane');
    await tm.setTokenOrProvider(token, user('jane'), false);
    expect(tm.getToken()).toBe(token);
    expect(tm.isStatic()).toBe(true);
  });

  it('accepts a token provider and reports provider mode', async () => {
    const tm = new TokenManager();
    const validToken = createValidJwtFor('jane');
    const provider = vi.fn(async () => validToken);
    await tm.setTokenOrProvider(provider, user('jane'), false);
    expect(tm.getToken()).toBe(validToken);
    expect(tm.isStatic()).toBe(false);
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it('rejects an empty static token for a non-anonymous user', () => {
    const tm = new TokenManager();
    expect(() => tm.validateToken('')).toThrowError(
      'User token can not be empty',
    );
  });

  it('rejects a token whose user_id does not match user.id', async () => {
    const tm = new TokenManager();
    const mismatchedToken = createValidJwtFor('not-jane');
    await expect(
      tm.setTokenOrProvider(mismatchedToken, user('jane'), false),
    ).rejects.toThrow(/does not have a user_id or is not matching/);
  });

  it('accepts an empty static token for an anonymous user', async () => {
    const tm = new TokenManager();
    await tm.setTokenOrProvider('', user('!anon'), true);
    expect(tm.getToken()).toBe('');
    expect(tm.isStatic()).toBe(true);
  });

  it('dedupes concurrent loadToken calls (F10)', async () => {
    const { promise: providerP, resolve: providerResolve } =
      promiseWithResolvers<string>();
    const provider = vi.fn(() => providerP);
    const tm = new TokenManager();
    const validToken = createValidJwtFor('jane');

    const setupP = tm.setTokenOrProvider(provider, user('jane'), false);
    const concurrent = tm.loadToken();
    providerResolve(validToken);
    await Promise.all([setupP, concurrent]);

    expect(provider).toHaveBeenCalledTimes(1);
    expect(tm.getToken()).toBe(validToken);
  });

  it('clears the in-flight slot after settlement so the next loadToken re-invokes the provider', async () => {
    const tm = new TokenManager();
    const tokenA = createValidJwtFor('jane');
    const tokenB = createValidJwtFor('jane');
    const provider = vi
      .fn()
      .mockResolvedValueOnce(tokenA)
      .mockResolvedValueOnce(tokenB);
    await tm.setTokenOrProvider(provider, user('jane'), false);
    expect(provider).toHaveBeenCalledTimes(1);
    await tm.loadToken();
    expect(provider).toHaveBeenCalledTimes(2);
    expect(tm.getToken()).toBe(tokenB);
  });

  it('clears the in-flight slot when the provider rejects', async () => {
    const tm = new TokenManager();
    const validToken = createValidJwtFor('jane');
    const provider = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(validToken);

    await expect(
      tm.setTokenOrProvider(provider, user('jane'), false),
    ).rejects.toThrow(/Call to tokenProvider failed/);
    // After rejection, loadInFlight is cleared, so the next call retries.
    expect(tm.tokenReady()).toBeNull();
    await tm.loadToken();
    expect(provider).toHaveBeenCalledTimes(2);
    expect(tm.getToken()).toBe(validToken);
  });

  it('reset clears all state and allows re-setup with a different user', async () => {
    const tm = new TokenManager();
    const janeToken = createValidJwtFor('jane');
    const johnToken = createValidJwtFor('john');
    await tm.setTokenOrProvider(janeToken, user('jane'), false);
    expect(tm.getToken()).toBe(janeToken);

    tm.reset();
    expect(tm.getToken()).toBeUndefined();
    expect(tm.tokenReady()).toBeNull();
    expect(tm.isStatic()).toBe(true);

    await tm.setTokenOrProvider(johnToken, user('john'), false);
    expect(tm.getToken()).toBe(johnToken);
  });

  it('tokenReady returns the live in-flight promise during a load', async () => {
    const { promise: providerP, resolve: providerResolve } =
      promiseWithResolvers<string>();
    const provider = vi.fn(() => providerP);
    const tm = new TokenManager();
    const validToken = createValidJwtFor('jane');

    const setupP = tm.setTokenOrProvider(provider, user('jane'), false);
    const ready = tm.tokenReady();
    expect(ready).not.toBeNull();
    providerResolve(validToken);
    await ready;
    await setupP;
    // Settled — slot is cleared.
    expect(tm.tokenReady()).toBeNull();
  });
});

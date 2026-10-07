import { describe, expect, it } from 'vitest';
import { TokenManager } from '../token_manager';

describe('TokenManager', () => {
  it('rejects an empty token for a regular user', async () => {
    // @ts-expect-error the secret parameter is not part of the public API
    const tokenManager = new TokenManager('api-secret');
    await expect(
      tokenManager.setTokenOrProvider('', { id: 'jane' }, false),
    ).rejects.toThrow('User token can not be empty');
  });

  it('accepts an empty token for an anonymous user', async () => {
    const tokenManager = new TokenManager();
    await expect(
      tokenManager.setTokenOrProvider('', { id: '!anon' }, true),
    ).resolves.toBeUndefined();
  });
});

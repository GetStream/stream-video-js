import { afterEach, describe, expect, it, vi } from 'vitest';
import { StreamClient } from '../client';

const tokenFor = (userId: string) => {
  const b64 = (o: object) =>
    Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '');
  return `${b64({ alg: 'HS256' })}.${b64({ user_id: userId })}.sig`;
};

describe('StreamClient.connectUser', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('can be retried after the token provider failed', async () => {
    const client = new StreamClient('key');
    vi.spyOn(client, 'openConnection').mockResolvedValue(undefined);
    const user = { id: 'jane' };

    const failingProvider = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(client.connectUser(user, failingProvider)).rejects.toThrow(
      /tokenProvider failed/,
    );

    // the app retries once the network is back
    const workingProvider = vi.fn().mockResolvedValue(tokenFor('jane'));
    await expect(
      client.connectUser(user, workingProvider),
    ).resolves.not.toThrow();
    expect(workingProvider).toHaveBeenCalledTimes(1);
  });
});

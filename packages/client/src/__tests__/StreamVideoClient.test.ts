import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreamVideoClient } from '../StreamVideoClient';
import 'dotenv/config';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { User } from '../coordinator/connection/types';
import { StreamClient } from '@stream-io/node-sdk';

const apiKey = process.env.STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET!;

const serverClient = new StreamClient(apiKey, secret);

const tokenProvider = (userId: string) => {
  return async () => {
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        const token = serverClient.generateUserToken({ user_id: userId });
        resolve(token);
      }, 100);
    });
  };
};

describe('StreamVideoClient', () => {
  let client: StreamVideoClient;

  beforeEach(() => {
    client = new StreamVideoClient(apiKey, {
      // tests run in node, so we have to fake being in browser env
      browser: true,
    });
  });

  it('API calls are hold until connection is done', async () => {
    const user = {
      id: 'jane',
    };

    client.connectUser(user, tokenProvider(user.id));
    const response = await client.queryCalls({});

    expect(response).toBeDefined();
  });

  it('API calls are hold until connection is done - anonymous users', async () => {
    client.connectUser({ type: 'anonymous' });
    const response = await client.queryCalls({
      filter_conditions: { members: { $in: ['!anon'] } },
    });

    expect(response).toBeDefined();
  });

  it('public endpoints can be called without authentication', async () => {
    const userId = 'guest-' + generateUUIDv4();
    const response = await client.createGuestUser({
      user: { id: userId },
    });

    expect(response.user.id).toContain(userId);
  });

  it(`private endpoints can't be called without authentication`, async () => {
    await expect(() => client.queryCalls({})).rejects.toThrowError();

    await client.connectUser({ id: 'jane' }, tokenProvider('jane'));
    await client.disconnectUser();

    await expect(() => client.queryCalls({})).rejects.toThrowError();
  });

  it('API calls should be enriched with conneciton id', async () => {
    const user = {
      id: 'jane',
    };

    client.connectUser(user, tokenProvider(user.id));
    const spy = vi.spyOn(client.streamClient.axiosInstance, 'post');
    await client.call('default', generateUUIDv4()).getOrCreate();

    const requestConfig: any = spy.mock.calls[spy.mock.calls.length - 1][2];
    const params = requestConfig.params;
    expect(client.streamClient._getConnectionID()).toBeDefined();
    expect(params['connection_id']).toBe(
      client.streamClient._getConnectionID(),
    );
  });

  it('API calls should be hold until auth is done - guest user', async () => {
    const user: User = {
      id: `jane-${generateUUIDv4()}`,
      type: 'guest',
    };

    client.connectUser(user);
    const response = await client.queryCalls({
      filter_conditions: { members: { $in: [user.id] } },
    });

    expect(response.calls).toBeDefined();
  });

  it('should clear token on disconnect', async () => {
    const user = { id: 'jane' };
    const tp = vi.fn(tokenProvider(user.id));
    await client.connectUser(user, tp);
    await client.disconnectUser();
    await client.connectUser({ type: 'anonymous' });
    expect(tp).toBeCalledTimes(1);
  });

  afterEach(() => {
    client.disconnectUser();
  });

  describe('StreamVideoClient.getOrCreateInstance', () => {
    afterEach(() => {
      // @ts-expect-error - private field
      StreamVideoClient._instances.clear();
    });

    it('throws an error if userId is not provided except for anon users', () => {
      expect(() => {
        StreamVideoClient.getOrCreateInstance({ apiKey, user: { id: '' } });
      }).toThrow();
      expect(() => {
        StreamVideoClient.getOrCreateInstance({
          apiKey,
          user: { type: 'anonymous' },
        });
      }).not.toThrow();
    });

    it('throws an error if token or token provider is not provided for authenticated users', () => {
      expect(() => {
        StreamVideoClient.getOrCreateInstance({
          apiKey,
          user: { id: 'jane', type: 'authenticated' },
        });
      }).toThrow();
      expect(() => {
        StreamVideoClient.getOrCreateInstance({
          apiKey,
          user: { id: 'jane', type: 'guest' },
        });
      }).not.toThrow();
      expect(() => {
        StreamVideoClient.getOrCreateInstance({
          apiKey,
          user: { type: 'anonymous' },
        });
      }).not.toThrow();
    });

    it('returns the same instance for the same userId and apiKey', () => {
      const instance1 = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: { id: 'jane' },
        token: 'abc',
      });
      const instance2 = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: { id: 'jane' },
        token: 'abc',
      });
      expect(instance1).toBe(instance2);
    });

    it('returns different instances for different userIds', () => {
      const instance1 = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: { id: 'jane' },
        token: 'abc',
      });
      const instance2 = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: { id: 'john' },
        token: 'abc',
      });
      expect(instance1).not.toBe(instance2);
    });

    it('returns different instances if existing user is disconnected', async () => {
      const instance1 = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: { id: 'jane' },
        token: 'abc',
      });
      await instance1.disconnectUser();

      const instance2 = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: { id: 'jane' },
        token: 'abc',
      });

      expect(instance1).not.toBe(instance2);
    });
  });
});

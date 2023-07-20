import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreamVideoClient } from '../StreamVideoClient';
import 'dotenv/config';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { WSConnectionFallback } from '../coordinator/connection/connection_fallback';

const apiKey = process.env.STREAM_API_KEY!;
const tokenUrl = process.env.TOKEN_PROVIDER_URL!;

const tokenProvider = (userId: string) => {
  return async () => {
    const url = new URL(tokenUrl);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('user_id', userId);

    const response = await fetch(url.toString());
    const data = await response.json();
    return data.token;
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

  // TODO: should this work?
  // it('API calls are hold until connection is done - WS fallback', async () => {
  //   const user = {
  //     id: 'jane',
  //   };

  //   // force WS fallback
  //   client.streamClient.wsFallback = new WSConnectionFallback(
  //     client.streamClient,
  //   );

  //   client.connectUser(user, tokenProvider(user.id));
  //   const spy = vi.spyOn(client.streamClient.axiosInstance, 'post');
  //   const response = await client.queryCalls({});

  //   expect(response).toBeDefined();

  //   const requestConfig: any = spy.mock.calls[spy.mock.calls.length - 1][2];
  //   const params = requestConfig.params;
  //   expect(client.streamClient._getConnectionID()).toBeDefined();
  //   // connection id isn't sent for WS fallback
  //   expect(params['connection_id']).toBeUndefined();
  // });

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

  afterEach(() => {
    client.disconnectUser();
  });
});

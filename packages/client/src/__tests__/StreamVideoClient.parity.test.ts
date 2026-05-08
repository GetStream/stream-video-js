import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import 'dotenv/config';
import { StreamVideoClient } from '../StreamVideoClient';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { StreamClient } from '@stream-io/node-sdk';

const apiKey = process.env.STREAM_API_KEY;
const secret = process.env.STREAM_SECRET;

const haveCredentials = Boolean(apiKey && secret);
const describeIfCreds = haveCredentials ? describe : describe.skip;

describeIfCreds('StreamVideoClient parity (legacy vs. new coordinator)', () => {
  let serverClient: StreamClient;
  let tokenProvider: (userId: string) => () => Promise<string>;

  beforeEach(() => {
    serverClient = new StreamClient(apiKey!, secret!);
    tokenProvider = (userId: string) => async () =>
      new Promise<string>((resolve) => {
        setTimeout(() => {
          resolve(serverClient.generateUserToken({ user_id: userId }));
        }, 50);
      });
  });

  describe.each([
    { mode: 'new', useLegacyCoordinator: false },
    { mode: 'legacy', useLegacyCoordinator: true },
  ])('mode=$mode', ({ useLegacyCoordinator }) => {
    let client: StreamVideoClient;

    beforeEach(() => {
      client = new StreamVideoClient(apiKey!, {
        browser: true,
        timeout: 15000,
        useLegacyCoordinator,
      });
    });
    afterEach(async () => {
      await client.disconnectUser();
    });

    it('private endpoint waits for connection then succeeds', async () => {
      client.connectUser({ id: 'jane' }, tokenProvider('jane'));
      const response = await client.queryCalls({});
      expect(response).toBeDefined();
    });

    it('connection_id is enriched on REST requests', async () => {
      client.connectUser({ id: 'jane' }, tokenProvider('jane'));
      const spy = vi.spyOn(client.streamClient.axiosInstance, 'post');
      await client.call('default', generateUUIDv4()).getOrCreate();
      const requestConfig: { params: Record<string, unknown> } = spy.mock.calls[
        spy.mock.calls.length - 1
      ][2] as {
        params: Record<string, unknown>;
      };
      const params = requestConfig.params;
      const connectionId = client.streamClient._getConnectionID();
      expect(connectionId).toBeDefined();
      expect(params.connection_id).toBe(connectionId);
    });

    it('private endpoint throws after disconnectUser', async () => {
      await client.connectUser({ id: 'jane' }, tokenProvider('jane'));
      await client.disconnectUser();
      await expect(() => client.queryCalls({})).rejects.toThrowError();
    });

    it('public endpoint does not require connectUser', async () => {
      const userId = `guest-${generateUUIDv4()}`;
      const response = await client.createGuestUser({ user: { id: userId } });
      expect(response.user.id).toContain(userId);
    });
  });
});

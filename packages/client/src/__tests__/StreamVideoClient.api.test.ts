import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { StreamVideoClient } from '../StreamVideoClient';
import 'dotenv/config';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { StreamClient } from '@stream-io/node-sdk';
import { CreateDeviceRequest } from '../gen/coordinator';

const apiKey = process.env.STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET!;

const serverClient = new StreamClient(apiKey, secret);

const tokenProvider = (userId: string) => {
  return async () => {
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        const token = serverClient.createToken(
          userId,
          undefined,
          Math.round(Date.now() / 1000 - 10),
        );
        resolve(token);
      }, 100);
    });
  };
};

describe('StreamVideoClient - coordinator API', () => {
  let client: StreamVideoClient;
  const user = {
    id: 'sara',
  };

  beforeAll(() => {
    client = new StreamVideoClient(apiKey, {
      // tests run in node, so we have to fake being in browser env
      browser: true,
    });
    client.connectUser(user, tokenProvider(user.id));
  });

  it('query calls', { retry: 3, timeout: 20000 }, async () => {
    let response = await client.queryCalls();

    let calls = response.calls;
    expect(calls.length).toBeGreaterThanOrEqual(1);

    const queryCallsReq = {
      sort: [{ field: 'starts_at', direction: -1 }],
      limit: 2,
    };
    response = await client.queryCalls(queryCallsReq);

    calls = response.calls;
    expect(calls.length).toBe(2);

    response = await client.queryCalls({
      ...queryCallsReq,
      next: response.next,
    });

    expect(response.calls.length).toBeLessThanOrEqual(2);

    response = await client.queryCalls({
      filter_conditions: { backstage: { $eq: false } },
    });

    expect(response.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('query calls - ongoing', async () => {
    const response = await client.queryCalls({
      filter_conditions: { ongoing: { $eq: true } },
    });

    // Dummy test
    expect(response.calls).toBeDefined();
  });

  it('query calls - upcoming', async () => {
    const mins30 = 1000 * 60 * 60 * 30;
    const inNext30mins = new Date(Date.now() + mins30);
    const response = await client.queryCalls({
      filter_conditions: {
        starts_at: { $gt: inNext30mins.toISOString() },
      },
    });

    // Dummy test
    expect(response.calls).toBeDefined();
  });

  it('query call stats', async () => {
    const response = await client.queryCallStats({
      filter_conditions: { call_cid: 'default:test' },
    });

    expect(response.reports).toBeDefined();
  });

  it('edges', async () => {
    const response = await client.edges();

    expect(response.edges).toBeDefined();
  });

  describe('devices', () => {
    const device: CreateDeviceRequest = {
      id: generateUUIDv4(),
      push_provider: 'firebase',
      push_provider_name: 'firebase',
    };

    it('add device', async () => {
      expect(
        async () =>
          await client.addDevice(
            device.id,
            device.push_provider,
            device.push_provider_name,
          ),
      ).not.toThrowError();
    });

    it('add voip device', async () => {
      expect(
        async () =>
          await client.addVoipDevice(
            device.id + 'voip',
            device.push_provider,
            device.push_provider_name!,
          ),
      ).not.toThrowError();
    });

    it('get devices', { retry: 3, timeout: 15000 }, async () => {
      // Wait a little bit, because if we query devices too soon backend will return 404
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 5000);
      });

      const response = await client.getDevices();

      expect(response.devices.find((d) => d.id === device.id)).toBeDefined();
      expect(
        response.devices.find((d) => d.id === device.id + 'voip'),
      ).toBeDefined();
    });

    it('remove device', { retry: 3, timeout: 15000 }, async () => {
      // Wait a little bit, because if we query devices too soon backend will return 404
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 5000);
      });

      expect(
        async () => await client.removeDevice(device.id),
      ).not.toThrowError();
      expect(
        async () => await client.removeDevice(device.id + 'void'),
      ).not.toThrowError();
    });
  });

  afterAll(() => {
    client.disconnectUser();
  });
});

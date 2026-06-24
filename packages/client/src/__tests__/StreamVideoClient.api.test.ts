import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from 'vitest';
import { StreamVideoClient } from '../StreamVideoClient';
import { Call } from '../Call';
import { CallCreatedPayload } from './data';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import type { StreamClient } from '../coordinator/connection/client';
import type {
  CreateDeviceRequest,
  GetEdgesResponse,
  ListDevicesResponse,
  QueryCallsResponse,
  QueryCallStatsResponse,
} from '../gen/coordinator';

const apiKey = 'mock-api-key';

describe('StreamVideoClient - coordinator API', () => {
  let client: StreamVideoClient;
  // the client only talks to the backend through streamClient.post/get/delete,
  // so we spy on those and assert against them instead of a live backend.
  let post: Mock<StreamClient['post']>;
  let get: Mock<StreamClient['get']>;
  let del: Mock<StreamClient['delete']>;

  beforeEach(() => {
    client = new StreamVideoClient(apiKey, { browser: true });
    post = vi.spyOn(client.streamClient, 'post');
    get = vi.spyOn(client.streamClient, 'get');
    del = vi.spyOn(client.streamClient, 'delete');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('query calls', async () => {
    const response: QueryCallsResponse = {
      duration: '1ms',
      next: 'next-page-token',
      calls: [
        {
          call: CallCreatedPayload.call,
          members: CallCreatedPayload.members,
          own_capabilities: [],
        },
      ],
    };
    post.mockResolvedValue(response);

    await client.queryCalls();
    expect(post).toHaveBeenCalledWith('/calls', {});

    const queryCallsReq = {
      sort: [{ field: 'starts_at', direction: -1 }],
      limit: 2,
    };
    const result = await client.queryCalls(queryCallsReq);
    expect(post).toHaveBeenCalledWith('/calls', queryCallsReq);

    // each response entry is wrapped into a Call instance
    expect(result.next).toBe('next-page-token');
    expect(result.calls).toHaveLength(1);
    const [call] = result.calls;
    expect(call).toBeInstanceOf(Call);
    expect(call.cid).toBe(CallCreatedPayload.call.cid);
  });

  it('query calls - ongoing', async () => {
    post.mockResolvedValue({ duration: '1ms', calls: [] });

    const queryCallsReq = { filter_conditions: { ongoing: { $eq: true } } };
    await client.queryCalls(queryCallsReq);

    expect(post).toHaveBeenCalledWith('/calls', queryCallsReq);
  });

  it('query calls - upcoming', async () => {
    post.mockResolvedValue({ duration: '1ms', calls: [] });

    const mins30 = 1000 * 60 * 60 * 30;
    const inNext30mins = new Date(Date.now() + mins30);
    const queryCallsReq = {
      filter_conditions: { starts_at: { $gt: inNext30mins.toISOString() } },
    };
    await client.queryCalls(queryCallsReq);

    expect(post).toHaveBeenCalledWith('/calls', queryCallsReq);
  });

  it('query call stats', async () => {
    const response: QueryCallStatsResponse = { duration: '1ms', reports: [] };
    post.mockResolvedValue(response);

    const result = await client.queryCallStats({
      filter_conditions: { call_cid: 'default:test' },
    });

    expect(post).toHaveBeenCalledWith('/call/stats', {
      filter_conditions: { call_cid: 'default:test' },
    });
    expect(result).toBe(response);
  });

  it('edges', async () => {
    const response: GetEdgesResponse = { duration: '1ms', edges: [] };
    get.mockResolvedValue(response);

    const result = await client.edges();

    expect(get).toHaveBeenCalledWith('/edges');
    expect(result).toBe(response);
  });

  describe('devices', () => {
    const device: CreateDeviceRequest = {
      id: generateUUIDv4(),
      push_provider: 'firebase',
      push_provider_name: 'firebase',
    };

    it('add device', async () => {
      post.mockResolvedValue(undefined);

      await client.addDevice(
        device.id,
        device.push_provider,
        device.push_provider_name,
      );

      expect(post).toHaveBeenCalledWith('/devices', {
        id: device.id,
        push_provider: device.push_provider,
        voip_token: undefined,
        push_provider_name: device.push_provider_name,
      });
    });

    it('add voip device', async () => {
      post.mockResolvedValue(undefined);

      await client.addVoipDevice(
        device.id + 'voip',
        device.push_provider,
        device.push_provider_name!,
      );

      expect(post).toHaveBeenCalledWith('/devices', {
        id: device.id + 'voip',
        push_provider: device.push_provider,
        voip_token: true,
        push_provider_name: device.push_provider_name,
      });
    });

    it('get devices', async () => {
      const response: ListDevicesResponse = { duration: '1ms', devices: [] };
      get.mockResolvedValue(response);

      const result = await client.getDevices();

      expect(get).toHaveBeenCalledWith('/devices', {});
      expect(result).toBe(response);
    });

    it('remove device', async () => {
      del.mockResolvedValue(undefined);

      await client.removeDevice(device.id);

      expect(del).toHaveBeenCalledWith('/devices', { id: device.id });
    });
  });
});

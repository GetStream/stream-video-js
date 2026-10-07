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
import { CameraManager } from '../devices/CameraManager';
import { MicrophoneManager } from '../devices/MicrophoneManager';
import { CallCreatedPayload } from './data';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import type { StreamClient } from '../coordinator/connection/client';
import type {
  GetEdgesResponse,
  QueryCallsResponse,
  QueryCallStatsResponse,
} from '../gen/coordinator';
import type { CreateDeviceRequest, ListDevicesResponse } from '../gen/shims';

const apiKey = 'mock-api-key';

describe('StreamVideoClient - coordinator API', () => {
  let client: StreamVideoClient;
  let request: Mock<StreamClient['doAxiosRequest']>;

  const respondWith = (data: unknown) =>
    request.mockResolvedValue({ data, status: 200, headers: {} } as never);

  const expectRequest = (method: string, path: string, body?: unknown) => {
    const toPath = request.mock.calls.filter(
      ([m, url]) => m === method && String(url).endsWith(path),
    );
    expect(toPath.length, `no ${method} request to ${path}`).toBeGreaterThan(0);
    if (body === undefined) return;
    const defined = (value: unknown) =>
      JSON.parse(JSON.stringify(value ?? null));
    expect(defined(toPath[toPath.length - 1][2])).toEqual(defined(body));
  };

  beforeEach(() => {
    client = new StreamVideoClient(apiKey, { browser: true });
    request = vi.spyOn(client.streamClient, 'doAxiosRequest') as never;
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
    respondWith(response);

    await client.queryCalls();
    expectRequest('post', '/api/v2/video/calls', {});

    const queryCallsReq = {
      sort: [{ field: 'starts_at', direction: -1 }],
      limit: 2,
    };
    const result = await client.queryCalls(queryCallsReq);
    expectRequest('post', '/api/v2/video/calls', queryCallsReq);

    // each response entry is wrapped into a Call instance
    expect(result.next).toBe('next-page-token');
    expect(result.calls).toHaveLength(1);
    const [call] = result.calls;
    expect(call).toBeInstanceOf(Call);
    expect(call.cid).toBe(CallCreatedPayload.call.cid);
  });

  it('query calls keeps devices disabled by default', async () => {
    const response: QueryCallsResponse = {
      duration: '1ms',
      calls: [
        {
          call: CallCreatedPayload.call,
          members: CallCreatedPayload.members,
          own_capabilities: [],
        },
      ],
    };
    respondWith(response);
    const applyCamera = vi
      .spyOn(CameraManager.prototype, 'apply')
      .mockResolvedValue();
    const applyMicrophone = vi
      .spyOn(MicrophoneManager.prototype, 'apply')
      .mockResolvedValue();

    await client.queryCalls();
    await client.queryCalls({}, {});
    await client.queryCalls({}, { withDisabledDevices: false });

    expect(
      applyCamera.mock.calls.map(([, , forceDisabled]) => forceDisabled),
    ).toEqual([true, true, false]);
    expect(
      applyMicrophone.mock.calls.map(([, , forceDisabled]) => forceDisabled),
    ).toEqual([true, true, false]);
  });

  it('query calls - ongoing', async () => {
    respondWith({ duration: '1ms', calls: [] });

    const queryCallsReq = { filter_conditions: { ongoing: { $eq: true } } };
    await client.queryCalls(queryCallsReq);

    expectRequest('post', '/api/v2/video/calls', queryCallsReq);
  });

  it('query calls - upcoming', async () => {
    respondWith({ duration: '1ms', calls: [] });

    const mins30 = 1000 * 60 * 60 * 30;
    const inNext30mins = new Date(Date.now() + mins30);
    const queryCallsReq = {
      filter_conditions: { starts_at: { $gt: inNext30mins.toISOString() } },
    };
    await client.queryCalls(queryCallsReq);

    expectRequest('post', '/api/v2/video/calls', queryCallsReq);
  });

  it('query call stats', async () => {
    const response: QueryCallStatsResponse = { duration: '1ms', reports: [] };
    respondWith(response);

    const result = await client.queryCallStats({
      filter_conditions: { call_cid: 'default:test' },
    });

    expectRequest('post', '/api/v2/video/call/stats', {
      filter_conditions: { call_cid: 'default:test' },
    });
    expect(result).toMatchObject(response);
  });

  it('edges', async () => {
    const response: GetEdgesResponse = { duration: '1ms', edges: [] };
    respondWith(response);

    const result = await client.edges();

    expectRequest('get', '/api/v2/video/edges');
    expect(result).toMatchObject(response);
  });

  describe('devices', () => {
    const device: CreateDeviceRequest = {
      id: generateUUIDv4(),
      push_provider: 'firebase',
      push_provider_name: 'firebase',
    };

    it('add device', async () => {
      respondWith(undefined);

      await client.addDevice(device);

      expectRequest('post', '/api/v2/devices', {
        id: device.id,
        push_provider: device.push_provider,
        voip_token: undefined,
        push_provider_name: device.push_provider_name,
      });
    });

    it('forwards optional device settings', async () => {
      respondWith(undefined);
      const data: CreateDeviceRequest = {
        ...device,
        hardware_id: 'physical-device-id',
        voip_token: false,
      };

      await client.addDevice(data);

      expectRequest('post', '/api/v2/devices', data);
    });

    it('add voip device', async () => {
      respondWith(undefined);

      const data = {
        ...device,
        id: device.id + 'voip',
        hardware_id: 'physical-device-id',
      };
      await client.addVoipDevice(data);

      expectRequest('post', '/api/v2/devices', {
        ...data,
        voip_token: true,
      });
      expect(data).not.toHaveProperty('voip_token');
    });

    it('get devices', async () => {
      const response: ListDevicesResponse = { duration: '1ms', devices: [] };
      respondWith(response);

      const result = await client.getDevices();

      expectRequest('get', '/api/v2/devices');
      expect(result).toMatchObject(response);
    });

    it('remove device', async () => {
      respondWith(undefined);

      await client.removeDevice({ id: device.id });

      expectRequest('delete', '/api/v2/devices');
      expect(request.mock.calls.at(-1)?.[3]?.params).toEqual({ id: device.id });
    });
  });
});

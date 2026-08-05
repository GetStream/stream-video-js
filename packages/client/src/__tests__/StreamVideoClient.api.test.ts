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
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type {
  CreateDeviceRequest,
  GetEdgesResponse,
  ListDevicesResponse,
  QueryCallsResponse,
  QueryCallStatsMapResponse,
  QueryCallStatsResponse,
} from '../gen/coordinator';

const apiKey = 'mock-api-key';

describe('StreamVideoClient - coordinator API', () => {
  let client: StreamVideoClient;
  let doAxiosRequest: Mock<StreamClient['doAxiosRequest']>;

  const mockAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  });

  beforeEach(() => {
    client = new StreamVideoClient(apiKey, { browser: true });
    doAxiosRequest = vi.spyOn(client.streamClient, 'doAxiosRequest');
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
    doAxiosRequest.mockResolvedValue(mockAxiosResponse(response));

    await client.queryCalls();
    expect(doAxiosRequest).toHaveBeenCalledWith(
      'post',
      'https://video.stream-io-api.com/api/v2/video/calls',
      {},
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const queryCallsReq = {
      sort: [{ field: 'starts_at', direction: -1 }],
      limit: 2,
    };
    const result = await client.queryCalls(queryCallsReq);
    expect(doAxiosRequest).toHaveBeenLastCalledWith(
      'post',
      'https://video.stream-io-api.com/api/v2/video/calls',
      queryCallsReq,
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    // each response entry is wrapped into a Call instance
    expect(result.next).toBe('next-page-token');
    expect(result.calls).toHaveLength(1);
    const [call] = result.calls;
    expect(call).toBeInstanceOf(Call);
    expect(call.cid).toBe(CallCreatedPayload.call.cid);
  });

  it('query calls - ongoing', async () => {
    doAxiosRequest.mockResolvedValue(
      mockAxiosResponse({ duration: '1ms', calls: [] }),
    );

    const queryCallsReq = { filter_conditions: { ongoing: { $eq: true } } };
    await client.queryCalls(queryCallsReq);

    expect(doAxiosRequest).toHaveBeenCalledWith(
      'post',
      'https://video.stream-io-api.com/api/v2/video/calls',
      queryCallsReq,
      expect.any(Object),
    );
  });

  it('query calls - upcoming', async () => {
    doAxiosRequest.mockResolvedValue(
      mockAxiosResponse({ duration: '1ms', calls: [] }),
    );

    const mins30 = 1000 * 60 * 60 * 30;
    const inNext30mins = new Date(Date.now() + mins30);
    const queryCallsReq = {
      filter_conditions: { starts_at: { $gt: inNext30mins.toISOString() } },
    };
    await client.queryCalls(queryCallsReq);

    expect(doAxiosRequest).toHaveBeenCalledWith(
      'post',
      'https://video.stream-io-api.com/api/v2/video/calls',
      queryCallsReq,
      expect.any(Object),
    );
  });

  it('query call stats', async () => {
    const response: QueryCallStatsResponse = { duration: '1ms', reports: [] };
    doAxiosRequest.mockResolvedValue(mockAxiosResponse(response));

    const result = await client.queryCallStats({
      filter_conditions: { call_cid: 'default:test' },
    });

    expect(doAxiosRequest).toHaveBeenCalledWith(
      'post',
      'https://video.stream-io-api.com/api/v2/video/call/stats',
      { filter_conditions: { call_cid: 'default:test' } },
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(result).toMatchObject(response);
  });

  it('get call stats map', async () => {
    const response: QueryCallStatsMapResponse = {
      call_id: 'test',
      call_session_id: 'session-1',
      call_type: 'default',
      duration: '1ms',
      counts: {
        live_sessions: 0,
        participants: 0,
        peak_concurrent_sessions: 0,
        peak_concurrent_users: 0,
        publishers: 0,
        sessions: 0,
        sfus_used: 0,
      },
    };
    doAxiosRequest.mockResolvedValue(mockAxiosResponse(response));

    const call = client.call('default', 'test');
    const result = await call.getCallStatsMap(
      {
        start_time: new Date('2024-01-01T00:00:00.000Z'),
        end_time: '2024-01-01T00:30:00.000Z',
        exclude_sfus: true,
      },
      'session-1',
    );

    expect(doAxiosRequest).toHaveBeenCalledWith(
      'get',
      'https://video.stream-io-api.com/api/v2/video/call_stats/default/test/session-1/map',
      undefined,
      expect.objectContaining({
        params: {
          start_time: '2024-01-01T00:00:00.000Z',
          end_time: '2024-01-01T00:30:00.000Z',
          exclude_sfus: true,
        },
      }),
    );
    expect(result).toMatchObject(response);
  });

  it('edges', async () => {
    const response: GetEdgesResponse = { duration: '1ms', edges: [] };
    doAxiosRequest.mockResolvedValue(mockAxiosResponse(response));

    const result = await client.edges();

    expect(doAxiosRequest).toHaveBeenCalledWith(
      'get',
      'https://video.stream-io-api.com/api/v2/video/edges',
      undefined,
      expect.any(Object),
    );
    expect(result).toMatchObject(response);
  });

  describe('devices', () => {
    const device: CreateDeviceRequest = {
      id: generateUUIDv4(),
      push_provider: 'firebase',
      push_provider_name: 'firebase',
    };

    it('add device', async () => {
      doAxiosRequest.mockResolvedValue(mockAxiosResponse({ duration: '1ms' }));

      await client.addDevice(
        device.id,
        device.push_provider,
        device.push_provider_name,
      );

      expect(doAxiosRequest).toHaveBeenCalledWith(
        'post',
        'https://video.stream-io-api.com/api/v2/devices',
        {
          id: device.id,
          push_provider: device.push_provider,
          voip_token: undefined,
          push_provider_name: device.push_provider_name,
        },
        expect.any(Object),
      );
    });

    it('add voip device', async () => {
      doAxiosRequest.mockResolvedValue(mockAxiosResponse({ duration: '1ms' }));

      await client.addVoipDevice(
        device.id + 'voip',
        device.push_provider,
        device.push_provider_name!,
      );

      expect(doAxiosRequest).toHaveBeenCalledWith(
        'post',
        'https://video.stream-io-api.com/api/v2/devices',
        {
          id: device.id + 'voip',
          push_provider: device.push_provider,
          voip_token: true,
          push_provider_name: device.push_provider_name,
        },
        expect.any(Object),
      );
    });

    it('get devices', async () => {
      const response: ListDevicesResponse = { duration: '1ms', devices: [] };
      doAxiosRequest.mockResolvedValue(mockAxiosResponse(response));

      const result = await client.getDevices();

      expect(doAxiosRequest).toHaveBeenCalledWith(
        'get',
        'https://video.stream-io-api.com/api/v2/devices',
        undefined,
        expect.any(Object),
      );
      expect(result).toMatchObject(response);
    });

    it('remove device', async () => {
      doAxiosRequest.mockResolvedValue(mockAxiosResponse({ duration: '1ms' }));

      await client.removeDevice(device.id);

      expect(doAxiosRequest).toHaveBeenCalledWith(
        'delete',
        'https://video.stream-io-api.com/api/v2/devices',
        undefined,
        expect.objectContaining({
          params: { id: device.id },
        }),
      );
    });
  });
});

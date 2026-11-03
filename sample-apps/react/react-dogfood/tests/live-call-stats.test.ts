import { EventEmitter } from 'node:events';
import type { NextApiRequest, NextApiResponse } from 'next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getValidServerSession } from '../pages/api/auth/[...nextauth]';
import liveCallStats from '../pages/api/live-call-stats';

vi.mock('../pages/api/auth/[...nextauth]', () => ({
  getValidServerSession: vi.fn(),
}));

const mockedGetValidServerSession = vi.mocked(getValidServerSession);

type TestResponse = NextApiResponse & {
  chunks: Buffer[];
  jsonBody?: unknown;
};

const createResponse = (): TestResponse => {
  const response = new EventEmitter() as TestResponse;
  let headersSent = false;
  Object.defineProperty(response, 'headersSent', {
    get: () => headersSent,
  });
  response.chunks = [];
  response.statusCode = 200;
  response.setHeader = vi.fn();
  response.status = vi.fn((statusCode: number) => {
    response.statusCode = statusCode;
    return response;
  });
  response.json = vi.fn((body: unknown) => {
    response.jsonBody = body;
    return response;
  });
  response.writeHead = vi.fn((statusCode: number) => {
    response.statusCode = statusCode;
    headersSent = true;
    return response;
  }) as TestResponse['writeHead'];
  response.write = vi.fn((chunk: Uint8Array) => {
    response.chunks.push(Buffer.from(chunk));
    return true;
  });
  response.end = vi.fn(() => response);
  return response;
};

const createRequest = (
  method: string = 'POST',
  body: unknown = { app_id: 42 },
) => ({ method, body }) as NextApiRequest;

describe('live-call-stats API proxy', () => {
  beforeEach(() => {
    process.env.RTC_STATS_BASE_URL = 'https://rtcstats.example.com';
    process.env.RTC_STATS_API_TOKEN = 'server-secret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.RTC_STATS_BASE_URL;
    delete process.env.RTC_STATS_API_TOKEN;
  });

  it('rejects unauthenticated requests', async () => {
    mockedGetValidServerSession.mockResolvedValue(null);
    const response = createResponse();

    await liveCallStats(createRequest(), response);

    expect(response.statusCode).toBe(401);
    expect(response.jsonBody).toEqual({ message: 'Unauthorized' });
  });

  it('keeps the SFU token server-side and streams the upstream response', async () => {
    mockedGetValidServerSession.mockResolvedValue({
      user: { stream: true, streamUserId: 'user' },
      expires: '2099-01-01',
    });
    const upstreamPayload = '{"type":"heartbeat","timestamp":1000}\n';
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(upstreamPayload, { status: 200 }));
    const requestBody = {
      app_id: 42,
      call_cid: 'default:call',
      call_session_id: 'call-session',
      participants: [{ user_id: 'user', user_session_id: 'user-session' }],
    };
    const response = createResponse();

    await liveCallStats(createRequest('POST', requestBody), response);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://rtcstats.example.com/api/live-call-stats',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer server-secret',
        }),
        body: JSON.stringify(requestBody),
      }),
    );
    expect(Buffer.concat(response.chunks).toString()).toBe(upstreamPayload);
    expect(response.end).toHaveBeenCalled();
  });

  it('fails closed when live diagnostics are not configured', async () => {
    mockedGetValidServerSession.mockResolvedValue({
      user: { stream: true, streamUserId: 'user' },
      expires: '2099-01-01',
    });
    delete process.env.RTC_STATS_API_TOKEN;
    const response = createResponse();

    await liveCallStats(createRequest(), response);

    expect(response.statusCode).toBe(503);
    expect(response.jsonBody).toEqual({
      message:
        'Live call diagnostics are not configured. RTC_STATS_BASE_URL and RTC_STATS_API_TOKEN are required.',
    });
  });
});

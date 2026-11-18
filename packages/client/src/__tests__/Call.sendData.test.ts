import { VideoApi } from '../gen/coordinator/video/VideoApi';
import { ApiClient } from '../coordinator/connection/api-client';
import '../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { Call } from '../Call';
import { StreamClient } from '../coordinator/connection/client';
import { ErrorFromResponse } from '../coordinator/connection/types';
import { ClientEventReporter } from '../reporting';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { ClientState } from '../store';
import { CallDataRateLimitError } from '../errors';
import { StreamSfuClient } from '../StreamSfuClient';

describe('Call.sendData', () => {
  const callId = generateUUIDv4();

  const fakeCall = (sfuSessionId?: string) => {
    const streamClient = new StreamClient('abc');
    const call = new Call({
      type: 'test',
      id: callId,
      streamClient,
      videoApi: new VideoApi(new ApiClient(streamClient)),
      clientEventReporter: new ClientEventReporter({ streamClient }),
      clientState: new ClientState(),
    });
    const joinAs = (sessionId: string) => {
      call['sfuClient'] = fromPartial<StreamSfuClient>({ sessionId });
    };
    if (sfuSessionId) joinAs(sfuSessionId);

    const request = vi
      .spyOn(streamClient, 'doAxiosRequest')
      .mockResolvedValue(fromPartial({ data: {} }));

    return { call, request, joinAs };
  };

  const sent = (request: ReturnType<typeof fakeCall>['request']) =>
    request.mock.calls.map(([method, url, body]) => ({
      method,
      url: String(url),
      body,
    }));

  const rateLimited = (headers: Record<string, string>) =>
    new ErrorFromResponse({
      message: 'Too many requests',
      code: 9,
      status: 429,
      response: fromPartial({ status: 429, headers }),
      unrecoverable: false,
      metadata: {
        response_headers: headers,
        rate_limit: {},
        response_code: 429,
        client_request_id: '',
      },
    });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts the topic, the payload and the SFU session of the sender', async () => {
    const { call, request } = fakeCall('session-1');

    await call.sendData('whiteboard', { op: 'stroke' });

    expect(sent(request)).toEqual([
      {
        method: 'post',
        url: `https://video.stream-io-api.com/api/v2/video/call/test/${callId}/data`,
        body: {
          topic: 'whiteboard',
          seq: 1,
          user_session_id: 'session-1',
          data: { op: 'stroke' },
        },
      },
    ]);
  });

  it('counts the sequence number per topic and returns it', async () => {
    const { call, request } = fakeCall('session-1');

    expect(await call.sendData('whiteboard', {})).toEqual({ seq: 1 });
    expect(await call.sendData('whiteboard', {})).toEqual({ seq: 2 });
    expect(await call.sendData('cursor', {})).toEqual({ seq: 1 });
    expect(await call.sendData('whiteboard', {})).toEqual({ seq: 3 });

    expect(sent(request).map(({ body }) => [body.topic, body.seq])).toEqual([
      ['whiteboard', 1],
      ['whiteboard', 2],
      ['cursor', 1],
      ['whiteboard', 3],
    ]);
  });

  it('restarts the sequence when the client joins with a new session', async () => {
    const { call, joinAs } = fakeCall('session-1');
    await call.sendData('whiteboard', {});
    await call.sendData('whiteboard', {});

    // receivers track seq per user_session_id, so a new session starts over
    joinAs('session-2');

    expect(await call.sendData('whiteboard', {})).toEqual({ seq: 1 });
  });

  it('refuses to send before the call is joined', async () => {
    const { call, request } = fakeCall();

    await expect(call.sendData('whiteboard', {})).rejects.toThrow(
      'Data can be sent only while joined to the call',
    );
    expect(request).not.toHaveBeenCalled();
  });

  it('reports a rate limit as a typed error with the retry delay', async () => {
    const { call, request } = fakeCall('session-1');
    request.mockRejectedValueOnce(
      rateLimited({ 'retry-after': '1', 'x-ratelimit-hit-context': 'Call' }),
    );

    const err = await call.sendData('whiteboard', {}).catch((e) => e);

    expect(err).toBeInstanceOf(CallDataRateLimitError);
    expect(err).toMatchObject({
      name: 'CallDataRateLimitError',
      retryAfterMs: 1000,
      scope: 'call',
      topic: 'whiteboard',
      seq: 1,
    });
    expect(err.cause).toBeInstanceOf(ErrorFromResponse);
  });

  it('reads the user and app limits and their longer retry delay', async () => {
    const { call, request } = fakeCall('session-1');
    request.mockRejectedValueOnce(
      rateLimited({ 'retry-after': '42', 'x-ratelimit-hit-context': 'User' }),
    );
    request.mockRejectedValueOnce(rateLimited({}));

    await expect(call.sendData('whiteboard', {})).rejects.toMatchObject({
      retryAfterMs: 42_000,
      scope: 'user',
    });
    // without headers (for example hidden by a proxy) the delay has a default
    await expect(call.sendData('whiteboard', {})).rejects.toMatchObject({
      retryAfterMs: 1000,
      scope: 'unknown',
    });
  });

  it('uses up the sequence number of a refused message', async () => {
    const { call, request } = fakeCall('session-1');
    request.mockRejectedValueOnce(rateLimited({ 'retry-after': '1' }));

    await expect(call.sendData('whiteboard', {})).rejects.toBeInstanceOf(
      CallDataRateLimitError,
    );
    // the receiver sees the gap at 1 and knows a message did not arrive
    expect(await call.sendData('whiteboard', {})).toEqual({ seq: 2 });
  });

  it('passes other errors through unchanged', async () => {
    const { call, request } = fakeCall('session-1');
    const notJoined = new ErrorFromResponse({
      message: 'user is not joined',
      code: 17,
      status: 403,
      response: fromPartial({ status: 403 }),
      unrecoverable: false,
    });
    request.mockRejectedValueOnce(notJoined);

    await expect(call.sendData('whiteboard', {})).rejects.toBe(notJoined);
  });
});

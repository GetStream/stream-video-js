import { VideoApi } from '../gen/coordinator/video/VideoApi';
import { ApiClient } from '../coordinator/connection/api-client';
import '../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { Call } from '../Call';
import { StreamClient } from '../coordinator/connection/client';
import { ClientEventReporter } from '../reporting';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { ClientState } from '../store';
import { CallSessionResponse } from '../gen/coordinator';
import { dateToNs } from '../helpers/time';

describe('Call.getRingState', () => {
  const callId = generateUUIDv4();

  const fakeCall = (sessionId?: string) => {
    const streamClient = new StreamClient('abc');
    const call = new Call({
      type: 'test',
      id: callId,
      streamClient,
      videoApi: new VideoApi(new ApiClient(streamClient)),
      clientEventReporter: new ClientEventReporter({ streamClient }),
      clientState: new ClientState(),
    });

    if (sessionId) {
      call.state['sessionSubject'].next(
        fromPartial<CallSessionResponse>({ id: sessionId }),
      );
    }

    const request = vi
      .spyOn(streamClient, 'doAxiosRequest')
      .mockResolvedValue(fromPartial({ data: { session_id: sessionId } }));

    return { call, request };
  };

  const lastCall = (request: ReturnType<typeof fakeCall>['request']) => {
    const [method, url, , options] = request.mock.calls.at(-1)!;
    return { method, url: String(url), params: options?.params };
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the ring state of the current session', async () => {
    const { call, request } = fakeCall('session-1');

    await call.getRingState();

    expect(lastCall(request)).toMatchObject({
      method: 'get',
      url: `https://video.stream-io-api.com/api/v2/video/call/test/${callId}/ring_state`,
      params: { call_session_id: 'session-1' },
    });
  });

  it('reads the ring state of an explicitly named session', async () => {
    // ending a call clears its current session, so a caller reconciling after
    // `call.ended` has to name the session it rang on
    const { call, request } = fakeCall('current-session');

    await call.getRingState('ended-session');

    expect(lastCall(request).params).toMatchObject({
      call_session_id: 'ended-session',
    });
  });

  it('returns the coordinator response', async () => {
    const { call, request } = fakeCall('session-1');
    const acceptedAt = dateToNs(new Date('2026-08-24T10:00:04Z'));
    request.mockResolvedValue(
      fromPartial({
        data: { session_id: 'session-1', accepted_by: { bob: acceptedAt } },
      }),
    );

    await expect(call.getRingState()).resolves.toMatchObject({
      session_id: 'session-1',
      accepted_by: { bob: acceptedAt },
    });
  });

  it('rejects when the call has no session to read', async () => {
    const { call, request } = fakeCall();

    await expect(call.getRingState()).rejects.toThrow(
      'Cannot read the ring state: the call has no session',
    );
    expect(request).not.toHaveBeenCalled();
  });
});

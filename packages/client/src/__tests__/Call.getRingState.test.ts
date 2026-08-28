import '../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { Call } from '../Call';
import { StreamClient } from '../coordinator/connection/client';
import { ClientEventReporter } from '../reporting';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { StreamVideoWriteableStateStore } from '../store';
import { CallSessionResponse } from '../gen/coordinator';

describe('Call.getRingState', () => {
  const callId = generateUUIDv4();

  const fakeCall = (sessionId?: string) => {
    const streamClient = new StreamClient('abc');
    const call = new Call({
      type: 'test',
      id: callId,
      streamClient,
      clientEventReporter: new ClientEventReporter({ streamClient }),
      clientStore: new StreamVideoWriteableStateStore(),
    });

    if (sessionId) {
      call.state['sessionSubject'].next(
        fromPartial<CallSessionResponse>({ id: sessionId }),
      );
    }

    const get = vi
      .spyOn(streamClient, 'get')
      .mockResolvedValue(fromPartial({ session_id: sessionId }));

    return { call, get };
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the ring state of the current session', async () => {
    const { call, get } = fakeCall('session-1');

    await call.getRingState();

    expect(get).toHaveBeenCalledWith(`/call/test/${callId}/ring_state`, {
      call_session_id: 'session-1',
    });
  });

  it('reads the ring state of an explicitly named session', async () => {
    // ending a call clears its current session, so a caller reconciling after
    // `call.ended` has to name the session it rang on
    const { call, get } = fakeCall('current-session');

    await call.getRingState('ended-session');

    expect(get).toHaveBeenCalledWith(`/call/test/${callId}/ring_state`, {
      call_session_id: 'ended-session',
    });
  });

  it('returns the coordinator response', async () => {
    const { call, get } = fakeCall('session-1');
    get.mockResolvedValue(
      fromPartial({
        session_id: 'session-1',
        accepted_by: { bob: '2026-08-24T10:00:04Z' },
      }),
    );

    await expect(call.getRingState()).resolves.toMatchObject({
      session_id: 'session-1',
      accepted_by: { bob: '2026-08-24T10:00:04Z' },
    });
  });

  it('rejects when the call has no session to read', async () => {
    const { call, get } = fakeCall();

    await expect(call.getRingState()).rejects.toThrow(
      'Cannot read the ring state: the call has no session',
    );
    expect(get).not.toHaveBeenCalled();
  });
});

import '../../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../../Call';
import { RingStatePoller } from '../RingStatePoller';
import { StreamClient } from '../../coordinator/connection/client';
import { ClientEventReporter } from '../../reporting';
import { generateUUIDv4 } from '../../coordinator/connection/utils';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';
import {
  ErrorFromResponse,
  type StreamClientOptions,
} from '../../coordinator/connection/types';
import type { GetCallRingStateResponse } from '../../gen/coordinator';

const SESSION_ID = 'session-1';
const START_AFTER_MS = 15_000;
const INTERVAL_MS = 5_000;

const ringState = (
  overrides: Partial<GetCallRingStateResponse> = {},
): GetCallRingStateResponse => ({
  duration: '1ms',
  call_cid: 'test:call',
  session_id: SESSION_ID,
  created_by_user_id: 'jane',
  accepted_by: {},
  rejected_by: {},
  missed_by: {},
  ...overrides,
});

describe('RingStatePoller', () => {
  const userId = 'jane';
  let call: Call;
  let poller: RingStatePoller;

  const createCall = (options?: StreamClientOptions) => {
    const clientStore = new StreamVideoWriteableStateStore();
    const streamClient = new StreamClient('abc', options);
    const newCall = new Call({
      type: 'test',
      id: generateUUIDv4(),
      streamClient,
      clientEventReporter: new ClientEventReporter({ streamClient }),
      clientStore,
    });

    // @ts-expect-error mocking only what we need for the test
    clientStore.connectedUserSubject.next({ id: userId });
    // @ts-expect-error mocking only what we need for the test
    newCall.state['createdBySubject'].next({ id: userId });
    // @ts-expect-error mocking only what we need for the test
    newCall.state['sessionSubject'].next({
      id: SESSION_ID,
      accepted_by: {},
      rejected_by: {},
      missed_by: {},
      participants: [],
    });
    newCall.state['settingsSubject'].next({
      ring: {
        auto_cancel_timeout_ms: 30_000,
        incoming_call_timeout_ms: 30_000,
        missed_call_timeout_ms: 30_000,
      },
      // @ts-expect-error mocking only what we need for the test
      screensharing: {
        enabled: false,
        target_resolution: { width: 100, height: 100 },
      },
    });
    newCall.state.setMembers([{ user_id: userId }, { user_id: 'john' }]);
    newCall.state['callingStateSubject'].next(CallingState.RINGING);

    vi.spyOn(newCall, 'join').mockResolvedValue(undefined);
    vi.spyOn(newCall, 'leave').mockResolvedValue(undefined);

    return newCall;
  };

  const startPolling = (response = ringState()) => {
    const getRingState = vi
      .spyOn(call, 'getRingState')
      .mockResolvedValue(response);
    poller = new RingStatePoller(call);
    poller.start();
    return getRingState;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    call = createCall();
  });

  afterEach(() => {
    poller?.stop();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not poll before the quiet period elapses', async () => {
    const getRingState = startPolling();

    await vi.advanceTimersByTimeAsync(START_AFTER_MS - 1);
    expect(getRingState).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(getRingState).toHaveBeenCalledWith(SESSION_ID);
  });

  it('keeps polling on the configured interval while the ring is pending', async () => {
    const getRingState = startPolling();

    await vi.advanceTimersByTimeAsync(START_AFTER_MS);
    expect(getRingState).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(getRingState).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(getRingState).toHaveBeenCalledTimes(3);
  });

  it('joins the call once when someone else accepted', async () => {
    const getRingState = startPolling(
      ringState({ accepted_by: { john: '2026-08-24T10:00:04Z' } }),
    );

    await vi.advanceTimersByTimeAsync(START_AFTER_MS + 3 * INTERVAL_MS);

    expect(call.join).toHaveBeenCalledTimes(1);
    expect(getRingState).toHaveBeenCalledTimes(1);
  });

  it('ignores an acceptance by the current user', async () => {
    startPolling(
      ringState({ accepted_by: { [userId]: '2026-08-24T10:00:04Z' } }),
    );

    await vi.advanceTimersByTimeAsync(START_AFTER_MS);

    expect(call.join).not.toHaveBeenCalled();
  });

  it('cancels the call when everyone else rejected', async () => {
    startPolling(ringState({ rejected_by: { john: '2026-08-24T10:00:09Z' } }));

    await vi.advanceTimersByTimeAsync(START_AFTER_MS);

    expect(call.leave).toHaveBeenCalledWith({
      reject: true,
      reason: 'cancel',
      message: 'ring: everyone rejected',
    });
  });

  it('drops the call when everyone else missed it', async () => {
    startPolling(ringState({ missed_by: { john: '2026-08-24T10:00:35Z' } }));

    await vi.advanceTimersByTimeAsync(START_AFTER_MS);

    expect(call.leave).toHaveBeenCalledWith({
      reject: true,
      reason: 'timeout',
      message: 'ring: no one accepted',
    });
  });

  it('leaves without rejecting when the call has ended, even if it was accepted', async () => {
    startPolling(
      ringState({
        accepted_by: { john: '2026-08-24T10:00:04Z' },
        call_ended_at: '2026-08-24T10:00:20Z',
      }),
    );

    await vi.advanceTimersByTimeAsync(START_AFTER_MS);

    expect(call.join).not.toHaveBeenCalled();
    expect(call.leave).toHaveBeenCalledWith({
      reject: false,
      message: 'ring: call ended',
    });
  });

  it('restarts the quiet period when a ring event arrives over the WebSocket', async () => {
    const getRingState = startPolling();

    await vi.advanceTimersByTimeAsync(START_AFTER_MS - 1_000);
    call['streamClient'].dispatchEvent({
      type: 'call.rejected',
      call_cid: call.cid,
      // @ts-expect-error mocking only what we need for the test
      user: { id: 'john' },
    });

    await vi.advanceTimersByTimeAsync(1_000);
    expect(getRingState).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(START_AFTER_MS - 1_000);
    expect(getRingState).toHaveBeenCalledTimes(1);
  });

  it('stops polling once the call is no longer ringing', async () => {
    const getRingState = startPolling();

    await vi.advanceTimersByTimeAsync(START_AFTER_MS);
    expect(getRingState).toHaveBeenCalledTimes(1);

    call.state['callingStateSubject'].next(CallingState.JOINED);
    await vi.advanceTimersByTimeAsync(3 * INTERVAL_MS);
    expect(getRingState).toHaveBeenCalledTimes(1);
  });

  it('stops polling once the ring window has closed', async () => {
    const getRingState = startPolling();

    await vi.advanceTimersByTimeAsync(30_000);
    const callsWithinWindow = getRingState.mock.calls.length;
    expect(callsWithinWindow).toBeGreaterThan(0);

    await vi.advanceTimersByTimeAsync(3 * INTERVAL_MS);
    expect(getRingState).toHaveBeenCalledTimes(callsWithinWindow);
  });

  it('stops polling on an unrecoverable response, but not on a transient one', async () => {
    const getRingState = vi.spyOn(call, 'getRingState');
    const error = (status: number) =>
      new ErrorFromResponse({
        message: 'boom',
        code: 16,
        status,
        // @ts-expect-error mocking only what we need for the test
        response: {},
        unrecoverable: false,
      });

    getRingState.mockRejectedValueOnce(error(500));
    poller = new RingStatePoller(call);
    poller.start();

    await vi.advanceTimersByTimeAsync(START_AFTER_MS);
    expect(getRingState).toHaveBeenCalledTimes(1);

    getRingState.mockRejectedValueOnce(error(404));
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(getRingState).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(3 * INTERVAL_MS);
    expect(getRingState).toHaveBeenCalledTimes(2);
  });

  it('does not start without a call session', async () => {
    call.state['sessionSubject'].next(undefined);
    const getRingState = startPolling();

    await vi.advanceTimersByTimeAsync(START_AFTER_MS + INTERVAL_MS);
    expect(getRingState).not.toHaveBeenCalled();
  });

  it('honors the configured timings', async () => {
    const getRingState = vi
      .spyOn(call, 'getRingState')
      .mockResolvedValue(ringState());
    poller = new RingStatePoller(call, {
      startAfterMs: 1_000,
      intervalMs: 500,
    });
    poller.start();

    await vi.advanceTimersByTimeAsync(1_000);
    expect(getRingState).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(500);
    expect(getRingState).toHaveBeenCalledTimes(2);
  });
});

describe('Call ring state polling', () => {
  const userId = 'jane';

  const createRingingCall = (options?: StreamClientOptions) => {
    const clientStore = new StreamVideoWriteableStateStore();
    const streamClient = new StreamClient('abc', options);
    const call = new Call({
      type: 'test',
      id: generateUUIDv4(),
      streamClient,
      clientEventReporter: new ClientEventReporter({ streamClient }),
      clientStore,
      ringing: true,
    });

    // @ts-expect-error mocking only what we need for the test
    clientStore.connectedUserSubject.next({ id: userId });
    // @ts-expect-error mocking only what we need for the test
    call.state['sessionSubject'].next({
      id: SESSION_ID,
      accepted_by: {},
      rejected_by: {},
      missed_by: {},
      participants: [],
    });
    call.state['settingsSubject'].next({
      // @ts-expect-error mocking only what we need for the test
      ring: { auto_cancel_timeout_ms: 30_000 },
      // @ts-expect-error mocking only what we need for the test
      screensharing: {
        enabled: false,
        target_resolution: { width: 100, height: 100 },
      },
    });
    return call;
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('polls for the caller', () => {
    const call = createRingingCall();
    // @ts-expect-error mocking only what we need for the test
    call.state['createdBySubject'].next({ id: userId });

    call['handleRingingCall']();
    expect(call['ringStatePoller']).toBeDefined();
  });

  it('does not poll for the callee', () => {
    const call = createRingingCall();
    // @ts-expect-error mocking only what we need for the test
    call.state['createdBySubject'].next({ id: 'not-' + userId });

    call['handleRingingCall']();
    expect(call['ringStatePoller']).toBeUndefined();
  });

  it('does not poll when disabled through the client options', () => {
    const call = createRingingCall({ ringStatePolling: false });
    // @ts-expect-error mocking only what we need for the test
    call.state['createdBySubject'].next({ id: userId });

    call['handleRingingCall']();
    expect(call['ringStatePoller']).toBeUndefined();
  });
});

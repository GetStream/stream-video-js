import '../../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { Call } from '../../Call';
import { RingTimeout } from '../RingTimeout';
import { StreamClient } from '../../coordinator/connection/client';
import { ClientEventReporter } from '../../reporting';
import { generateUUIDv4 } from '../../coordinator/connection/utils';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';
import { CallSettingsResponse } from '../../gen/coordinator';

const TIMEOUT_MS = 30_000;

describe('RingTimeout', () => {
  const userId = 'jane';
  let call: Call;
  let ringTimeout: RingTimeout;

  const ringingCall = ({
    createdById = userId,
    ring = {
      auto_cancel_timeout_ms: TIMEOUT_MS,
      incoming_call_timeout_ms: TIMEOUT_MS,
      missed_call_timeout_ms: TIMEOUT_MS,
    },
  }: {
    createdById?: string;
    ring?: Partial<CallSettingsResponse['ring']> | null;
  } = {}) => {
    const clientStore = new StreamVideoWriteableStateStore();
    const streamClient = new StreamClient('abc');
    const newCall = new Call({
      type: 'test',
      id: generateUUIDv4(),
      streamClient,
      clientEventReporter: new ClientEventReporter({ streamClient }),
      clientStore,
    });

    clientStore.connectedUserSubject.next(fromPartial({ id: userId }));
    newCall.state['createdBySubject'].next(fromPartial({ id: createdById }));
    // leaving `settings` unset is how a call built from a push notification
    // looks until `get()` resolves
    if (ring) {
      newCall.state['settingsSubject'].next(
        fromPartial<CallSettingsResponse>({
          ring,
          screensharing: {
            enabled: false,
            target_resolution: { width: 100, height: 100 },
          },
        }),
      );
    }
    newCall.state['callingStateSubject'].next(CallingState.RINGING);

    vi.spyOn(newCall, 'leave').mockResolvedValue(undefined);
    return newCall;
  };

  const arm = () => {
    ringTimeout = new RingTimeout(call);
    ringTimeout.start();
    return ringTimeout;
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    ringTimeout?.stop();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('drops the call for the caller when no one accepted', async () => {
    call = ringingCall();
    arm();

    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);

    expect(call.leave).toHaveBeenCalledWith({
      reject: true,
      reason: 'timeout',
      message: 'ringing timeout - no one accepted',
    });
  });

  it('drops the call for a callee that never interacted', async () => {
    call = ringingCall({ createdById: 'not-' + userId });
    arm();

    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);

    expect(call.leave).toHaveBeenCalledWith({
      reject: true,
      reason: 'timeout',
      message: `ringing timeout - user didn't interact with incoming call screen`,
    });
  });

  it('does not drop the call before the timeout elapses', async () => {
    call = ringingCall();
    arm();

    await vi.advanceTimersByTimeAsync(TIMEOUT_MS - 1);
    expect(call.leave).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(call.leave).toHaveBeenCalled();
  });

  it('does not drop a call that stopped ringing before the deadline', async () => {
    call = ringingCall();
    arm();

    call.state['callingStateSubject'].next(CallingState.JOINED);

    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    expect(call.leave).not.toHaveBeenCalled();
  });

  // `doJoin` restores the ringing state when a join fails, so a transition to
  // JOINING must not disarm the drop for good, or the call rings forever.
  it('still drops the call after a join attempt failed and left it ringing', async () => {
    call = ringingCall();
    arm();

    call.state['callingStateSubject'].next(CallingState.JOINING);
    call.state['callingStateSubject'].next(CallingState.RINGING);

    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    expect(call.leave).toHaveBeenCalledWith({
      reject: true,
      reason: 'timeout',
      message: 'ringing timeout - no one accepted',
    });
  });

  it('does not drop the call once stopped', async () => {
    call = ringingCall();
    arm().stop();

    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    expect(call.leave).not.toHaveBeenCalled();
  });

  it('does not arm when the call is not ringing', async () => {
    call = ringingCall();
    call.state['callingStateSubject'].next(CallingState.JOINED);
    arm();

    expect(ringTimeout['timeoutId']).toBeUndefined();
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    expect(call.leave).not.toHaveBeenCalled();
  });

  it('does not arm before the call settings have loaded', async () => {
    call = ringingCall({ ring: null });
    arm();

    expect(ringTimeout['timeoutId']).toBeUndefined();
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    expect(call.leave).not.toHaveBeenCalled();
  });

  it('treats a zero timeout as no auto-drop', async () => {
    call = ringingCall({
      ring: {
        auto_cancel_timeout_ms: 0,
        incoming_call_timeout_ms: 0,
        missed_call_timeout_ms: TIMEOUT_MS,
      },
    });
    arm();

    expect(ringTimeout['timeoutId']).toBeUndefined();
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    expect(call.leave).not.toHaveBeenCalled();
  });
});

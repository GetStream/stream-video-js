import '../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { Call } from '../Call';
import { StreamClient } from '../coordinator/connection/client';
import { ClientEventReporter } from '../reporting';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { CallingState, ClientState } from '../store';
import { CallSettingsResponse } from '../gen/coordinator';

const TIMEOUT_MS = 30_000;

// The timeout's own behaviour is covered by `ringing/__tests__/RingTimeout`.
// This file covers the wiring: that a ringing call arms one and that leaving
// cancels it.
describe('Auto drop ringing calls', () => {
  const userId = 'jane';
  let call: Call;

  const ringingCall = () => {
    const clientState = new ClientState();
    const streamClient = new StreamClient('abc');
    const newCall = new Call({
      type: 'test',
      id: generateUUIDv4(),
      streamClient,
      clientEventReporter: new ClientEventReporter({ streamClient }),
      clientState,
      ringing: true,
    });

    clientState.setConnectedUser(fromPartial({ id: userId }));
    newCall.state['createdBySubject'].next(fromPartial({ id: userId }));
    newCall.state['settingsSubject'].next(
      fromPartial<CallSettingsResponse>({
        ring: {
          auto_cancel_timeout_ms: TIMEOUT_MS,
          incoming_call_timeout_ms: TIMEOUT_MS,
          missed_call_timeout_ms: TIMEOUT_MS,
        },
        screensharing: {
          enabled: false,
          target_resolution: { width: 100, height: 100 },
        },
      }),
    );
    newCall.state['sessionSubject'].next(
      fromPartial({
        id: 'session-1',
        accepted_by: {},
        rejected_by: {},
        missed_by: {},
      }),
    );
    newCall.state['callingStateSubject'].next(CallingState.RINGING);

    vi.spyOn(newCall, 'leave').mockResolvedValue(undefined);
    return newCall;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    call = ringingCall();
  });

  afterEach(() => {
    call['cancelAutoDrop']();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('is armed when a call starts ringing', async () => {
    call.state['callingStateSubject'].next(CallingState.IDLE);

    call['handleRingingCall']();

    expect(call['ringTimeout']).toBeDefined();
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    expect(call.leave).toHaveBeenCalledWith({
      reject: true,
      reason: 'timeout',
      message: 'ringing timeout - no one accepted',
    });
  });

  it('is cancelled by cancelAutoDrop', async () => {
    call['scheduleAutoDrop']();

    call['cancelAutoDrop']();

    expect(call['ringTimeout']).toBeUndefined();
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    expect(call.leave).not.toHaveBeenCalled();
  });

  // the calling state stays RINGING well into teardown, so the watchdogs have
  // to be paused before `leave` awaits anything
  it('pauses the watchdogs synchronously when leave starts', async () => {
    call['scheduleAutoDrop']();
    call['scheduleRingStatePolling']();
    const timeout = call['ringTimeout'];
    vi.spyOn(call, 'leave').mockRestore();
    vi.spyOn(call, 'reject').mockResolvedValue(fromPartial({}));

    const poller = call['ringStatePoller'];

    const leaving = call.leave({ reject: false });

    // paused, not cancelled: both keep the window this leave is ending
    expect(call['ringTimeout']).toBe(timeout);
    expect(call['ringStatePoller']).toBe(poller);
    expect(timeout!['timeoutId']).toBeUndefined();
    expect(timeout!['stopped']).toBe(false);
    expect(poller!['idleTimeoutId']).toBeUndefined();
    expect(poller!['stopped']).toBe(false);

    await leaving.catch(() => {});

    expect(timeout!['stopped']).toBe(true);
    expect(poller!['stopped']).toBe(true);
  });

  it('restores both watchdogs when rejecting the ring fails', async () => {
    call['scheduleAutoDrop']();
    call['scheduleRingStatePolling']();
    const timeout = call['ringTimeout'];
    const deadlineAt = timeout!['deadlineAt'];
    const poller = call['ringStatePoller'];
    const pollDeadlineAt = poller!['deadlineAt'];
    vi.spyOn(call, 'leave').mockRestore();
    vi.spyOn(call, 'reject').mockRejectedValueOnce(new Error('transient'));

    await expect(call.leave({ reject: true })).rejects.toThrow('transient');

    expect(call.state.callingState).toBe(CallingState.RINGING);
    expect(call['ringTimeout']).toBe(timeout);
    expect(timeout!['timeoutId']).toBeDefined();
    expect(timeout!['deadlineAt']).toBe(deadlineAt);
    expect(call['ringStatePoller']).toBe(poller);
    expect(poller!['deadlineAt']).toBe(pollDeadlineAt);
    expect(poller!['stopped']).toBe(false);
  });

  it('replaces a previously armed timeout', async () => {
    call['scheduleAutoDrop']();
    const first = call['ringTimeout'];

    call['scheduleAutoDrop']();

    expect(call['ringTimeout']).not.toBe(first);
    expect(first!['stopped']).toBe(true);
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    expect(call.leave).toHaveBeenCalledTimes(1);
  });
});

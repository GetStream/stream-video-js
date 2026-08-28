import '../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { Call } from '../Call';
import { StreamClient } from '../coordinator/connection/client';
import { ClientEventReporter } from '../reporting';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { CallingState, StreamVideoWriteableStateStore } from '../store';
import { CallSettingsResponse } from '../gen/coordinator';

const TIMEOUT_MS = 30_000;

// The timeout's own behaviour is covered by `ringing/__tests__/RingTimeout`.
// This file covers the wiring: that a ringing call arms one and that leaving
// cancels it.
describe('Auto drop ringing calls', () => {
  const userId = 'jane';
  let call: Call;

  const ringingCall = () => {
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

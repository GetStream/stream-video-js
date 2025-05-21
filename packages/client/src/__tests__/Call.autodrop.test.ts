import '../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../Call';
import { StreamClient } from '../coordinator/connection/client';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { CallingState, StreamVideoWriteableStateStore } from '../store';

describe('Auto drop ringing calls', () => {
  let call: Call;
  const userId = 'jane';

  beforeEach(async () => {
    vi.useFakeTimers();

    const clientStore = new StreamVideoWriteableStateStore();
    call = new Call({
      type: 'test',
      id: generateUUIDv4(),
      streamClient: new StreamClient('abc'),
      clientStore: clientStore,
    });

    // @ts-expect-error mocking only what we need for the test
    clientStore.connectedUserSubject.next({
      id: userId,
    });

    call.state['callingStateSubject'].next(CallingState.RINGING);

    vi.spyOn(call, 'leave').mockImplementation(async () => {
      console.log(`TEST: leave() called`);
    });
  });

  it('caller should drop ringing calls after a timeout if no one accepted', async () => {
    call.state['settingsSubject'].next({
      // @ts-expect-error mocking only what we need for the test, we use fake timers, so undefined for timeout works
      ring: {},
      // @ts-expect-error mocking only what we need for the test
      screensharing: {
        enabled: false,
        target_resolution: {
          width: 100,
          height: 100,
        },
      },
    });

    // @ts-expect-error mocking only what we need for the test
    call.state['createdBySubject'].next({
      id: userId,
    });

    // black-box test, calling private method
    call['scheduleAutoDrop']();

    await vi.runAllTimersAsync();

    expect(call.leave).toHaveBeenCalledWith({
      reject: true,
      reason: 'timeout',
      message: `ringing timeout - no one accepted`,
    });
  });

  it(`callee should drop ringing calls after a timeout if user didn't interact with incoming call screen`, async () => {
    call.state['settingsSubject'].next({
      // @ts-expect-error mocking only what we need for the test, we use fake timers, so undefined for timeout works
      ring: {},
      // @ts-expect-error mocking only what we need for the test
      screensharing: {
        enabled: false,
        target_resolution: {
          width: 100,
          height: 100,
        },
      },
    });

    // @ts-expect-error mocking only what we need for the test
    call.state['createdBySubject'].next({
      id: 'not-' + userId,
    });

    // black-box test, calling private method
    call['scheduleAutoDrop']();

    await vi.runAllTimersAsync();

    expect(call.leave).toHaveBeenCalledWith({
      reject: true,
      reason: 'timeout',
      message: `ringing timeout - user didn't interact with incoming call screen`,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

import '../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../Call';
import { StreamClient } from '../coordinator/connection/client';
import { ClientEventReporter } from '../reporting';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { CallingState, StreamVideoWriteableStateStore } from '../store';
import type {
  CallSettingsResponse,
  OwnUserResponse,
  UserResponse,
} from '../gen/coordinator';

describe('Auto drop ringing calls', () => {
  let call: Call;
  const userId = 'jane';

  beforeEach(async () => {
    vi.useFakeTimers();

    const clientStore = new StreamVideoWriteableStateStore();
    const streamClient = new StreamClient('abc');
    call = new Call({
      type: 'test',
      id: generateUUIDv4(),
      streamClient,
      clientEventReporter: new ClientEventReporter({ streamClient }),
      clientStore: clientStore,
    });

    clientStore.setConnectedUser(
      // mocking only what we need for the test
      { id: userId } as unknown as OwnUserResponse,
    );

    call.state.setCallingState(CallingState.RINGING);

    vi.spyOn(call, 'leave').mockImplementation(async () => {
      console.log(`TEST: leave() called`);
    });
  });

  it('caller should drop ringing calls after a timeout if no one accepted', async () => {
    call.state.setState({
      settings: {
        // we use fake timers, so an undefined timeout works
        ring: {},
        screensharing: {
          enabled: false,
          target_resolution: { width: 100, height: 100 },
        },
      } as unknown as CallSettingsResponse,
    });

    call.state.setState({
      createdBy: { id: userId } as unknown as UserResponse,
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
    call.state.setState({
      settings: {
        // we use fake timers, so an undefined timeout works
        ring: {},
        screensharing: {
          enabled: false,
          target_resolution: { width: 100, height: 100 },
        },
      } as unknown as CallSettingsResponse,
    });

    call.state.setState({
      createdBy: { id: `not-${userId}` } as unknown as UserResponse,
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

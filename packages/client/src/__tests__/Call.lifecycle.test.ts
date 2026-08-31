/**
 * @vitest-environment happy-dom
 */

import '../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../Call';
import { StreamClient } from '../coordinator/connection/client';
import { ClientEventReporter } from '../reporting';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { CallingState, StreamVideoWriteableStateStore } from '../store';
import { promiseWithResolvers } from '../helpers/promise';

describe('Call lifecycle wiring', () => {
  let call: Call;

  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      headers: { get: () => 'AMS1-P2' },
    } as Response);
    const streamClient = new StreamClient('abc');
    call = new Call({
      type: 'test',
      id: generateUUIDv4(),
      streamClient,
      clientEventReporter: new ClientEventReporter({
        streamClient,
        enabled: false,
      }),
      clientStore: new StreamVideoWriteableStateStore(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Regression guard for the Call-owned helper teardown chain. Each of
  // these helpers holds a resource (timer, listener, AudioContext) that
  // leaks across calls if teardown is dropped during a refactor.
  // Covers trackSubscriptionManager, audioBindingsWatchdog, and
  // dynascaleManager. SFU-lifecycle disposables (publisher/subscriber/
  // sfuStatsReporter) require a real join and are out of scope.
  it('call.leave() tears down all Call-owned helpers exactly once', async () => {
    const trackSubDispose = vi.spyOn(call.trackSubscriptionManager, 'dispose');
    const audioBindingsDispose = vi.spyOn(
      call.audioBindingsWatchdog!,
      'dispose',
    );
    const dynascaleDispose = vi.spyOn(call.dynascaleManager!, 'dispose');

    await call.leave();

    expect(trackSubDispose).toHaveBeenCalledTimes(1);
    expect(audioBindingsDispose).toHaveBeenCalledTimes(1);
    expect(dynascaleDispose).toHaveBeenCalledTimes(1);
  });

  // Order matters: the SFU subscription pump must finish tearing down
  // before DynascaleManager closes its AudioContext, otherwise helpers
  // can run on a closed context (logged as warnings or thrown by
  // happy-dom). This is the contract the leave() teardown chain encodes.
  it('call.leave() tears down helpers in the documented order', async () => {
    const trackSubDispose = vi.spyOn(call.trackSubscriptionManager, 'dispose');
    const audioBindingsDispose = vi.spyOn(
      call.audioBindingsWatchdog!,
      'dispose',
    );
    const dynascaleDispose = vi.spyOn(call.dynascaleManager!, 'dispose');

    await call.leave();

    const trackSubOrder = trackSubDispose.mock.invocationCallOrder[0];
    const audioBindingsOrder = audioBindingsDispose.mock.invocationCallOrder[0];
    const dynascaleOrder = dynascaleDispose.mock.invocationCallOrder[0];

    expect(trackSubOrder).toBeLessThan(audioBindingsOrder);
    expect(audioBindingsOrder).toBeLessThan(dynascaleOrder);
  });

  // `leave()` while a join is in flight waits for that join to settle before
  // tearing anything down, and it does so holding the join/leave concurrency
  // tag. Waiting specifically for JOINED would never resolve when the join
  // fails, wedging the tag and every later join/leave on this call.
  it('call.leave() resolves when an in-flight join fails instead of JOINED', async () => {
    call.state.setCallingState(CallingState.JOINING);

    let settled = false;
    const leaving = call.leave().then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false); // still waiting on the join

    // the join fails rather than reaching JOINED
    call.state.setCallingState(CallingState.RECONNECTING_FAILED);

    await leaving;
    expect(settled).toBe(true);
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });

  it('call.leave() still waits for a successful in-flight join', async () => {
    call.state.setCallingState(CallingState.JOINING);

    let settled = false;
    const leaving = call.leave().then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    call.state.setCallingState(CallingState.JOINED);

    await leaving;
    expect(settled).toBe(true);
  });

  it('call.join() shares an in-flight join flow', async () => {
    const joinTask = promiseWithResolvers<void>();
    vi.spyOn(call, 'setup').mockResolvedValue(undefined);
    const doJoin = vi
      .spyOn(call as unknown as { doJoin: Call['join'] }, 'doJoin')
      .mockReturnValue(joinTask.promise);

    const firstJoin = call.join();
    const secondJoin = call.join();

    await Promise.resolve();
    expect(doJoin).toHaveBeenCalledTimes(1);

    joinTask.resolve();
    await expect(Promise.all([firstJoin, secondJoin])).resolves.toEqual([
      undefined,
      undefined,
    ]);
  });
});

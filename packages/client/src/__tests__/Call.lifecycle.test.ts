import '../rtc/__tests__/mocks/webrtc.mocks';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../Call';
import { StreamClient } from '../coordinator/connection/client';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { StreamVideoWriteableStateStore } from '../store';

describe('Call lifecycle wiring', () => {
  let call: Call;

  beforeEach(() => {
    call = new Call({
      type: 'test',
      id: generateUUIDv4(),
      streamClient: new StreamClient('abc'),
      clientStore: new StreamVideoWriteableStateStore(),
    });
  });

  // Regression guard for the Call-owned helper teardown chain. Each of
  // these helpers holds a resource (timer, listener, AudioContext) that
  // leaks across calls if teardown is dropped during a refactor.
  // Covers trackSubscriptionManager, audioHealthMonitor,
  // audioBindingsWatchdog, and dynascaleManager. SFU-lifecycle disposables
  // (publisher/subscriber/sfuStatsReporter) require a real join and are
  // out of scope for this unit test.
  it('call.leave() tears down all Call-owned helpers exactly once', async () => {
    const trackSubDispose = vi.spyOn(call.trackSubscriptionManager, 'dispose');
    const audioHealthStop = vi.spyOn(call.audioHealthMonitor!, 'stop');
    const audioBindingsDispose = vi.spyOn(
      call.audioBindingsWatchdog!,
      'dispose',
    );
    const dynascaleDispose = vi.spyOn(call.dynascaleManager, 'dispose');

    await call.leave();

    expect(trackSubDispose).toHaveBeenCalledTimes(1);
    expect(audioHealthStop).toHaveBeenCalledTimes(1);
    expect(audioBindingsDispose).toHaveBeenCalledTimes(1);
    expect(dynascaleDispose).toHaveBeenCalledTimes(1);
  });

  // Order matters: audio probes and the SFU subscription pump must finish
  // tearing down before DynascaleManager closes its AudioContext, otherwise
  // helpers can run on a closed context (logged as warnings or thrown by
  // happy-dom). This is the contract the leave() teardown chain encodes.
  it('call.leave() tears down helpers in the documented order', async () => {
    const trackSubDispose = vi.spyOn(call.trackSubscriptionManager, 'dispose');
    const audioBindingsDispose = vi.spyOn(
      call.audioBindingsWatchdog!,
      'dispose',
    );
    const audioHealthStop = vi.spyOn(call.audioHealthMonitor!, 'stop');
    const dynascaleDispose = vi.spyOn(call.dynascaleManager, 'dispose');

    await call.leave();

    const trackSubOrder = trackSubDispose.mock.invocationCallOrder[0];
    const audioBindingsOrder = audioBindingsDispose.mock.invocationCallOrder[0];
    const audioHealthOrder = audioHealthStop.mock.invocationCallOrder[0];
    const dynascaleOrder = dynascaleDispose.mock.invocationCallOrder[0];

    expect(trackSubOrder).toBeLessThan(audioBindingsOrder);
    expect(audioBindingsOrder).toBeLessThan(audioHealthOrder);
    expect(audioHealthOrder).toBeLessThan(dynascaleOrder);
  });
});

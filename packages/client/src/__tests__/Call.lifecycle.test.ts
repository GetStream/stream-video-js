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
});

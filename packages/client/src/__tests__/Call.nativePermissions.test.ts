import '../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../Call';
import { VideoApi } from '../gen/coordinator/video/VideoApi';
import { ApiClient } from '../coordinator/connection/api-client';
import { StreamClient } from '../coordinator/connection/client';
import { ClientEventReporter } from '../reporting';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { ClientState } from '../store';

vi.mock('../helpers/platforms', () => ({
  isReactNative: vi.fn(() => true),
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Call native permission tracing (React Native)', () => {
  let query: ReturnType<typeof vi.fn>;

  const createCall = () => {
    const streamClient = new StreamClient('abc');
    return new Call({
      type: 'test',
      id: generateUUIDv4(),
      streamClient,
      videoApi: new VideoApi(new ApiClient(streamClient)),
      clientEventReporter: new ClientEventReporter({
        streamClient,
        enabled: false,
      }),
      clientState: new ClientState(),
    });
  };

  const permissionTraces = (call: Call) =>
    call.tracer
      .take()
      .snapshot.filter(([tag]) => tag.endsWith('.permission'))
      .map(([tag, , data]) => [tag, data])
      .sort(([a], [b]) => String(a).localeCompare(String(b)));

  beforeEach(() => {
    query = vi.fn(async (name: string) =>
      name === 'microphone' ? 'denied' : 'granted',
    );
    globalThis.streamRNVideoSDK = {
      callManager: { stop: vi.fn() },
      permissions: { check: vi.fn(), query },
      nativeEvents: { speechActivity: { subscribe: () => () => {} } },
    } as any;
  });

  afterEach(() => {
    globalThis.streamRNVideoSDK = undefined;
  });

  it('traces the native permission state per call, until the call is left', async () => {
    const first = createCall();
    await first.setup();
    await flush();
    expect(permissionTraces(first)).toEqual([
      [
        'navigator.mediaDevices.camera.permission',
        { previous: undefined, state: 'granted' },
      ],
      [
        'navigator.mediaDevices.microphone.permission',
        { previous: undefined, state: 'denied' },
      ],
    ]);

    // the permission singletons are bound to the first call's tracer,
    // a second call still gets its own traces; its setup refreshes the
    // shared native state, so the first call sees the change
    query.mockResolvedValue('granted');
    const second = createCall();
    await second.setup();
    await flush();
    expect(permissionTraces(second)).toEqual([
      [
        'navigator.mediaDevices.camera.permission',
        { previous: undefined, state: 'granted' },
      ],
      [
        'navigator.mediaDevices.microphone.permission',
        { previous: undefined, state: 'denied' },
      ],
      [
        'navigator.mediaDevices.microphone.permission',
        { previous: 'denied', state: 'granted' },
      ],
    ]);
    expect(permissionTraces(first)).toEqual([
      [
        'navigator.mediaDevices.microphone.permission',
        { previous: 'denied', state: 'granted' },
      ],
    ]);

    await first.leave();
    first.tracer.take();
    query.mockResolvedValue('denied');
    await second.leave();
    await second.setup();
    await flush();
    expect(permissionTraces(first)).toEqual([]);
  });
});

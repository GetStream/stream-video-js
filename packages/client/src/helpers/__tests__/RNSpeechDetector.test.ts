import '../../rtc/__tests__/mocks/webrtc.mocks';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RNSpeechDetector } from '../RNSpeechDetector';

describe('RNSpeechDetector', () => {
  // Shared test setup stubs RTCPeerConnection with a vi.fn constructor.
  // We keep a typed handle to that constructor to inspect created instances.
  let rtcPeerConnectionMockCtor: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    rtcPeerConnectionMockCtor =
      globalThis.RTCPeerConnection as unknown as ReturnType<typeof vi.fn>;
    rtcPeerConnectionMockCtor.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ignores late ICE candidates after cleanup', async () => {
    const stream = {
      getTracks: () => [],
    } as unknown as MediaStream;
    const detector = new RNSpeechDetector(stream);

    const cleanup = await detector.start(() => {});
    cleanup();

    // start() creates two peer connections (pc1 and pc2). We pull them from
    // constructor call results to inspect listener wiring and ICE forwarding.
    const [pc1, pc2] = rtcPeerConnectionMockCtor.mock.results.map(
      (result) => result.value,
    );

    // Find the registered ICE callback and invoke it manually after cleanup to
    // simulate a late ICE event arriving during teardown.
    const onIceCandidate = pc1.addEventListener.mock.calls.find(
      ([eventName]: [string]) => eventName === 'icecandidate',
    )?.[1] as ((e: RTCPeerConnectionIceEvent) => void) | undefined;

    expect(onIceCandidate).toBeDefined();
    onIceCandidate?.({
      candidate: { candidate: 'candidate:1 1 UDP 0 127.0.0.1 11111 typ host' },
    } as unknown as RTCPeerConnectionIceEvent);

    expect(pc1.removeEventListener).toHaveBeenCalledWith(
      'icecandidate',
      onIceCandidate,
    );
    expect(pc2.addIceCandidate).not.toHaveBeenCalled();
  });
});

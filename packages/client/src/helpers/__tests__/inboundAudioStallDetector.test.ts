import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInboundAudioStallDetector } from '../inboundAudioStallDetector';
import { CallingState, CallState } from '../../store';
import { TrackType } from '../../gen/video/sfu/models/models';
import type { Subscriber } from '../../rtc';
import type { Tracer } from '../../stats';
import type { StreamVideoParticipant } from '../../types';

describe('inboundAudioStallDetector', () => {
  const STALL_MS = 5000;
  const POLL_MS = 2000;

  let state: CallState;
  let packets: number;
  let getStats: ReturnType<typeof vi.fn>;
  let trace: ReturnType<typeof vi.fn>;
  let stop: (() => void) | undefined;

  const remote = (publishedTracks: TrackType[]) =>
    ({
      sessionId: 'remote-1',
      userId: 'bob',
      publishedTracks,
      isLocalParticipant: false,
    }) as StreamVideoParticipant;

  const start = () => {
    stop = createInboundAudioStallDetector({
      state,
      subscriber: { getStats } as unknown as Subscriber,
      tracer: { trace } as unknown as Tracer,
      stallThresholdMs: STALL_MS,
      pollingIntervalMs: POLL_MS,
    });
  };

  const poll = async (times = 1) => {
    for (let i = 0; i < times; i++) {
      await vi.advanceTimersByTimeAsync(POLL_MS);
    }
  };

  beforeEach(() => {
    vi.useFakeTimers();
    state = new CallState();
    state.setCallingState(CallingState.JOINED);
    state.setParticipants([remote([TrackType.AUDIO])]);
    packets = 0;
    getStats = vi.fn(async () => ({
      forEach: (cb: (s: unknown) => void) =>
        cb({ type: 'inbound-rtp', kind: 'audio', packetsReceived: packets }),
    }));
    trace = vi.fn();
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
    vi.useRealTimers();
  });

  it('does not trace while packets keep arriving', async () => {
    start();
    for (let i = 0; i < 5; i++) {
      packets += 100;
      await poll();
    }
    expect(trace).not.toHaveBeenCalled();
  });

  it('traces a stall once past the threshold, and its end when packets resume', async () => {
    start();
    packets = 100;
    await poll(); // baseline sample at 2 s
    await poll(3); // flat at 4 s, 6 s, 8 s: 6 s without progress
    expect(trace).toHaveBeenCalledTimes(1);
    expect(trace).toHaveBeenCalledWith('inboundAudio.stalled', {
      noPacketsForMs: 6000,
      remoteAudioSenders: 1,
    });

    await poll(); // still flat at 10 s: no repeated trace
    expect(trace).toHaveBeenCalledTimes(1);

    packets = 200;
    await poll(); // 12 s
    expect(trace).toHaveBeenCalledTimes(2);
    expect(trace).toHaveBeenLastCalledWith('inboundAudio.stallEnded', {
      stalledForMs: 10000,
      reason: 'packets_resumed',
    });
  });

  it('ends a stall when nobody publishes audio anymore', async () => {
    start();
    packets = 100;
    await poll(4);
    expect(trace).toHaveBeenCalledTimes(1);

    state.setParticipants([remote([])]);
    await poll(); // 10 s
    expect(trace).toHaveBeenLastCalledWith('inboundAudio.stallEnded', {
      stalledForMs: 8000,
      reason: 'no_remote_audio_expected',
    });
  });

  it('never traces when no remote participant publishes audio', async () => {
    state.setParticipants([remote([])]);
    start();
    packets = 100;
    await poll(6);
    expect(trace).not.toHaveBeenCalled();
    expect(getStats).not.toHaveBeenCalled();
  });

  it('checks participants that publish only screen-share audio', async () => {
    state.setParticipants([remote([TrackType.SCREEN_SHARE_AUDIO])]);
    start();
    packets = 100;
    await poll(4);
    expect(getStats).toHaveBeenCalled();
    expect(trace).toHaveBeenCalledWith('inboundAudio.stalled', {
      noPacketsForMs: 6000,
      remoteAudioSenders: 1,
    });
  });

  it('is inert unless the call is joined', async () => {
    state.setCallingState(CallingState.RECONNECTING);
    start();
    packets = 100;
    await poll(6);
    expect(trace).not.toHaveBeenCalled();
    expect(getStats).not.toHaveBeenCalled();
  });

  it('stops polling once stopped', async () => {
    start();
    packets = 100;
    await poll();
    stop?.();
    const calls = getStats.mock.calls.length;
    await poll(3);
    expect(getStats).toHaveBeenCalledTimes(calls);
  });
});

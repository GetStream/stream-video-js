import { afterEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { fromPartial } from '@total-typescript/shoehorn';
import {
  DEFAULT_LOOPBACK_RECORDING_DURATION_MS,
  LoopbackStreamsTimeoutError,
  MAX_LOOPBACK_RECORDING_DURATION_MS,
  MIN_LOOPBACK_RECORDING_DURATION_MS,
  clampLoopbackRecordingDuration,
  getLoopbackStreams,
  getLoopbackTracks,
  waitForLoopbackStreams,
  withLoopbackAudioEnabled,
} from '../loopback';
import type { Call } from '../../Call';
import type { StreamVideoParticipant } from '../../types';

const track = (kind: 'audio' | 'video', id = `${kind}-track`) =>
  fromPartial<MediaStreamTrack>({ id, kind, enabled: false });

const streamOf = (...tracks: MediaStreamTrack[]) =>
  fromPartial<MediaStream>({
    getAudioTracks: () => tracks.filter((t) => t.kind === 'audio'),
    getVideoTracks: () => tracks.filter((t) => t.kind === 'video'),
  });

/** Streams the fake subscriber reports as SFU echoes. */
const echoedStreams = new WeakSet<MediaStream>();

/** A stream as it would arrive over the subscriber connection. */
const echoOf = (...tracks: MediaStreamTrack[]) => {
  const stream = streamOf(...tracks);
  echoedStreams.add(stream);
  return stream;
};

const participantWith = (streams: {
  audioStream?: MediaStream;
  videoStream?: MediaStream;
}) => fromPartial<StreamVideoParticipant>(streams);

const buildCall = (initial?: { participant?: StreamVideoParticipant }) => {
  const participant$ = new BehaviorSubject<StreamVideoParticipant | undefined>(
    initial?.participant,
  );

  const call = fromPartial<Call>({
    state: {
      get localParticipant() {
        return participant$.getValue();
      },
      localParticipant$: participant$.asObservable(),
    },
    subscriber: {
      isSelfSubscribedStream: (stream: MediaStream | undefined) =>
        !!stream && echoedStreams.has(stream),
    },
  });

  return { call, participant$ };
};

describe('getLoopbackStreams', () => {
  const { call } = buildCall();

  it('reads the streams the subscriber echoed back', () => {
    const loopbackVideo = echoOf(track('video', 'loopback-video'));
    const loopbackAudio = echoOf(track('audio', 'loopback-audio'));

    const result = getLoopbackStreams(
      call,
      participantWith({
        videoStream: loopbackVideo,
        audioStream: loopbackAudio,
      }),
    );

    expect(result.loopbackVideoStream).toBe(loopbackVideo);
    expect(result.loopbackAudioStream).toBe(loopbackAudio);
  });

  it('ignores the capture streams the publishing path writes', () => {
    const result = getLoopbackStreams(
      call,
      participantWith({
        videoStream: streamOf(track('video')),
        audioStream: streamOf(track('audio')),
      }),
    );

    expect(result.loopbackVideoStream).toBeUndefined();
    expect(result.loopbackAudioStream).toBeUndefined();
  });

  it('handles a missing participant', () => {
    const result = getLoopbackStreams(call, undefined);
    expect(result.loopbackVideoStream).toBeUndefined();
    expect(result.loopbackAudioStream).toBeUndefined();
  });

  it('handles a call without a subscriber connection', () => {
    const result = getLoopbackStreams(
      fromPartial<Call>({}),
      participantWith({ audioStream: echoOf(track('audio')) }),
    );
    expect(result.loopbackAudioStream).toBeUndefined();
  });
});

describe('getLoopbackTracks', () => {
  const { call } = buildCall();
  const videoStream = echoOf(track('video', 'loopback-video'));
  const audioStream = echoOf(track('audio', 'loopback-audio'));

  it('resolves both tracks when present', () => {
    const result = getLoopbackTracks(
      call,
      participantWith({ videoStream, audioStream }),
      true,
    );

    expect(result?.audioTrack?.id).toBe('loopback-audio');
    expect(result?.videoTrack?.id).toBe('loopback-video');
  });

  it('returns undefined while audio is missing', () => {
    const result = getLoopbackTracks(
      call,
      participantWith({ videoStream }),
      true,
    );
    expect(result).toBeUndefined();
  });

  it('returns undefined while video is missing and video is required', () => {
    const result = getLoopbackTracks(
      call,
      participantWith({ audioStream }),
      true,
    );
    expect(result).toBeUndefined();
  });

  it('returns undefined while only the capture streams are assigned', () => {
    const result = getLoopbackTracks(
      call,
      participantWith({
        audioStream: streamOf(track('audio')),
        videoStream: streamOf(track('video')),
      }),
      true,
    );
    expect(result).toBeUndefined();
  });

  it('resolves on audio alone when includeVideo is false', () => {
    const result = getLoopbackTracks(
      call,
      participantWith({ audioStream }),
      false,
    );

    expect(result?.audioTrack?.id).toBe('loopback-audio');
    expect(result?.videoTrack).toBeUndefined();
  });
});

describe('waitForLoopbackStreams', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const loopbackAudio = echoOf(track('audio', 'loopback-audio'));
  const loopbackVideo = echoOf(track('video', 'loopback-video'));

  it('resolves from the synchronous snapshot without waiting', async () => {
    const { call } = buildCall({
      participant: participantWith({
        audioStream: loopbackAudio,
        videoStream: loopbackVideo,
      }),
    });

    const result = await waitForLoopbackStreams(call, {
      includeVideo: true,
      signal: new AbortController().signal,
    });

    expect(result?.audioTrack?.id).toBe('loopback-audio');
  });

  it('resolves once the echoed streams replace the capture ones', async () => {
    const { call, participant$ } = buildCall({
      participant: participantWith({
        audioStream: streamOf(track('audio')),
        videoStream: streamOf(track('video')),
      }),
    });

    const pending = waitForLoopbackStreams(call, {
      includeVideo: true,
      signal: new AbortController().signal,
    });

    participant$.next(
      participantWith({
        audioStream: loopbackAudio,
        videoStream: loopbackVideo,
      }),
    );

    await expect(pending).resolves.toMatchObject({
      audioTrack: { id: 'loopback-audio' },
      videoTrack: { id: 'loopback-video' },
    });
  });

  it('resolves null when the signal aborts', async () => {
    const { call } = buildCall();
    const controller = new AbortController();

    const pending = waitForLoopbackStreams(call, {
      includeVideo: true,
      signal: controller.signal,
    });
    controller.abort();

    await expect(pending).resolves.toBeNull();
  });

  it('resolves null when the signal is already aborted', async () => {
    const { call } = buildCall();
    const controller = new AbortController();
    controller.abort();

    await expect(
      waitForLoopbackStreams(call, {
        includeVideo: true,
        signal: controller.signal,
      }),
    ).resolves.toBeNull();
  });

  it('rejects with a timeout error once timeoutMs elapses', async () => {
    vi.useFakeTimers();
    const { call } = buildCall();

    const pending = waitForLoopbackStreams(call, {
      includeVideo: true,
      signal: new AbortController().signal,
      timeoutMs: 1000,
    });

    vi.advanceTimersByTime(1000);

    await expect(pending).rejects.toBeInstanceOf(LoopbackStreamsTimeoutError);
  });

  it('stops observing after resolving, and ignores later emissions', async () => {
    vi.useFakeTimers();
    const { call, participant$ } = buildCall({
      participant: participantWith({
        audioStream: streamOf(track('audio')),
        videoStream: streamOf(track('video')),
      }),
    });

    const pending = waitForLoopbackStreams(call, {
      includeVideo: false,
      signal: new AbortController().signal,
      timeoutMs: 1000,
    });

    participant$.next(participantWith({ audioStream: loopbackAudio }));
    await expect(pending).resolves.toMatchObject({
      audioTrack: { id: 'loopback-audio' },
    });

    expect(participant$.observed).toBe(false);
    expect(() => {
      participant$.next(undefined);
      vi.advanceTimersByTime(5000);
    }).not.toThrow();
  });

  it('stops observing after aborting', async () => {
    const { call, participant$ } = buildCall();
    const controller = new AbortController();

    const pending = waitForLoopbackStreams(call, {
      includeVideo: true,
      signal: controller.signal,
    });
    controller.abort();
    await pending;

    expect(participant$.observed).toBe(false);
  });
});

describe('withLoopbackAudioEnabled', () => {
  it('enables the audio track for the duration and restores it', async () => {
    const audioTrack = track('audio');
    let enabledDuringCall = false;

    await withLoopbackAudioEnabled({ audioTrack }, async () => {
      enabledDuringCall = audioTrack.enabled;
    });

    expect(enabledDuringCall).toBe(true);
    expect(audioTrack.enabled).toBe(false);
  });

  it('restores the previous value when the callback throws', async () => {
    const audioTrack = track('audio');

    await expect(
      withLoopbackAudioEnabled({ audioTrack }, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(audioTrack.enabled).toBe(false);
  });

  it('restores a previously-enabled track to enabled', async () => {
    const audioTrack = fromPartial<MediaStreamTrack>({
      id: 'audio-track',
      kind: 'audio',
      enabled: true,
    });

    await withLoopbackAudioEnabled({ audioTrack }, async () => {});

    expect(audioTrack.enabled).toBe(true);
  });

  it('is a no-op without an audio track, and still returns the value', async () => {
    await expect(
      withLoopbackAudioEnabled({}, async () => 'result'),
    ).resolves.toBe('result');
  });
});

describe('clampLoopbackRecordingDuration', () => {
  it('raises durations below the minimum', () => {
    expect(clampLoopbackRecordingDuration(0)).toBe(
      MIN_LOOPBACK_RECORDING_DURATION_MS,
    );
  });

  it('lowers durations above the maximum', () => {
    expect(clampLoopbackRecordingDuration(10 * 60 * 1000)).toBe(
      MAX_LOOPBACK_RECORDING_DURATION_MS,
    );
  });

  it('keeps in-range durations', () => {
    expect(
      clampLoopbackRecordingDuration(DEFAULT_LOOPBACK_RECORDING_DURATION_MS),
    ).toBe(DEFAULT_LOOPBACK_RECORDING_DURATION_MS);
  });

  it('rounds fractional durations', () => {
    expect(clampLoopbackRecordingDuration(10_000.6)).toBe(10_001);
  });
});

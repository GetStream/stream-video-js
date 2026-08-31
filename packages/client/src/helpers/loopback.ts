import type { Call } from '../Call';
import type { StreamVideoParticipant } from '../types';

/** Default loopback stream wait timeout. */
export const LOOPBACK_STREAMS_WAIT_TIMEOUT_MS = 10 * 1000;

/** Default loopback recording duration. */
export const DEFAULT_LOOPBACK_RECORDING_DURATION_MS = 10 * 1000;

/** Shortest permitted loopback recording duration. */
export const MIN_LOOPBACK_RECORDING_DURATION_MS = 5 * 1000;

/** Longest permitted loopback recording duration. */
export const MAX_LOOPBACK_RECORDING_DURATION_MS = 2 * 60 * 1000;

/** SFU-echoed streams on the local participant. */
export type LoopbackStreams = {
  loopbackVideoStream?: MediaStream;
  loopbackAudioStream?: MediaStream;
};

/** SFU-echoed tracks on the local participant. */
export type LoopbackTracks = {
  audioTrack?: MediaStreamTrack;
  videoTrack?: MediaStreamTrack;
};

/** Thrown when loopback tracks do not arrive in time. */
export class LoopbackStreamsTimeoutError extends Error {
  constructor() {
    super(
      'Timed out waiting for loopback streams. Ensure the call was joined ' +
        'with `allowOwnTracksLoopback: true` and that the SFU is configured ' +
        'to echo self-sub tracks.',
    );
    this.name = 'LoopbackStreamsTimeoutError';
  }
}

/**
 * Returns the streams on the given participant that the SFU echoed back to us,
 * ignoring the local capture streams the publishing path writes to the same
 * fields.
 */
export const getLoopbackStreams = (
  call: Call | undefined,
  participant: StreamVideoParticipant | undefined,
): LoopbackStreams => {
  const { subscriber } = call ?? {};
  const { audioStream, videoStream } = participant ?? {};
  return {
    loopbackVideoStream: subscriber?.isSelfSubscribedStream(videoStream)
      ? videoStream
      : undefined,
    loopbackAudioStream: subscriber?.isSelfSubscribedStream(audioStream)
      ? audioStream
      : undefined,
  };
};

/**
 * Returns loopback tracks when all required tracks are present.
 *
 * Prefer {@link waitForLoopbackStreams}, which observes call state until the
 * tracks arrive. This is the synchronous snapshot it is built from.
 *
 * @internal
 */
export const getLoopbackTracks = (
  call: Call | undefined,
  participant: StreamVideoParticipant | undefined,
  includeVideo: boolean,
): LoopbackTracks | undefined => {
  if (!participant) return undefined;

  const { loopbackAudioStream, loopbackVideoStream } = getLoopbackStreams(
    call,
    participant,
  );

  const audioTrack = loopbackAudioStream?.getAudioTracks()[0];
  const videoTrack = includeVideo
    ? loopbackVideoStream?.getVideoTracks()[0]
    : undefined;

  if (!audioTrack || (includeVideo && !videoTrack)) {
    return undefined;
  }

  return { audioTrack, videoTrack };
};

export type WaitForLoopbackStreamsOptions = {
  /** Whether video is required. Audio is always required. */
  includeVideo: boolean;
  /** Aborts the wait. */
  signal: AbortSignal;
  /** Defaults to {@link LOOPBACK_STREAMS_WAIT_TIMEOUT_MS}. */
  timeoutMs?: number;
};

/** Waits for the requested loopback tracks. */
export const waitForLoopbackStreams = (
  call: Call,
  opts: WaitForLoopbackStreamsOptions,
): Promise<LoopbackTracks | null> => {
  const callState = call.state;
  const {
    includeVideo,
    signal,
    timeoutMs = LOOPBACK_STREAMS_WAIT_TIMEOUT_MS,
  } = opts;

  return new Promise((resolve, reject) => {
    const initial = getLoopbackTracks(
      call,
      callState.localParticipant,
      includeVideo,
    );
    if (initial) {
      resolve(initial);
      return;
    }

    if (signal.aborted) {
      resolve(null);
      return;
    }

    let settled = false;
    const subscriptions: Array<{ unsubscribe(): void }> = [];

    const cleanup = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      signal.removeEventListener('abort', onAbort);
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    };

    const onAbort = () => {
      cleanup();
      resolve(null);
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new LoopbackStreamsTimeoutError());
    }, timeoutMs);

    signal.addEventListener('abort', onAbort);

    subscriptions.push(
      callState.localParticipant$.subscribe((participant) => {
        const ready = getLoopbackTracks(call, participant, includeVideo);
        if (ready) {
          cleanup();
          resolve(ready);
        }
      }),
    );
  });
};

/** Enables loopback audio while `fn` runs, then restores it. */
export const withLoopbackAudioEnabled = async <T>(
  tracks: LoopbackTracks,
  fn: () => Promise<T>,
): Promise<T> => {
  const restore = enableLoopbackAudio(tracks);
  try {
    return await fn();
  } finally {
    restore();
  }
};

/** Enables loopback audio and returns a restore function. */
export const enableLoopbackAudio = (tracks: LoopbackTracks): (() => void) => {
  const { audioTrack } = tracks;
  const previous = audioTrack?.enabled ?? false;
  if (audioTrack) {
    audioTrack.enabled = true;
  }
  return () => {
    if (audioTrack) {
      audioTrack.enabled = previous;
    }
  };
};

/** Clamps and rounds a loopback recording duration. */
export const clampLoopbackRecordingDuration = (durationMs: number): number =>
  Math.round(
    Math.min(
      MAX_LOOPBACK_RECORDING_DURATION_MS,
      Math.max(MIN_LOOPBACK_RECORDING_DURATION_MS, durationMs),
    ),
  );

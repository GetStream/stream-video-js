import type { HlsJsConstructor, HlsPlaybackState } from './types';
import type { HLSPlaybackStats } from '../gen/shims';

type HlsJsInstance = InstanceType<HlsJsConstructor>;

const HLS_MIME_TYPE = 'application/vnd.apple.mpegurl';

/** The `<video>` events, and the player state each one means. */
const VIDEO_STATES: Record<string, HlsPlaybackState> = {
  playing: 'playing',
  waiting: 'buffering',
  seeking: 'seeking',
  pause: 'paused',
  ended: 'ended',
};

const VIDEO_EVENTS = [...Object.keys(VIDEO_STATES), 'seeked'];

/** `HTMLMediaElement.HAVE_FUTURE_DATA`: enough data to play on. */
const HAVE_FUTURE_DATA = 3;

/** Request Timeout and Too Many Requests: 4xx responses worth retrying. */
const TRANSIENT_CLIENT_ERRORS = new Set([408, 429]);

const isPermanentHttpError = (status: number | undefined = 0) =>
  status >= 400 && status < 500 && !TRANSIENT_CLIENT_ERRORS.has(status);

/**
 * Retries a failed load until it succeeds (after 1, 2, 4, 5, 5… s), so
 * playback resumes when the network returns. A 4xx other than 408 and 429
 * isn't retried: an expired URL or a gone stream doesn't recover. An error
 * without an HTTP status (a timeout, a broken segment) keeps hls.js's own
 * decision, so a broken segment isn't loaded forever.
 */
const RETRY_UNTIL_LOADED = {
  maxNumRetry: Infinity,
  retryDelayMs: 1000,
  maxRetryDelayMs: 5000,
  backoff: 'exponential',
  shouldRetry: (
    _retryConfig: unknown,
    _retryCount: number,
    _isTimeout: boolean,
    response: { code?: number } | undefined,
    retry: boolean,
  ) =>
    response?.code === undefined ? retry : !isPermanentHttpError(response.code),
};

const loadPolicy = (maxLoadTimeMs: number) => ({
  default: {
    maxTimeToFirstByteMs: 10_000,
    maxLoadTimeMs,
    timeoutRetry: RETRY_UNTIL_LOADED,
    errorRetry: RETRY_UNTIL_LOADED,
  },
});

const HLS_CONFIG = {
  manifestLoadPolicy: loadPolicy(20_000),
  playlistLoadPolicy: loadPolicy(20_000),
  fragLoadPolicy: loadPolicy(120_000),
  liveSyncDurationCount: 3,
  liveMaxLatencyDurationCount: 7,
  // Media already played, kept for small seeks back. hls.js keeps all of it
  // by default, which grows without limit over a long live stream.
  backBufferLength: 10,
};

/**
 * A playback failure. `code` goes to the stats reports (`error_code`): the
 * hls.js error details (with the HTTP status of a playlist 4xx), the
 * `play()` error name, or the native `MediaError` code.
 */
export class HlsPlaybackError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(`HLS playback failed: ${code}`);
    this.name = 'HlsPlaybackError';
    this.code = code;
  }
}

/** What the player reads from the stream and the `<video>` for a report. */
export type HlsPlayerSample = Pick<
  HLSPlaybackStats,
  | 'bitrate_kbps'
  | 'width'
  | 'height'
  | 'dropped_frames'
  | 'buffer_length_ms'
  | 'live_latency_ms'
>;

/** The media buffered ahead of the playhead, in milliseconds. */
const getBufferLengthMs = ({ buffered, currentTime }: HTMLVideoElement) => {
  for (let i = 0; i < buffered.length; i++) {
    if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
      return Math.round((buffered.end(i) - currentTime) * 1000);
    }
  }
  return 0;
};

/** How far the playhead is behind the live edge, in milliseconds. */
const getLiveLatencyMs = ({ seekable, currentTime }: HTMLVideoElement) => {
  if (!seekable.length) return 0;
  const liveEdge = seekable.end(seekable.length - 1);
  return Math.max(0, Math.round((liveEdge - currentTime) * 1000));
};

/**
 * Where a live stream starts: hls.js's live sync position, or with native
 * playback the live edge. Undefined when the stream isn't live.
 */
const getLiveStartPosition = (
  video: HTMLVideoElement,
  hls: HlsJsInstance | undefined,
) => {
  if (hls) return hls.liveSyncPosition ?? undefined;
  const { seekable } = video;
  if (video.duration !== Infinity || !seekable.length) return undefined;
  return seekable.end(seekable.length - 1);
};

export type HLSPlayerOptions = {
  /** Called when the player's state changes; it starts in `loading`. */
  onStateChange?: (state: HlsPlaybackState) => void;
  /** Called when playback can't start or can't recover. */
  onError?: (error: HlsPlaybackError) => void;
  /** Called when the browser blocks autoplay; the stream itself is fine. */
  onAutoplayBlocked?: () => void;
};

/**
 * Plays an HLS playlist in a `<video>`: with hls.js where the browser
 * supports it, otherwise with the browser's native HLS playback (Safari
 * without Media Source Extensions). One player per `<video>`.
 *
 * Internal: apps play HLS through `call.registerHlsPlayer()`.
 */
export class HLSPlayer {
  private readonly Hls: HlsJsConstructor;
  private readonly video: HTMLVideoElement;
  private readonly playlistUrl: string;
  private readonly onStateChange: (state: HlsPlaybackState) => void;
  private readonly onError: (error: HlsPlaybackError) => void;
  private readonly onAutoplayBlocked: () => void;

  private hls: HlsJsInstance | undefined;
  private state: HlsPlaybackState = 'loading';
  private hasPlayed = false;
  private hasRecoveredMedia = false;
  private hasStarted = false;
  private isDestroyed = false;
  private hasFailed = false;

  constructor(
    Hls: HlsJsConstructor,
    video: HTMLVideoElement,
    playlistUrl: string,
    options: HLSPlayerOptions = {},
  ) {
    this.Hls = Hls;
    this.video = video;
    this.playlistUrl = playlistUrl;
    this.onStateChange = options.onStateChange ?? (() => {});
    this.onError = options.onError ?? (() => {});
    this.onAutoplayBlocked = options.onAutoplayBlocked ?? (() => {});
  }

  start = () => {
    if (this.isDestroyed || this.hasStarted) return;
    this.hasStarted = true;
    const { Hls, video } = this;
    for (const event of VIDEO_EVENTS) {
      video.addEventListener(event, this.onVideoEvent);
    }

    if (Hls.isSupported()) {
      const hls = new Hls(HLS_CONFIG);
      this.hls = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, this.play);
      const playlistLoadErrors = new Set<string>([
        Hls.ErrorDetails.MANIFEST_LOAD_ERROR,
        Hls.ErrorDetails.LEVEL_LOAD_ERROR,
        Hls.ErrorDetails.AUDIO_TRACK_LOAD_ERROR,
      ]);

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (this.isStopped) return;
        if (
          data.type === Hls.ErrorTypes.NETWORK_ERROR &&
          playlistLoadErrors.has(data.details) &&
          isPermanentHttpError(data.response?.code)
        ) {
          hls.stopLoad();
          this.fail(`${data.details} ${data.response.code}`);
          return;
        }
        if (!data.fatal) return;

        if (
          data.type === Hls.ErrorTypes.MEDIA_ERROR &&
          !this.hasRecoveredMedia
        ) {
          this.hasRecoveredMedia = true;
          hls.recoverMediaError();
          return;
        }
        this.fail(data.details);
      });
      hls.loadSource(this.playlistUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType(HLS_MIME_TYPE)) {
      video.addEventListener('error', this.onNativeError);
      video.src = this.playlistUrl;
      this.play();
    } else {
      this.fail('hlsNotSupported');
    }
  };

  /** The hls.js instance, or undefined when the browser plays natively. */
  getHls = (): HlsJsInstance | undefined => this.hls;

  /** What the player reads from the stream and the `<video>` right now. */
  sample = (): HlsPlayerSample => {
    const { video, hls } = this;
    const level = hls?.levels[hls.currentLevel];

    return {
      // the rendition's declared `BANDWIDTH`; unknown with native playback
      bitrate_kbps: level ? Math.round(level.bitrate / 1000) : undefined,
      width: video.videoWidth,
      height: video.videoHeight,
      dropped_frames: video.getVideoPlaybackQuality?.().droppedVideoFrames,
      buffer_length_ms: getBufferLengthMs(video),
      live_latency_ms: getLiveLatencyMs(video),
    };
  };

  destroy = () => {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    for (const event of VIDEO_EVENTS) {
      this.video.removeEventListener(event, this.onVideoEvent);
    }
    this.video.removeEventListener('error', this.onNativeError);
    this.video.removeEventListener('play', this.startAtLiveEdge);
    this.hls?.destroy();
    this.hls = undefined;
    this.video.removeAttribute('src');
    this.video.load();
  };

  /** Destroyed, or failed: callbacks that arrive late are ignored. */
  private get isStopped() {
    return this.isDestroyed || this.hasFailed;
  }

  private play = () => {
    if (this.isStopped) return;
    this.video.play().catch((err: unknown) => {
      if (this.isStopped) return;
      const name = (err as Error | undefined)?.name;
      if (name === 'AbortError' || name === 'NotSupportedError') return;
      if (name === 'NotAllowedError') {
        // when the viewer starts it later, start from the live edge
        this.video.addEventListener('play', this.startAtLiveEdge, {
          once: true,
        });
        // loaded, and waiting for the viewer: not loading any more
        this.setState('paused');
        this.onAutoplayBlocked();
        return;
      }
      this.fail(name || 'playFailed');
    });
  };

  private onVideoEvent = (event: Event) => {
    if (this.isStopped) return;
    const { paused, readyState } = this.video;
    // Safari fires `playing` on a paused video when it blocks autoplay
    if (event.type === 'playing' && paused) return;
    if (event.type === 'seeked') {
      // Safari fires no `playing` after a seek that lands on buffered media
      if (!paused && readyState >= HAVE_FUTURE_DATA) this.setState('playing');
      return;
    }
    let state = VIDEO_STATES[event.type];
    // before the first frame, waiting or seeking is still loading
    if (!this.hasPlayed && (state === 'buffering' || state === 'seeking')) {
      // unless the stream waits for the viewer to start it (blocked autoplay)
      if (this.state === 'paused' && paused) return;
      state = 'loading';
    }
    this.setState(state);
  };

  private setState = (state: HlsPlaybackState) => {
    if (state === this.state) return;
    this.state = state;
    if (state === 'playing') this.hasPlayed = true;
    this.onStateChange(state);
  };

  private startAtLiveEdge = () => {
    if (this.isStopped) return;
    const position = getLiveStartPosition(this.video, this.hls);
    if (position !== undefined && position > this.video.currentTime) {
      this.video.currentTime = position;
    }
  };

  private onNativeError = () => {
    this.fail(`mediaError ${this.video.error?.code ?? 0}`);
  };

  private fail = (code: string) => {
    if (this.isStopped) return;
    this.hasFailed = true;
    this.onError(new HlsPlaybackError(code));
  };
}

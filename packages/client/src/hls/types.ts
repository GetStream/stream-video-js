/**
 * The parts of an hls.js `Hls` instance the HLS player uses.
 */
interface HlsJsInstance {
  loadSource(url: string): void;
  attachMedia(media: HTMLMediaElement): void;
  on(event: any, listener: (event: any, data: any) => void): void;
  recoverMediaError(): void;
  stopLoad(): void;
  destroy(): void;
  /** The renditions in the playlist; `bitrate` is its `BANDWIDTH`, in bps. */
  readonly levels: ReadonlyArray<{ readonly bitrate: number }>;
  /** The index of the rendition playing, `-1` before one plays. */
  readonly currentLevel: number;
  /**
   * Where live playback should be: the target distance from the live edge,
   * in seconds of media time. `null` before the playlist loads, or when the
   * stream isn't live.
   */
  readonly liveSyncPosition: number | null;
}

/**
 * The hls.js `Hls` class, as `import Hls from 'hls.js'` gives it. The client
 * never imports hls.js itself, so it works in React Native too.
 *
 * @beta
 */
export interface HlsJsConstructor {
  new (config?: any): HlsJsInstance;
  isSupported(): boolean;
  Events: { MANIFEST_PARSED: string; ERROR: string };
  ErrorTypes: { NETWORK_ERROR: string; MEDIA_ERROR: string };
  ErrorDetails: {
    MANIFEST_LOAD_ERROR: string;
    LEVEL_LOAD_ERROR: string;
    AUDIO_TRACK_LOAD_ERROR: string;
  };
}

/**
 * What the HLS player is doing:
 *
 * - `loading`: loading the stream, before the first frame plays.
 * - `playing`: the stream is playing.
 * - `buffering`: waiting for data after it played.
 * - `seeking`: loading after a seek.
 * - `paused`: paused, or waiting for the viewer to start it while autoplay
 *   is blocked.
 * - `ended`: the stream ended.
 *
 * @beta
 */
export type HlsPlaybackState =
  'loading' | 'playing' | 'buffering' | 'seeking' | 'paused' | 'ended';

/**
 * A registered HLS player, returned by `call.registerHlsPlayer()`.
 *
 * @beta
 */
export type HlsPlayback<H extends HlsJsConstructor = HlsJsConstructor> = {
  /**
   * The hls.js instance that plays the stream now: a restarted broadcast
   * gets a new one. Undefined when the browser plays HLS natively (Safari
   * without Media Source Extensions). Listen to it and read from it; stop
   * playback with `unregister()`, never with `hls.destroy()`.
   */
  hls: InstanceType<H> | undefined;
  /** Stops playback and ends the stats session. */
  unregister: () => void;
};

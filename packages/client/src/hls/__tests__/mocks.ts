import { vi } from 'vitest';

export const PLAYLIST_URL = 'https://cdn.example.com/playlist.m3u8';

type Listener = (event: string, data: any) => void;

/** Stands in for hls.js and records what the player does with it. */
export const createFakeHls = (supported = true) => {
  const instances: FakeHls[] = [];
  class FakeHls {
    static isSupported = () => supported;
    static Events = { MANIFEST_PARSED: 'manifestParsed', ERROR: 'hlsError' };
    static ErrorTypes = {
      NETWORK_ERROR: 'networkError',
      MEDIA_ERROR: 'mediaError',
    };
    static ErrorDetails = {
      MANIFEST_LOAD_ERROR: 'manifestLoadError',
      LEVEL_LOAD_ERROR: 'levelLoadError',
      AUDIO_TRACK_LOAD_ERROR: 'audioTrackLoadError',
    };

    listeners = new Map<string, Listener[]>();
    loadSource = vi.fn();
    attachMedia = vi.fn();
    recoverMediaError = vi.fn();
    stopLoad = vi.fn();
    destroy = vi.fn();
    levels = [{ bitrate: 3_000 }, { bitrate: 3_300_000 }];
    currentLevel = -1;
    liveSyncPosition: number | null = null;
    config: any;

    constructor(config?: any) {
      this.config = config;
      instances.push(this);
    }

    on = (event: string, listener: Listener) => {
      this.listeners.set(event, [
        ...(this.listeners.get(event) ?? []),
        listener,
      ]);
    };

    emit = (event: string, data?: unknown) => {
      this.listeners.get(event)?.forEach((listener) => listener(event, data));
    };
  }
  return { Hls: FakeHls, instances };
};

export const createVideo = () => {
  const video = document.createElement('video');
  video.play = vi.fn().mockResolvedValue(undefined);
  video.load = vi.fn();
  return video;
};

/** A `play()` rejection as browsers give it when they block autoplay. */
export const autoplayBlocked = () =>
  Object.assign(new Error('blocked'), { name: 'NotAllowedError' });

/** The `paused` a real `<video>` has when it fires each event. */
const PAUSED_AFTER: Record<string, boolean> = {
  play: false,
  playing: false,
  waiting: false,
  pause: true,
  ended: true,
};

/**
 * Fires a media event on a test `<video>`, with `paused` set as a browser
 * would. happy-dom leaves a video paused.
 */
export const dispatchVideoEvent = (video: HTMLVideoElement, type: string) => {
  if (type in PAUSED_AFTER) {
    Object.defineProperty(video, 'paused', {
      configurable: true,
      value: PAUSED_AFTER[type],
    });
  }
  video.dispatchEvent(new Event(type));
};

/** Time ranges from `[start, end]` pairs, in seconds. */
export const timeRanges = (...ranges: [number, number][]): TimeRanges => ({
  length: ranges.length,
  start: (i: number) => ranges[i][0],
  end: (i: number) => ranges[i][1],
});

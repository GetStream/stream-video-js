/**
 * @vitest-environment happy-dom
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { HLSPlayer } from '../HLSPlayer';
import {
  autoplayBlocked,
  createFakeHls,
  createVideo,
  dispatchVideoEvent,
  PLAYLIST_URL,
  timeRanges,
} from './mocks';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const setVideo = (video: HTMLVideoElement, values: Record<string, unknown>) => {
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(video, key, { configurable: true, value });
  }
};

describe('HLSPlayer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('plays the playlist with hls.js', () => {
    const { Hls, instances } = createFakeHls();
    const video = createVideo();

    const player = new HLSPlayer(Hls, video, PLAYLIST_URL);
    player.start();
    player.start();

    expect(instances).toHaveLength(1);
    expect(player.getHls()).toBe(instances[0]);
    expect(instances[0].loadSource).toHaveBeenCalledWith(PLAYLIST_URL);
    expect(instances[0].attachMedia).toHaveBeenCalledWith(video);

    instances[0].emit(Hls.Events.MANIFEST_PARSED);
    expect(video.play).toHaveBeenCalled();
  });

  it('falls back to native playback when hls.js is not supported', () => {
    const { Hls, instances } = createFakeHls(false);
    const video = createVideo();
    vi.spyOn(video, 'canPlayType').mockReturnValue('maybe');

    const player = new HLSPlayer(Hls, video, PLAYLIST_URL);
    player.start();
    player.start();

    expect(instances).toHaveLength(0);
    expect(player.getHls()).toBeUndefined();
    expect(video.src).toBe(PLAYLIST_URL);
    expect(video.play).toHaveBeenCalledTimes(1);
  });

  it('retries loads until they succeed, but not a 4xx', () => {
    const { Hls, instances } = createFakeHls();
    new HLSPlayer(Hls, createVideo(), PLAYLIST_URL).start();
    const { config } = instances[0];

    for (const policy of [
      config.manifestLoadPolicy,
      config.playlistLoadPolicy,
      config.fragLoadPolicy,
    ]) {
      const { errorRetry, timeoutRetry } = policy.default;
      expect(errorRetry.maxNumRetry).toBe(Infinity);
      expect(timeoutRetry.maxNumRetry).toBe(Infinity);

      const shouldRetry = (
        response: { code: number } | undefined,
        retry = false,
      ) => errorRetry.shouldRetry(errorRetry, 0, false, response, retry);
      expect(shouldRetry({ code: 0 })).toBe(true);
      expect(shouldRetry({ code: 503 })).toBe(true);
      expect(shouldRetry({ code: 408 })).toBe(true);
      expect(shouldRetry({ code: 429 })).toBe(true);
      expect(shouldRetry({ code: 403 })).toBe(false);
      expect(shouldRetry({ code: 404 })).toBe(false);
      // no HTTP status: hls.js decides
      expect(shouldRetry(undefined, true)).toBe(true);
      expect(shouldRetry(undefined, false)).toBe(false);
    }
    expect(config.liveMaxLatencyDurationCount).toBe(7);
    expect(config.backBufferLength).toBe(10);
  });

  it('fails once when a playlist answers with a 4xx', () => {
    const { Hls, instances } = createFakeHls();
    const onError = vi.fn();
    new HLSPlayer(Hls, createVideo(), PLAYLIST_URL, { onError }).start();
    const hls = instances[0];
    const playlistError = (code: number) => ({
      type: Hls.ErrorTypes.NETWORK_ERROR,
      details: 'levelLoadError',
      fatal: false,
      response: { code },
    });

    hls.emit(Hls.Events.ERROR, playlistError(503));
    expect(onError).not.toHaveBeenCalled();

    hls.emit(Hls.Events.ERROR, playlistError(404));
    hls.emit(Hls.Events.ERROR, playlistError(404));
    expect(hls.stopLoad).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toMatchObject({
      message: 'HLS playback failed: levelLoadError 404',
      code: 'levelLoadError 404',
    });
  });

  it('leaves a segment 4xx to hls.js', () => {
    const { Hls, instances } = createFakeHls();
    const onError = vi.fn();
    new HLSPlayer(Hls, createVideo(), PLAYLIST_URL, { onError }).start();
    const hls = instances[0];
    const segmentError = (fatal: boolean) => ({
      type: Hls.ErrorTypes.NETWORK_ERROR,
      details: 'fragLoadError',
      fatal,
      response: { code: 404 },
    });

    hls.emit(Hls.Events.ERROR, segmentError(false));
    expect(hls.stopLoad).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();

    hls.emit(Hls.Events.ERROR, segmentError(true));
    expect(onError.mock.calls[0][0]).toMatchObject({ code: 'fragLoadError' });
  });

  it('recovers from one media error and fails on the next', () => {
    const { Hls, instances } = createFakeHls();
    const onError = vi.fn();
    new HLSPlayer(Hls, createVideo(), PLAYLIST_URL, { onError }).start();
    const hls = instances[0];
    const mediaError = {
      fatal: true,
      type: Hls.ErrorTypes.MEDIA_ERROR,
      details: 'bufferStalledError',
    };

    hls.emit(Hls.Events.ERROR, mediaError);
    expect(hls.recoverMediaError).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();

    hls.emit(Hls.Events.ERROR, mediaError);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('reports blocked autoplay as paused, not as an error', async () => {
    const { Hls, instances } = createFakeHls();
    const video = createVideo();
    video.play = vi.fn().mockRejectedValue(autoplayBlocked());
    const onError = vi.fn();
    const onAutoplayBlocked = vi.fn();
    const onStateChange = vi.fn();
    new HLSPlayer(Hls, video, PLAYLIST_URL, {
      onError,
      onAutoplayBlocked,
      onStateChange,
    }).start();

    instances[0].emit(Hls.Events.MANIFEST_PARSED);
    await flush();

    expect(onAutoplayBlocked).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenLastCalledWith('paused');
    expect(onError).not.toHaveBeenCalled();

    // hls.js moves to its start position while the stream waits
    video.dispatchEvent(new Event('seeking'));
    expect(onStateChange).toHaveBeenLastCalledWith('paused');

    dispatchVideoEvent(video, 'playing');
    expect(onStateChange).toHaveBeenLastCalledWith('playing');
  });

  it('ignores errors and blocked autoplay once it has failed', async () => {
    const { Hls, instances } = createFakeHls();
    const video = createVideo();
    let rejectPlay!: (err: Error) => void;
    video.play = vi.fn(
      () => new Promise<void>((_, reject) => (rejectPlay = reject)),
    );
    const onError = vi.fn();
    const onAutoplayBlocked = vi.fn();
    new HLSPlayer(Hls, video, PLAYLIST_URL, {
      onError,
      onAutoplayBlocked,
    }).start();
    const hls = instances[0];
    hls.emit(Hls.Events.MANIFEST_PARSED);

    hls.emit(Hls.Events.ERROR, {
      fatal: true,
      type: Hls.ErrorTypes.NETWORK_ERROR,
      details: 'levelParsingError',
    });
    hls.emit(Hls.Events.ERROR, {
      fatal: true,
      type: Hls.ErrorTypes.MEDIA_ERROR,
      details: 'bufferAppendError',
    });
    rejectPlay(autoplayBlocked());
    await flush();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(hls.recoverMediaError).not.toHaveBeenCalled();
    expect(onAutoplayBlocked).not.toHaveBeenCalled();
  });

  it('measures the buffer and the distance to the live edge', () => {
    const { Hls } = createFakeHls();
    const video = createVideo();
    const player = new HLSPlayer(Hls, video, PLAYLIST_URL);
    const sample = (currentTime: number, buffered: TimeRanges) => {
      setVideo(video, {
        currentTime,
        buffered,
        seekable: timeRanges([20, 50]),
      });
      return player.sample();
    };

    expect(sample(40, timeRanges([30, 46]))).toMatchObject({
      buffer_length_ms: 6_000,
      live_latency_ms: 10_000,
    });
    // behind the start of the live window
    expect(sample(10, timeRanges([8, 12]))).toMatchObject({
      buffer_length_ms: 2_000,
      live_latency_ms: 40_000,
    });
  });

  describe('after blocked autoplay', () => {
    /** A video whose `currentTime` can be set, and whose play() is refused. */
    const blockedVideo = () => {
      const video = createVideo();
      video.play = vi.fn().mockRejectedValue(autoplayBlocked());
      let currentTime = 0;
      Object.defineProperty(video, 'currentTime', {
        configurable: true,
        get: () => currentTime,
        set: (time: number) => (currentTime = time),
      });
      return video;
    };

    it('starts at the live edge when the viewer plays', async () => {
      const { Hls, instances } = createFakeHls();
      const video = blockedVideo();
      new HLSPlayer(Hls, video, PLAYLIST_URL).start();
      const hls = instances[0];
      video.currentTime = 4;
      hls.emit(Hls.Events.MANIFEST_PARSED);
      await flush();

      hls.liveSyncPosition = 42;
      dispatchVideoEvent(video, 'play');
      expect(video.currentTime).toBe(42);

      // only on that first play
      video.currentTime = 50;
      hls.liveSyncPosition = 60;
      dispatchVideoEvent(video, 'play');
      expect(video.currentTime).toBe(50);
    });

    it('starts at the end of the seekable range with native playback', async () => {
      const { Hls } = createFakeHls(false);
      const video = blockedVideo();
      vi.spyOn(video, 'canPlayType').mockReturnValue('maybe');
      setVideo(video, { duration: Infinity, seekable: timeRanges([10, 60]) });
      new HLSPlayer(Hls, video, PLAYLIST_URL).start();
      await flush();

      dispatchVideoEvent(video, 'play');
      expect(video.currentTime).toBe(60);
    });
  });

  describe('state', () => {
    /** A started player on a fresh video, and the states it reports. */
    const setup = () => {
      const { Hls, instances } = createFakeHls();
      const video = createVideo();
      const states: string[] = [];
      new HLSPlayer(Hls, video, PLAYLIST_URL, {
        onStateChange: (state) => states.push(state),
      }).start();
      return { Hls, hls: instances[0], video, states };
    };

    it('follows the video', () => {
      const { video, states } = setup();
      for (const event of ['playing', 'waiting', 'playing', 'pause', 'ended']) {
        dispatchVideoEvent(video, event);
      }
      expect(states).toEqual([
        'playing',
        'buffering',
        'playing',
        'paused',
        'ended',
      ]);
    });

    it('stays loading until the first frame', () => {
      const { video, states } = setup();
      dispatchVideoEvent(video, 'waiting');
      dispatchVideoEvent(video, 'seeking');
      dispatchVideoEvent(video, 'playing');
      dispatchVideoEvent(video, 'waiting');
      expect(states).toEqual(['playing', 'buffering']);
    });

    it('ignores `playing` while autoplay is blocked (Safari)', () => {
      const { video, states } = setup();
      // what Safari fires when it refuses play()
      dispatchVideoEvent(video, 'play');
      dispatchVideoEvent(video, 'pause');
      video.dispatchEvent(new Event('playing')); // while still paused
      expect(states).toEqual(['paused']);

      dispatchVideoEvent(video, 'play');
      dispatchVideoEvent(video, 'playing');
      expect(states).toEqual(['paused', 'playing']);
    });

    it('plays on after a seek, with or without `playing` (Safari)', () => {
      const { video, states } = setup();
      dispatchVideoEvent(video, 'playing');
      dispatchVideoEvent(video, 'seeking');
      setVideo(video, { readyState: 1 });
      dispatchVideoEvent(video, 'seeked'); // no data yet: waits for `playing`
      expect(states).toEqual(['playing', 'seeking']);

      dispatchVideoEvent(video, 'playing');
      dispatchVideoEvent(video, 'seeking');
      setVideo(video, { readyState: 4 });
      dispatchVideoEvent(video, 'seeked'); // buffered: no `playing` follows
      expect(states).toEqual([
        'playing',
        'seeking',
        'playing',
        'seeking',
        'playing',
      ]);
    });

    it('reports no state once it has failed', () => {
      const { Hls, hls, video, states } = setup();
      hls.emit(Hls.Events.ERROR, {
        fatal: true,
        type: Hls.ErrorTypes.NETWORK_ERROR,
        details: 'levelParsingError',
      });
      dispatchVideoEvent(video, 'playing');
      expect(states).toEqual([]);
    });
  });
});

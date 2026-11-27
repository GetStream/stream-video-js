/**
 * @vitest-environment happy-dom
 */

import '../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../Call';
import { StreamClient } from '../coordinator/connection/client';
import { ApiClient } from '../coordinator/connection/api-client';
import { VideoApi } from '../gen/coordinator/video/VideoApi';
import { ClientEventReporter } from '../reporting';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { ClientState } from '../store';
import { getCurrentValue } from '../store/rxUtils';
import { HlsPlaybackError } from '../hls';
import type { JoinCallRequest } from '../gen/coordinator';
import type { JoinCallRequestShim } from '../gen/shims';
import {
  autoplayBlocked,
  createFakeHls,
  createVideo,
  dispatchVideoEvent,
  PLAYLIST_URL,
} from '../hls/__tests__/mocks';

const createCall = (streamClient = new StreamClient('abc')) =>
  new Call({
    type: 'livestream',
    id: generateUUIDv4(),
    streamClient,
    videoApi: new VideoApi(new ApiClient(streamClient)),
    clientEventReporter: new ClientEventReporter({
      streamClient,
      enabled: false,
    }),
    clientState: new ClientState(),
  });

describe('Call HLS playback', () => {
  let call: Call;

  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      headers: { get: () => 'AMS1-P2' },
    } as unknown as Response);
    // the speaker watches for device changes; happy-dom has no mediaDevices
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });
    call = createCall();
    call.state.setPlaybackType({ type: 'hls', playlistUrl: PLAYLIST_URL });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('join', () => {
    /** The join request's HLS fields, for an app with this opt-in. */
    const declared = async (enableHlsPlayback: boolean) => {
      const streamClient = new StreamClient('abc', { enableHlsPlayback });
      const joining = createCall(streamClient);
      const join = vi
        .spyOn(joining.api, 'join')
        .mockRejectedValue(new Error('not sent'));
      await joining.doJoinRequest().catch(() => {});
      const request: (JoinCallRequest & JoinCallRequestShim) | undefined =
        join.mock.calls[0][0];
      return {
        capabilities: request?.playback_capabilities,
        hasSessionId: typeof request?.unified_session_id === 'string',
      };
    };

    it('declares HLS only when the app opted in', async () => {
      expect(await declared(true)).toEqual({
        capabilities: ['hls'],
        hasSessionId: true,
      });
      expect(await declared(false)).toEqual({
        capabilities: undefined,
        hasSessionId: false,
      });
    });

    it('plays a granted https playlist until the viewer leaves', async () => {
      const grant = (playlistUrl: string) =>
        (call as any).hlsPlayback.join(
          { call: {}, playback: { playlist_url: playlistUrl } },
          {},
          'unified',
        );
      call.state.setPlaybackType({ type: 'webrtc' });

      expect(() => grant('http://example.com/live.m3u8')).toThrow(
        'Received an HLS playback grant without an https URL',
      );
      expect(call.state.playbackType).toEqual({ type: 'webrtc' });

      grant(PLAYLIST_URL);
      expect(call.state.playbackType).toEqual({
        type: 'hls',
        playlistUrl: PLAYLIST_URL,
      });

      await call.leave();
      expect(call.state.playbackType).toEqual({ type: 'webrtc' });
    });
  });

  describe('registerHlsPlayer', () => {
    it('throws when the call is not on HLS playback', () => {
      call.state.setPlaybackType({ type: 'webrtc' });
      const { Hls } = createFakeHls();

      expect(() => call.registerHlsPlayer(Hls, createVideo())).toThrow(
        'The call is not on HLS playback',
      );
    });

    it('keeps the player state in the call state', () => {
      const { Hls } = createFakeHls();
      const video = createVideo();
      const { unregister } = call.registerHlsPlayer(Hls, video);
      expect(call.state.hlsPlaybackState).toBe('loading');

      dispatchVideoEvent(video, 'playing');
      dispatchVideoEvent(video, 'waiting');
      expect(call.state.hlsPlaybackState).toBe('buffering');

      unregister();
      dispatchVideoEvent(video, 'playing');
      expect(call.state.hlsPlaybackState).toBeUndefined();
    });

    it('keeps the player error in the call state', () => {
      const { Hls, instances } = createFakeHls();
      const video = createVideo();
      const { unregister } = call.registerHlsPlayer(Hls, video);
      dispatchVideoEvent(video, 'playing');

      instances[0].emit(Hls.Events.ERROR, {
        fatal: true,
        type: Hls.ErrorTypes.MEDIA_ERROR,
        details: 'bufferAppendError',
      });
      expect(call.state.hlsPlaybackError).toBeUndefined(); // recovered once
      instances[0].emit(Hls.Events.ERROR, {
        fatal: true,
        type: Hls.ErrorTypes.MEDIA_ERROR,
        details: 'bufferAppendError',
      });
      expect(call.state.hlsPlaybackError).toBeInstanceOf(HlsPlaybackError);
      expect(call.state.hlsPlaybackError?.code).toBe('bufferAppendError');
      // a failed player is no longer playing
      expect(call.state.hlsPlaybackState).toBeUndefined();

      unregister();
      expect(call.state.hlsPlaybackError).toBeUndefined();
    });

    it('marks blocked autoplay like blocked WebRTC audio', async () => {
      const { Hls, instances } = createFakeHls();
      const video = createVideo();
      video.play = vi
        .fn()
        .mockRejectedValueOnce(autoplayBlocked())
        .mockResolvedValue(undefined);
      call.registerHlsPlayer(Hls, video);
      const blocked = () =>
        getCurrentValue(call.blockedAudioTracker.autoplayBlocked$);

      instances[0].emit(Hls.Events.MANIFEST_PARSED);
      await vi.waitFor(() => expect(blocked()).toBe(true));
      expect(call.state.hlsPlaybackError).toBeUndefined();

      await call.resumeAudio();
      expect(video.play).toHaveBeenCalledTimes(2);
      expect(blocked()).toBe(false);
    });

    it('unmarks blocked autoplay when unregistered', async () => {
      const { Hls, instances } = createFakeHls();
      const video = createVideo();
      video.play = vi.fn().mockRejectedValue(autoplayBlocked());
      const { unregister } = call.registerHlsPlayer(Hls, video);
      instances[0].emit(Hls.Events.MANIFEST_PARSED);
      await vi.waitFor(() =>
        expect(call.blockedAudioTracker.isBlocked(video)).toBe(true),
      );

      unregister();

      expect(call.blockedAudioTracker.isBlocked(video)).toBe(false);
    });

    it('follows the speaker device and volume', () => {
      Object.defineProperty(call.speaker.state, 'isDeviceSelectionSupported', {
        value: true,
      });
      const { Hls } = createFakeHls();
      const video = createVideo();
      video.setSinkId = vi.fn().mockResolvedValue(undefined);
      const { unregister } = call.registerHlsPlayer(Hls, video);

      call.speaker.select('headphones');
      call.speaker.setVolume(0.3);
      expect(video.setSinkId).toHaveBeenLastCalledWith('headphones');
      expect(video.volume).toBe(0.3);

      unregister();
      call.speaker.select('speaker');
      call.speaker.setVolume(0.8);
      expect(video.setSinkId).toHaveBeenLastCalledWith('headphones');
      expect(video.volume).toBe(0.3);
    });

    it('keeps following the speaker across a broadcast restart', () => {
      const subscribe = vi.spyOn(call.speaker.state.volume$, 'subscribe');
      const { Hls } = createFakeHls();
      const video = createVideo();
      call.registerHlsPlayer(Hls, video);

      call.state.setPlaybackType({
        type: 'hls',
        playlistUrl: 'https://cdn.example.com/restarted.m3u8',
      });
      call.speaker.setVolume(0.4);

      expect(subscribe).toHaveBeenCalledTimes(1);
      expect(video.volume).toBe(0.4);
    });

    it('cleans up when the player fails to start', () => {
      const { Hls } = createFakeHls();
      const Throwing = class extends Hls {
        attachMedia = vi.fn(() => {
          throw new Error('attach failed');
        });
      };
      const video = createVideo();

      expect(() => call.registerHlsPlayer(Throwing, video)).toThrow(
        'attach failed',
      );
      expect(call.state.hlsPlaybackState).toBeUndefined();
      call.speaker.setVolume(0.2);
      expect(video.volume).toBe(1);
    });

    it('follows a restarted broadcast to its new URL', () => {
      const { Hls, instances } = createFakeHls();
      const video = createVideo();
      const playback = call.registerHlsPlayer(Hls, video);
      expect(playback.hls).toBe(instances[0]);

      const restartedUrl = 'https://cdn.example.com/restarted.m3u8';
      call.state.setPlaybackType({ type: 'hls', playlistUrl: restartedUrl });

      expect(instances[0].destroy).toHaveBeenCalledTimes(1);
      expect(instances[1].loadSource).toHaveBeenCalledWith(restartedUrl);
      expect(instances[1].attachMedia).toHaveBeenCalledWith(video);
      expect(playback.hls).toBe(instances[1]);

      playback.unregister();
      expect(instances[1].destroy).toHaveBeenCalledTimes(1);
      call.state.setPlaybackType({ type: 'hls', playlistUrl: PLAYLIST_URL });
      expect(instances).toHaveLength(2);
    });

    it('replaces the previous player', async () => {
      const { Hls, instances } = createFakeHls();
      const first = call.registerHlsPlayer(Hls, createVideo());
      const second = createVideo();
      call.registerHlsPlayer(Hls, second);
      expect(instances[0].destroy).toHaveBeenCalledTimes(1);

      // the first player's late cleanup leaves the new one alone
      dispatchVideoEvent(second, 'playing');
      first.unregister();
      expect(call.state.hlsPlaybackState).toBe('playing');

      await call.leave();
      expect(instances[1].destroy).toHaveBeenCalledTimes(1);
      expect(call.state.hlsPlaybackState).toBeUndefined();
    });

    /** Applies an HLS join, as `joinHlsPlayback` does. */
    const joinWithStats = (statsToken: string | undefined, enabled = true) =>
      (call as any).hlsPlayback.join(
        {
          call: { session: { id: 'session' } },
          playback: { playlist_url: PLAYLIST_URL, stats_token: statsToken },
          stats_options: {
            enable_hls_stats: enabled,
            reporting_hls_interval_ms: 3_600_000,
          },
        },
        {},
        'unified',
      );
    /** The bodies of the call's `hls_stats` requests. */
    const captureReports = () => {
      const reports: any[] = [];
      vi.spyOn((call as any).streamClient, 'doAxiosRequest').mockImplementation(
        async (...args: any[]) => {
          reports.push(args[2]);
        },
      );
      return reports;
    };

    it('reports no stats when they are off or unsigned', async () => {
      const reports = captureReports();
      const { Hls } = createFakeHls();
      for (const join of [
        () => joinWithStats('token', false),
        () => joinWithStats(undefined),
      ]) {
        join();
        const video = createVideo();
        const { unregister } = call.registerHlsPlayer(Hls, video);
        dispatchVideoEvent(video, 'playing');
        unregister();
      }

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(reports).toEqual([]);
    });

    it('reports stats for a player registered as the call turns to HLS', async () => {
      const reports = captureReports();
      call.state.setPlaybackType({ type: 'webrtc' });
      const { Hls } = createFakeHls();
      const video = createVideo();
      call.state.playbackType$.subscribe(({ type }) => {
        if (type === 'hls') call.registerHlsPlayer(Hls, video);
      });

      joinWithStats('token');
      dispatchVideoEvent(video, 'playing');

      await vi.waitFor(() => expect(reports).toHaveLength(1));
      expect(reports[0].type).toBe('started');
    });

    it('reports stats with the player sample and its errors', async () => {
      const reports = captureReports();
      joinWithStats('token');
      const { Hls, instances } = createFakeHls();
      const video = createVideo();
      const { unregister } = call.registerHlsPlayer(Hls, video);
      instances[0].currentLevel = 1;

      dispatchVideoEvent(video, 'playing');
      instances[0].emit(Hls.Events.ERROR, {
        fatal: true,
        type: Hls.ErrorTypes.NETWORK_ERROR,
        details: 'levelParsingError',
      });
      unregister();

      await vi.waitFor(() => expect(reports).toHaveLength(2));
      expect(reports[0].type).toBe('started');
      expect(reports[1]).toMatchObject({
        type: 'ended',
        end_reason: 'error',
        error_code: 'levelParsingError',
        stats: { bitrate_kbps: 3_300 },
      });
    });
  });
});

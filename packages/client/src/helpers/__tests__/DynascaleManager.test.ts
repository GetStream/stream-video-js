import { VideoApi } from '../../gen/coordinator/video/VideoApi';
import { ApiClient } from '../../coordinator/connection/api-client';
/**
 * @vitest-environment happy-dom
 */

import '../../rtc/__tests__/mocks/webrtc.mocks';

import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  Mock,
  vi,
} from 'vitest';
import { DynascaleManager } from '../DynascaleManager';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { ClientEventReporter } from '../../reporting';
import { ClientState } from '../../store';
import { getCurrentValue } from '../../store/rxUtils';
import { VisibilityState } from '../../types';
import { noopComparator } from '../../sorting';
import { TrackType } from '../../gen/video/sfu/models/models';

vi.mock(import('../browsers'), async (importOriginal) => {
  const module = await importOriginal();
  return {
    ...module,
    isSafari: () => globalThis._isSafari ?? false,
    isIOS: () => globalThis._isIOS ?? false,
    isWebKit: () => globalThis._isWebKit ?? false,
  };
});

describe('DynascaleManager', () => {
  let dynascaleManager: DynascaleManager;
  let call: Call;

  beforeEach(() => {
    const streamClient = new StreamClient('api-key', {
      devicePersistence: { enabled: false },
    });
    call = new Call({
      id: 'id',
      type: 'default',
      streamClient,
      videoApi: new VideoApi(new ApiClient(streamClient)),
      clientEventReporter: new ClientEventReporter({ streamClient }),
      clientState: new ClientState(),
    });
    call.setSortParticipantsBy(noopComparator());
    dynascaleManager = call.dynascaleManager;
  });

  afterEach(async () => {
    await call.leave();
  });

  describe('element binding', () => {
    let videoElement: globalThis.HTMLVideoElement;

    beforeEach(() => {
      // Mock global isSafari to false for testing
      globalThis._isSafari = false;

      dynascaleManager.setUseWebAudio(false);

      videoElement = document.createElement('video');

      // circumvent happy-dom's extensive validation rules
      Object.defineProperties(videoElement, {
        srcObject: { writable: true },
        clientWidth: { writable: true },
        clientHeight: { writable: true },
      });

      // @ts-expect-error private property
      videoElement.clientWidth = 100;
      // @ts-expect-error private property
      videoElement.clientHeight = 100;
    });

    afterAll(() => {
      delete globalThis._isSafari;
      vi.resetModules();
    });

    it('audio: should bind audio element', () => {
      vi.useFakeTimers();
      const audioElement = document.createElement('audio');
      // circumvent happy-dom's MediaStream validation
      Object.defineProperty(audioElement, 'srcObject', { writable: true });
      const play = vi.spyOn(audioElement, 'play').mockResolvedValue();
      audioElement.setSinkId = vi.fn().mockResolvedValue({});

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id-local', {
        userId: 'user-id-local',
        sessionId: 'session-id-local',
        isLocalParticipant: true,
        publishedTracks: [],
      });

      const cleanup = dynascaleManager.bindAudioElement(
        audioElement,
        'session-id',
        'audioTrack',
      );
      expect(audioElement.autoplay).toBe(true);

      const mediaStream = new MediaStream();
      call.state.updateParticipant('session-id', {
        audioStream: mediaStream,
      });

      vi.runAllTimers();

      expect(play).toHaveBeenCalled();
      expect(audioElement.srcObject).toBe(mediaStream);
      expect(audioElement.volume).toBe(1);
      expect(audioElement.setSinkId).not.toHaveBeenCalled();

      call.speaker.select('different-device-id');
      expect(audioElement.setSinkId).toHaveBeenCalledWith(
        'different-device-id',
      );

      call.speaker.setVolume(0.5);
      expect(audioElement.volume).toBe(0.5);

      call.speaker.setParticipantVolume('session-id', 0.7);
      expect(audioElement.volume).toBe(0.7);

      call.speaker.setParticipantVolume('session-id', undefined);
      expect(audioElement.volume).toBe(0.5);

      cleanup?.();
    });

    it('audio: resets the sinkId to the default output when the speaker is deselected', () => {
      vi.useFakeTimers();
      const audioElement = document.createElement('audio');
      Object.defineProperty(audioElement, 'srcObject', { writable: true });
      vi.spyOn(audioElement, 'play').mockResolvedValue();
      let sinkId = '';
      Object.defineProperty(audioElement, 'sinkId', { get: () => sinkId });
      audioElement.setSinkId = vi.fn(async (id: string) => {
        sinkId = id;
      });

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      const cleanup = dynascaleManager.bindAudioElement(
        audioElement,
        'session-id',
        'audioTrack',
      );
      call.state.updateParticipant('session-id', {
        audioStream: new MediaStream(),
      });
      vi.runAllTimers();
      // already on the default output, nothing to reset
      expect(audioElement.setSinkId).not.toHaveBeenCalled();

      call.speaker.select('headset-id');
      expect(audioElement.setSinkId).toHaveBeenLastCalledWith('headset-id');

      // what SpeakerManager selects when the chosen device disconnects
      call.speaker.select('');
      expect(audioElement.setSinkId).toHaveBeenLastCalledWith('');
      expect(audioElement.setSinkId).toHaveBeenCalledTimes(2);

      cleanup?.();
    });

    it('audio: tracks the blocked session and clears it once the element plays', async () => {
      vi.useFakeTimers();
      let cleanup: ReturnType<typeof dynascaleManager.bindAudioElement>;
      try {
        const audioElement = document.createElement('audio');
        Object.defineProperty(audioElement, 'srcObject', { writable: true });
        vi.spyOn(audioElement, 'play').mockRejectedValue(
          new DOMException('', 'NotAllowedError'),
        );

        // @ts-expect-error incomplete data
        call.state.updateOrAddParticipant('session-id', {
          userId: 'user-id',
          sessionId: 'session-id',
          publishedTracks: [],
        });

        cleanup = dynascaleManager.bindAudioElement(
          audioElement,
          'session-id',
          'audioTrack',
        );

        call.state.updateParticipant('session-id', {
          audioStream: new MediaStream(),
        });
        await vi.advanceTimersByTimeAsync(0); // flush the rejected play()

        expect(call.blockedAudioTracker.isBlocked(audioElement)).toBe(true);
        expect(
          getCurrentValue(call.blockedAudioTracker.blockedSessionIds$),
        ).toEqual(['session-id']);

        // Safari fires `playing` on an element whose play() was rejected
        Object.defineProperty(audioElement, 'paused', {
          value: true,
          writable: true,
        });
        audioElement.dispatchEvent(new Event('playing'));
        expect(call.blockedAudioTracker.isBlocked(audioElement)).toBe(true);

        // @ts-expect-error read-only property
        audioElement.paused = false;
        audioElement.dispatchEvent(new Event('playing'));

        expect(call.blockedAudioTracker.isBlocked(audioElement)).toBe(false);
        expect(
          getCurrentValue(call.blockedAudioTracker.blockedSessionIds$),
        ).toEqual([]);
      } finally {
        cleanup?.();
        vi.useRealTimers();
      }
    });

    it('audio: retries playback of a paused element when the track is republished', async () => {
      vi.useFakeTimers();
      let cleanup: ReturnType<typeof dynascaleManager.bindAudioElement>;
      try {
        const audioElement = document.createElement('audio');
        Object.defineProperty(audioElement, 'srcObject', { writable: true });
        const play = vi
          .spyOn(audioElement, 'play')
          .mockRejectedValue(new DOMException('', 'NotAllowedError'));

        // @ts-expect-error incomplete data
        call.state.updateOrAddParticipant('session-id', {
          userId: 'user-id',
          sessionId: 'session-id',
          publishedTracks: [TrackType.AUDIO],
          audioStream: new MediaStream(),
        });

        cleanup = dynascaleManager.bindAudioElement(
          audioElement,
          'session-id',
          'audioTrack',
        );
        await vi.advanceTimersByTimeAsync(0);
        expect(play).toHaveBeenCalledTimes(1);
        expect(call.blockedAudioTracker.isBlocked(audioElement)).toBe(true);

        call.state.updateParticipant('session-id', { publishedTracks: [] });
        await vi.advanceTimersByTimeAsync(0);
        expect(play).toHaveBeenCalledTimes(1);

        play.mockResolvedValue();
        call.state.updateParticipant('session-id', {
          publishedTracks: [TrackType.AUDIO],
        });
        await vi.advanceTimersByTimeAsync(0);
        expect(play).toHaveBeenCalledTimes(2);
      } finally {
        cleanup?.();
        vi.useRealTimers();
      }
    });

    it('audio: does not retry playback of a playing element when the track is republished', async () => {
      vi.useFakeTimers();
      let cleanup: ReturnType<typeof dynascaleManager.bindAudioElement>;
      try {
        const audioElement = document.createElement('audio');
        Object.defineProperties(audioElement, {
          srcObject: { writable: true },
          paused: { value: false },
        });
        const play = vi.spyOn(audioElement, 'play').mockResolvedValue();

        // @ts-expect-error incomplete data
        call.state.updateOrAddParticipant('session-id', {
          userId: 'user-id',
          sessionId: 'session-id',
          publishedTracks: [TrackType.AUDIO],
          audioStream: new MediaStream(),
        });

        cleanup = dynascaleManager.bindAudioElement(
          audioElement,
          'session-id',
          'audioTrack',
        );
        await vi.advanceTimersByTimeAsync(0);
        expect(play).toHaveBeenCalledTimes(1);

        call.state.updateParticipant('session-id', { publishedTracks: [] });
        call.state.updateParticipant('session-id', {
          publishedTracks: [TrackType.AUDIO],
        });
        await vi.advanceTimersByTimeAsync(0);
        expect(play).toHaveBeenCalledTimes(1);
      } finally {
        cleanup?.();
        vi.useRealTimers();
      }
    });

    it('audio: Safari should use AudioContext for audio playback', () => {
      globalThis._isSafari = true;
      dynascaleManager.setUseWebAudio(true); // enabled by default on Safari
      Object.defineProperty(call.speaker.state, 'isDeviceSelectionSupported', {
        value: false,
      });

      vi.useFakeTimers();
      const audioElement = document.createElement('audio');
      // circumvent happy-dom's MediaStream validation
      Object.defineProperty(audioElement, 'srcObject', { writable: true });
      const play = vi.spyOn(audioElement, 'play').mockResolvedValue();
      audioElement.setSinkId = vi.fn().mockResolvedValue({});

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id-local', {
        userId: 'user-id-local',
        sessionId: 'session-id-local',
        isLocalParticipant: true,
        publishedTracks: [],
      });

      const cleanup = dynascaleManager.bindAudioElement(
        audioElement,
        'session-id',
        'audioTrack',
      );
      expect(audioElement.autoplay).toBe(true);

      const mediaStream = new MediaStream();
      call.state.updateParticipant('session-id', { audioStream: mediaStream });

      vi.runAllTimers();

      expect(play).not.toHaveBeenCalled();
      expect(audioElement.srcObject).toBe(mediaStream);
      expect(audioElement.volume).toBe(1);
      expect(audioElement.setSinkId).not.toHaveBeenCalled();
      expect(audioElement.muted).toBe(true);

      // @ts-expect-error private property
      const audioContext = dynascaleManager.audioContext;
      expect(audioContext).toBeDefined();
      expect(audioContext.resume).toHaveBeenCalled();
      expect(audioContext.state).toBe('running');
      expect(audioContext.createMediaStreamSource).toHaveBeenCalledWith(
        mediaStream,
      );
      expect(audioContext.createGain).toHaveBeenCalled();
      expect(audioContext.resume).toHaveBeenCalled();

      const sourceNode = (
        audioContext.createMediaStreamSource as Mock<
          AudioContext['createMediaStreamSource']
        >
      ).mock.results[0].value;

      const gainNode = (
        audioContext.createGain as Mock<AudioContext['createGain']>
      ).mock.results[0].value;

      expect(sourceNode.connect).toHaveBeenCalledWith(gainNode);
      expect(gainNode.connect).toHaveBeenCalledWith(audioContext.destination);

      call.speaker.select('different-device-id');
      expect(audioElement.setSinkId).not.toHaveBeenCalled();
      // @ts-expect-error sinkId isn't available in the TS definition
      expect(audioContext.sinkId).not.toBe('different-device-id');

      call.speaker.setVolume(0.5);
      expect(audioElement.volume).toBe(0.5);
      expect(gainNode.gain.value).toBe(0.5);

      call.speaker.setParticipantVolume('session-id', 0.7);
      expect(audioElement.volume).toBe(0.7);
      expect(gainNode.gain.value).toBe(0.7);

      call.speaker.setParticipantVolume('session-id', undefined);
      expect(audioElement.volume).toBe(0.5);
      expect(gainNode.gain.value).toBe(0.5);

      cleanup?.();
    });

    it('audio: should bind screenShare audio element', () => {
      vi.useFakeTimers();
      const audioElement = document.createElement('audio');
      // circumvent happy-dom's MediaStream validation
      Object.defineProperty(audioElement, 'srcObject', { writable: true });
      const play = vi.spyOn(audioElement, 'play').mockResolvedValue();

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [TrackType.SCREEN_SHARE_AUDIO],
      });

      const cleanup = dynascaleManager.bindAudioElement(
        audioElement,
        'session-id',
        'screenShareAudioTrack',
      );
      expect(audioElement.autoplay).toBe(true);

      const audioMediaStream = new MediaStream();
      const screenShareAudioMediaStream = new MediaStream();
      call.state.updateParticipant('session-id', {
        audioStream: audioMediaStream,
        screenShareAudioStream: screenShareAudioMediaStream,
      });

      vi.runAllTimers();

      expect(play).toHaveBeenCalled();
      expect(audioElement.srcObject).toBe(screenShareAudioMediaStream);

      cleanup?.();
    });

    it('video: should update subscription when track becomes available', () => {
      const updateSubscription = vi.spyOn(
        call.state,
        'updateParticipantTracks',
      );

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      const cleanup = dynascaleManager.bindVideoElement(
        videoElement,
        'session-id',
        'videoTrack',
      );

      expect(videoElement.autoplay).toBe(true);
      expect(videoElement.muted).toBe(true);
      expect(videoElement.playsInline).toBe(true);

      expect(updateSubscription).toHaveBeenCalledWith('videoTrack', {
        'session-id': { dimension: undefined },
      });

      call.state.updateParticipant('session-id', {
        publishedTracks: [TrackType.VIDEO],
      });

      expect(updateSubscription).toHaveBeenCalledWith('videoTrack', {
        'session-id': {
          dimension: {
            width: videoElement.clientWidth,
            height: videoElement.clientHeight,
          },
        },
      });

      call.state.updateParticipant('session-id', {
        publishedTracks: [TrackType.VIDEO],
      });

      expect(updateSubscription).toHaveBeenCalledWith('videoTrack', {
        'session-id': { dimension: undefined },
      });

      cleanup?.();

      expect(updateSubscription).toHaveBeenLastCalledWith('videoTrack', {
        'session-id': { dimension: undefined },
      });
    });

    it('video: should play video when track becomes available', () => {
      vi.useFakeTimers();

      const updateSubscription = vi.spyOn(
        call.state,
        'updateParticipantTracks',
      );

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      const cleanup = dynascaleManager.bindVideoElement(
        videoElement,
        'session-id',
        'videoTrack',
      );

      const mediaStream = new MediaStream();
      call.state.updateParticipant('session-id', {
        publishedTracks: [TrackType.VIDEO],
        videoStream: mediaStream,
      });

      vi.runAllTimers();

      expect(updateSubscription).toHaveBeenCalledWith('videoTrack', {
        'session-id': {
          dimension: {
            width: videoElement.clientWidth,
            height: videoElement.clientHeight,
          },
        },
      });

      expect(videoElement.srcObject).toBe(mediaStream);

      expect(cleanup).toBeDefined();
      cleanup?.();

      expect(updateSubscription).toHaveBeenLastCalledWith('videoTrack', {
        'session-id': { dimension: undefined },
      });
    });

    it('video: Safari should force play video when track becomes available', () => {
      globalThis._isSafari = true;

      vi.useFakeTimers();
      const updateSubscription = vi.spyOn(
        call.state,
        'updateParticipantTracks',
      );
      const play = vi.spyOn(videoElement, 'play').mockResolvedValue();

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      const cleanup = dynascaleManager.bindVideoElement(
        videoElement,
        'session-id',
        'videoTrack',
      );

      const mediaStream = new MediaStream();
      call.state.updateParticipant('session-id', {
        publishedTracks: [TrackType.VIDEO],
        videoStream: mediaStream,
      });

      vi.runAllTimers();

      expect(updateSubscription).toHaveBeenCalledWith('videoTrack', {
        'session-id': {
          dimension: {
            width: videoElement.clientWidth,
            height: videoElement.clientHeight,
          },
        },
      });

      expect(play).toHaveBeenCalledOnce();
      expect(videoElement.srcObject).toBe(mediaStream);

      expect(cleanup).toBeDefined();
      cleanup?.();

      expect(updateSubscription).toHaveBeenLastCalledWith('videoTrack', {
        'session-id': { dimension: undefined },
      });
    });

    it('video: releases the stream when the element is unbound', () => {
      vi.useFakeTimers();

      const mediaStream = new MediaStream();
      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [TrackType.VIDEO],
        videoStream: mediaStream,
      });

      const cleanup = dynascaleManager.bindVideoElement(
        videoElement,
        'session-id',
        'videoTrack',
      );
      vi.runAllTimers();
      expect(videoElement.srcObject).toBe(mediaStream);

      cleanup?.();

      expect(videoElement.srcObject).toBeNull();
    });

    it('video: Safari does not re-attach the stream after the element is unbound', () => {
      globalThis._isSafari = true;
      vi.useFakeTimers();
      const play = vi.spyOn(videoElement, 'play').mockResolvedValue();

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [TrackType.VIDEO],
        videoStream: new MediaStream(),
      });

      const cleanup = dynascaleManager.bindVideoElement(
        videoElement,
        'session-id',
        'videoTrack',
      );
      cleanup?.();
      vi.runAllTimers();

      expect(videoElement.srcObject).toBeNull();
      expect(play).not.toHaveBeenCalled();
    });

    it('video: should update subscription when element becomes visible', () => {
      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
        viewportVisibilityState: {
          videoTrack: VisibilityState.UNKNOWN,
          screenShareTrack: VisibilityState.UNKNOWN,
        },
      });

      const updateSubscription = vi.spyOn(
        call.state,
        'updateParticipantTracks',
      );

      const cleanup = dynascaleManager.bindVideoElement(
        videoElement,
        'session-id',
        'videoTrack',
      );

      expect(updateSubscription).toHaveBeenCalledWith('videoTrack', {
        'session-id': { dimension: undefined },
      });

      call.state.updateParticipant('session-id', {
        viewportVisibilityState: {
          videoTrack: VisibilityState.VISIBLE,
          screenShareTrack: VisibilityState.UNKNOWN,
        },
      });

      expect(updateSubscription).toHaveBeenCalledWith('videoTrack', {
        'session-id': {
          dimension: {
            width: videoElement.clientWidth,
            height: videoElement.clientHeight,
          },
        },
      });

      call.state.updateParticipant('session-id', {
        viewportVisibilityState: {
          videoTrack: VisibilityState.INVISIBLE,
          screenShareTrack: VisibilityState.UNKNOWN,
        },
      });

      expect(updateSubscription).toHaveBeenCalledWith('videoTrack', {
        'session-id': { dimension: undefined },
      });

      call.state.updateParticipant('session-id', {
        viewportVisibilityState: {
          videoTrack: VisibilityState.UNKNOWN,
          screenShareTrack: VisibilityState.UNKNOWN,
        },
      });

      expect(updateSubscription).toHaveBeenCalledWith('videoTrack', {
        'session-id': {
          dimension: {
            width: videoElement.clientWidth,
            height: videoElement.clientHeight,
          },
        },
      });

      cleanup?.();

      expect(updateSubscription).toHaveBeenLastCalledWith('videoTrack', {
        'session-id': { dimension: undefined },
      });
    });

    it('video: should update subscription when element resizes', () => {
      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [TrackType.VIDEO],
        viewportVisibilityState: {
          videoTrack: VisibilityState.VISIBLE,
          screenShareTrack: VisibilityState.UNKNOWN,
        },
      });

      const updateSubscription = vi.spyOn(
        call.state,
        'updateParticipantTracks',
      );

      let resizeObserverCallback: ResizeObserverCallback | undefined =
        undefined;
      window.ResizeObserver = class ResizeObserver {
        observe = vi.fn().mockImplementation(() => {
          // @ts-expect-error simulate initial trigger
          resizeObserverCallback();
        });
        unobserve = vi.fn();
        disconnect = vi.fn();

        constructor(callback: ResizeObserverCallback) {
          resizeObserverCallback = callback;
        }
      };

      const cleanup = dynascaleManager.bindVideoElement(
        videoElement,
        'session-id',
        'videoTrack',
      );

      expect(updateSubscription).toHaveBeenCalledWith('videoTrack', {
        'session-id': {
          dimension: {
            width: videoElement.clientWidth,
            height: videoElement.clientHeight,
          },
        },
      });

      // @ts-expect-error simulate resize
      videoElement.clientHeight = 101;
      // @ts-expect-error simulate resize
      videoElement.clientWidth = 101;

      // @ts-expect-error simulate resize
      resizeObserverCallback();

      expect(updateSubscription).toHaveBeenCalledWith('videoTrack', {
        'session-id': { dimension: { width: 101, height: 101 } },
      });

      cleanup?.();

      expect(updateSubscription).toHaveBeenLastCalledWith('videoTrack', {
        'session-id': { dimension: undefined },
      });
    });

    it('audio: marks element blocked on NotAllowedError', async () => {
      vi.useFakeTimers();
      const audioElement = document.createElement('audio');
      Object.defineProperty(audioElement, 'srcObject', { writable: true });
      vi.spyOn(audioElement, 'play').mockRejectedValue(
        new DOMException('', 'NotAllowedError'),
      );

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      const cleanup = call.bindAudioElement(
        audioElement,
        'session-id',
        'audioTrack',
      );

      const mediaStream = new MediaStream();
      call.state.updateParticipant('session-id', {
        audioStream: mediaStream,
      });

      vi.runAllTimers();
      await vi.advanceTimersByTimeAsync(0);

      expect(getCurrentValue(call.blockedAudioTracker.autoplayBlocked$)).toBe(
        true,
      );

      cleanup?.();
    });

    it('audio: unmarks blocked element on cleanup', async () => {
      vi.useFakeTimers();
      const audioElement = document.createElement('audio');
      Object.defineProperty(audioElement, 'srcObject', { writable: true });
      vi.spyOn(audioElement, 'play').mockRejectedValue(
        new DOMException('', 'NotAllowedError'),
      );

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      const cleanup = call.bindAudioElement(
        audioElement,
        'session-id',
        'audioTrack',
      );

      call.state.updateParticipant('session-id', {
        audioStream: new MediaStream(),
      });

      vi.runAllTimers();
      await vi.advanceTimersByTimeAsync(0);

      expect(getCurrentValue(call.blockedAudioTracker.autoplayBlocked$)).toBe(
        true,
      );

      cleanup?.();

      expect(getCurrentValue(call.blockedAudioTracker.autoplayBlocked$)).toBe(
        false,
      );
    });

    it('audio: unmarks blocked element when the audio stream is removed', async () => {
      vi.useFakeTimers();
      const audioElement = document.createElement('audio');
      Object.defineProperty(audioElement, 'srcObject', { writable: true });
      vi.spyOn(audioElement, 'play').mockRejectedValue(
        new DOMException('', 'NotAllowedError'),
      );

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      const cleanup = call.bindAudioElement(
        audioElement,
        'session-id',
        'audioTrack',
      );

      call.state.updateParticipant('session-id', {
        audioStream: new MediaStream(),
      });

      vi.runAllTimers();
      await vi.advanceTimersByTimeAsync(0);

      expect(getCurrentValue(call.blockedAudioTracker.autoplayBlocked$)).toBe(
        true,
      );

      call.state.updateParticipant('session-id', { audioStream: undefined });

      vi.runAllTimers();
      await vi.advanceTimersByTimeAsync(0);

      expect(audioElement.srcObject).toBeNull();
      expect(getCurrentValue(call.blockedAudioTracker.autoplayBlocked$)).toBe(
        false,
      );

      cleanup?.();
    });

    it('video: watchdog re-plays element after a pause event', async () => {
      vi.useFakeTimers();
      Object.defineProperties(videoElement, {
        paused: { writable: true, configurable: true },
        readyState: { writable: true, configurable: true },
      });
      // @ts-expect-error simulate paused, ready-to-play element
      videoElement.paused = true;
      // @ts-expect-error simulate paused, ready-to-play element
      videoElement.readyState = 4;
      const play = vi.spyOn(videoElement, 'play').mockResolvedValue();

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [TrackType.VIDEO],
      });

      const cleanup = dynascaleManager.bindVideoElement(
        videoElement,
        'session-id',
        'videoTrack',
      );

      const mediaStream = new MediaStream();
      call.state.updateParticipant('session-id', {
        videoStream: mediaStream,
      });
      vi.runAllTimers();

      const callsBeforePause = play.mock.calls.length;
      videoElement.dispatchEvent(new Event('pause'));
      await vi.advanceTimersByTimeAsync(0);

      expect(play.mock.calls.length).toBeGreaterThan(callsBeforePause);

      cleanup?.();
    });

    it('video: on iOS, waits for the page to be visible again before re-playing', async () => {
      vi.useFakeTimers();
      globalThis._isIOS = true;
      const setHidden = (hidden: boolean) => {
        Object.defineProperty(document, 'hidden', {
          configurable: true,
          get: () => hidden,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      };
      try {
        Object.defineProperties(videoElement, {
          paused: { writable: true, configurable: true },
          readyState: { writable: true, configurable: true },
        });
        // @ts-expect-error simulate paused, ready-to-play element
        videoElement.paused = true;
        // @ts-expect-error simulate paused, ready-to-play element
        videoElement.readyState = 4;
        const play = vi.spyOn(videoElement, 'play').mockResolvedValue();

        // @ts-expect-error incomplete data
        call.state.updateOrAddParticipant('session-id', {
          userId: 'user-id',
          sessionId: 'session-id',
          publishedTracks: [TrackType.VIDEO],
        });
        const cleanup = dynascaleManager.bindVideoElement(
          videoElement,
          'session-id',
          'videoTrack',
        );
        call.state.updateParticipant('session-id', {
          videoStream: new MediaStream(),
        });
        vi.runAllTimers();

        setHidden(true);
        const callsWhileHidden = play.mock.calls.length;
        videoElement.dispatchEvent(new Event('pause'));
        await vi.advanceTimersByTimeAsync(5000);
        expect(play.mock.calls.length).toBe(callsWhileHidden);

        setHidden(false);
        await vi.advanceTimersByTimeAsync(1000);
        expect(play.mock.calls.length).toBe(callsWhileHidden + 1);

        cleanup?.();
      } finally {
        globalThis._isIOS = undefined;
        // @ts-expect-error restore the prototype getter
        delete document.hidden;
      }
    });

    it('audio: watchdog re-plays element after pause when useWebAudio is false', async () => {
      vi.useFakeTimers();
      const audioElement = document.createElement('audio');
      Object.defineProperties(audioElement, {
        srcObject: { writable: true },
        paused: { writable: true, configurable: true },
        readyState: { writable: true, configurable: true },
      });
      // @ts-expect-error simulate paused, ready-to-play element
      audioElement.paused = true;
      // @ts-expect-error simulate paused, ready-to-play element
      audioElement.readyState = 4;
      const play = vi.spyOn(audioElement, 'play').mockResolvedValue();

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      const cleanup = dynascaleManager.bindAudioElement(
        audioElement,
        'session-id',
        'audioTrack',
      );

      call.state.updateParticipant('session-id', {
        audioStream: new MediaStream(),
      });
      vi.runAllTimers();

      const callsBeforePause = play.mock.calls.length;
      audioElement.dispatchEvent(new Event('pause'));
      await vi.advanceTimersByTimeAsync(0);

      expect(play.mock.calls.length).toBeGreaterThan(callsBeforePause);

      cleanup?.();
    });

    describe('audio: playback recovery', () => {
      const bindPausedAudioElement = (
        opts: { blockedByAutoplay?: boolean; sessionId?: string } = {},
      ) => {
        const sessionId = opts.sessionId ?? 'session-id';
        const audioElement = document.createElement('audio');
        Object.defineProperties(audioElement, {
          srcObject: { writable: true },
          paused: { writable: true, configurable: true },
          readyState: { writable: true, configurable: true },
        });
        // @ts-expect-error simulate paused, ready-to-play element
        audioElement.paused = true;
        // @ts-expect-error simulate paused, ready-to-play element
        audioElement.readyState = 4;
        const play = vi.spyOn(audioElement, 'play');
        if (opts.blockedByAutoplay) {
          play.mockRejectedValue(new DOMException('', 'NotAllowedError'));
        }

        // @ts-expect-error incomplete data
        call.state.updateOrAddParticipant(sessionId, {
          userId: `user-${sessionId}`,
          sessionId,
          publishedTracks: [],
        });
        const cleanup = dynascaleManager.bindAudioElement(
          audioElement,
          sessionId,
          'audioTrack',
        );
        call.state.updateParticipant(sessionId, {
          audioStream: new MediaStream(),
        });
        vi.runAllTimers();
        return { audioElement, play, cleanup };
      };

      const setVisibility = (state: DocumentVisibilityState) => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => state,
        });
        Object.defineProperty(document, 'hidden', {
          configurable: true,
          get: () => state === 'hidden',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      };

      afterEach(() => {
        // @ts-expect-error restore the prototype getters
        delete document.visibilityState;
        // @ts-expect-error restore the prototype getters
        delete document.hidden;
      });

      it('marks the element as blocked once recovery gives up', async () => {
        vi.useFakeTimers();
        setVisibility('visible');
        const { audioElement, play, cleanup } = bindPausedAudioElement();
        play.mockRejectedValue(new Error('playback failed'));
        await vi.advanceTimersByTimeAsync(0);
        expect(call.blockedAudioTracker.isBlocked(audioElement)).toBe(false);

        audioElement.dispatchEvent(new Event('pause'));
        for (let i = 0; i < 20; i++) {
          await vi.advanceTimersByTimeAsync(6000);
        }

        expect(call.blockedAudioTracker.isBlocked(audioElement)).toBe(true);
        expect(
          getCurrentValue(call.blockedAudioTracker.blockedSessionIds$),
        ).toEqual(['session-id']);

        cleanup?.();
      });

      it('keeps retrying when the first re-armed attempt after a give-up fails', async () => {
        vi.useFakeTimers();
        setVisibility('visible');
        const { audioElement, play, cleanup } = bindPausedAudioElement();
        play.mockRejectedValue(new Error('playback failed'));
        await vi.advanceTimersByTimeAsync(0);
        audioElement.dispatchEvent(new Event('pause'));
        for (let i = 0; i < 20; i++) {
          await vi.advanceTimersByTimeAsync(6000);
        }
        expect(call.blockedAudioTracker.isBlocked(audioElement)).toBe(true);
        const callsBeforeRearm = play.mock.calls.length;

        play.mockRejectedValueOnce(new Error('still interrupted'));
        play.mockResolvedValue();
        setVisibility('hidden');
        setVisibility('visible');
        await vi.advanceTimersByTimeAsync(6000);

        expect(play.mock.calls.length).toBe(callsBeforeRearm + 2);
        // the prompt stays up until audio actually plays
        expect(call.blockedAudioTracker.isBlocked(audioElement)).toBe(true);
        // @ts-expect-error simulate actual playback
        audioElement.paused = false;
        audioElement.dispatchEvent(new Event('playing'));
        expect(call.blockedAudioTracker.isBlocked(audioElement)).toBe(false);

        cleanup?.();
      });

      it('tries an autoplay-blocked element only once per re-arm', async () => {
        vi.useFakeTimers();
        setVisibility('visible');
        const { audioElement, play, cleanup } = bindPausedAudioElement({
          blockedByAutoplay: true,
        });
        await vi.advanceTimersByTimeAsync(0);
        expect(call.blockedAudioTracker.isBlocked(audioElement)).toBe(true);
        const callsBeforeRearm = play.mock.calls.length;

        setVisibility('hidden');
        setVisibility('visible');
        for (let i = 0; i < 20; i++) {
          await vi.advanceTimersByTimeAsync(6000);
        }

        expect(play.mock.calls.length).toBe(callsBeforeRearm + 1);
        expect(call.blockedAudioTracker.isBlocked(audioElement)).toBe(true);

        cleanup?.();
      });

      /**
       * Runs `test` on iOS with a shared audio context driven by hand. The
       * silent element runs on it, so the playback watchdogs follow it.
       */
      const withSharedContext = async (
        test: (
          setContextState: (state: AudioContextState) => void,
          context: { suspend: Mock; resume: Mock; state: AudioContextState },
        ) => Promise<void>,
      ) => {
        vi.useFakeTimers();
        setVisibility('visible');
        globalThis._isIOS = true;
        globalThis._isWebKit = true;
        const context = Object.assign(new EventTarget(), {
          state: 'running' as AudioContextState,
          currentTime: 0,
          resume: vi.fn(async () => {}),
          suspend: vi.fn(async () => {}),
          close: vi.fn(async () => {}),
          createOscillator: () => ({
            connect: (node: unknown) => node,
            start: vi.fn(),
            stop: vi.fn(),
            disconnect: vi.fn(),
          }),
          createGain: () => ({
            gain: { value: 1 },
            connect: (node: unknown) => node,
            disconnect: vi.fn(),
          }),
          createMediaStreamDestination: () => ({ stream: new MediaStream() }),
        });
        const { AudioContext } = globalThis;
        globalThis.AudioContext = vi.fn(function () {
          return context;
        }) as unknown as typeof AudioContext;
        const srcObject = Object.getOwnPropertyDescriptor(
          HTMLMediaElement.prototype,
          'srcObject',
        )!;
        Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
          configurable: true,
          get: () => null,
          set: () => {},
        });
        try {
          await test((state) => {
            context.state = state;
            context.dispatchEvent(new Event('statechange'));
          }, context);
        } finally {
          globalThis._isIOS = undefined;
          globalThis._isWebKit = undefined;
          globalThis.AudioContext = AudioContext;
          Object.defineProperty(
            HTMLMediaElement.prototype,
            'srcObject',
            srcObject,
          );
        }
      };

      /**
       * Binds an element WebKit reports as playing after an interruption.
       */
      const bindPlayingAudioElement = (sessionId?: string) => {
        const { audioElement, play, cleanup } = bindPausedAudioElement({
          sessionId,
        });
        play.mockResolvedValue();
        // @ts-expect-error simulate an element WebKit reports as playing
        audioElement.paused = false;
        const pause = vi
          .spyOn(audioElement, 'pause')
          .mockImplementation(() => {});
        return { audioElement, play, pause, cleanup };
      };

      it('restarts playback once an interruption ends after the page is visible again', async () => {
        await withSharedContext(async (setContextState) => {
          const { pause, cleanup } = bindPlayingAudioElement();
          dynascaleManager.keepAudioPlaybackUnlocked();

          setContextState('interrupted');
          setVisibility('hidden');
          setVisibility('visible');
          await vi.advanceTimersByTimeAsync(1000);
          expect(pause).not.toHaveBeenCalled();

          setContextState('running');
          await vi.advanceTimersByTimeAsync(1100);
          expect(pause).toHaveBeenCalledTimes(1);

          cleanup?.();
        });
      });

      it('pauses every remote audio element before playing any of them', async () => {
        await withSharedContext(async (setContextState) => {
          const a = bindPlayingAudioElement('session-a');
          const b = bindPlayingAudioElement('session-b');
          dynascaleManager.keepAudioPlaybackUnlocked();
          a.play.mockClear();
          b.play.mockClear();

          setContextState('interrupted');
          setContextState('running');
          await vi.advanceTimersByTimeAsync(1100);

          expect(a.pause).toHaveBeenCalledTimes(1);
          expect(b.pause).toHaveBeenCalledTimes(1);
          const lastPause = Math.max(
            ...a.pause.mock.invocationCallOrder,
            ...b.pause.mock.invocationCallOrder,
          );
          const firstPlay = Math.min(
            ...a.play.mock.invocationCallOrder,
            ...b.play.mock.invocationCallOrder,
          );
          expect(lastPause).toBeLessThan(firstPlay);

          a.cleanup?.();
          b.cleanup?.();
        });
      });

      it('replaces a scheduled play with the restart', async () => {
        await withSharedContext(async (setContextState) => {
          const { play, cleanup } = bindPausedAudioElement();
          dynascaleManager.keepAudioPlaybackUnlocked();
          play.mockResolvedValue();
          play.mockClear();

          setContextState('interrupted');
          setVisibility('hidden');
          setVisibility('visible');
          await vi.advanceTimersByTimeAsync(10);
          setContextState('running');
          await vi.advanceTimersByTimeAsync(1100);

          expect(play).toHaveBeenCalledTimes(1);

          cleanup?.();
        });
      });

      it('keeps a restart pending while the page is hidden', async () => {
        await withSharedContext(async (setContextState) => {
          const { pause, cleanup } = bindPlayingAudioElement();
          dynascaleManager.keepAudioPlaybackUnlocked();

          setContextState('interrupted');
          setContextState('running');
          setVisibility('hidden');
          await vi.advanceTimersByTimeAsync(1100);
          expect(pause).not.toHaveBeenCalled();

          setVisibility('visible');
          await vi.advanceTimersByTimeAsync(1100);
          expect(pause).toHaveBeenCalledTimes(1);

          cleanup?.();
        });
      });

      it('does not resume the silent element when a restart ends during a new interruption', async () => {
        await withSharedContext(async (setContextState) => {
          const { cleanup } = bindPlayingAudioElement();
          dynascaleManager.keepAudioPlaybackUnlocked();
          const silent = document.querySelector<HTMLAudioElement>(
            'audio[data-stream-silent-audio]',
          )!;
          const silentPlay = vi.spyOn(silent, 'play').mockResolvedValue();

          setContextState('interrupted');
          setContextState('running');
          await vi.advanceTimersByTimeAsync(1100);
          setContextState('interrupted');
          await vi.advanceTimersByTimeAsync(600);
          expect(silentPlay).not.toHaveBeenCalled();

          setContextState('running');
          await vi.advanceTimersByTimeAsync(1700);
          expect(silentPlay).toHaveBeenCalledTimes(1);

          cleanup?.();
        });
      });

      it('reports an interruption that starts while the audio context restarts', async () => {
        await withSharedContext(async (setContextState, context) => {
          const { pause, cleanup } = bindPlayingAudioElement();
          dynascaleManager.keepAudioPlaybackUnlocked();

          await vi.advanceTimersByTimeAsync(5000);
          expect(context.suspend).toHaveBeenCalledTimes(1);

          setContextState('interrupted');
          setContextState('running');
          await vi.advanceTimersByTimeAsync(1100);
          expect(pause).toHaveBeenCalledTimes(1);

          cleanup?.();
        });
      });

      it('restarts a frozen audio context once the page has been visible for a whole check', async () => {
        await withSharedContext(async (_, context) => {
          dynascaleManager.keepAudioPlaybackUnlocked();
          setVisibility('hidden');
          await vi.advanceTimersByTimeAsync(10000);
          expect(context.suspend).not.toHaveBeenCalled();

          setVisibility('visible');
          await vi.advanceTimersByTimeAsync(5000);
          expect(context.suspend).not.toHaveBeenCalled();
          await vi.advanceTimersByTimeAsync(5000);
          expect(context.suspend).toHaveBeenCalledTimes(1);
        });
      });

      it('stops re-arming once the playback unlock is released', async () => {
        vi.useFakeTimers();
        setVisibility('visible');
        const { play, cleanup } = bindPausedAudioElement();
        play.mockResolvedValue();
        dynascaleManager.keepAudioPlaybackUnlocked();
        await vi.advanceTimersByTimeAsync(0);
        dynascaleManager.releaseAudioPlaybackUnlock();
        const callsAfterRelease = play.mock.calls.length;

        setVisibility('hidden');
        setVisibility('visible');
        await vi.advanceTimersByTimeAsync(1000);

        expect(play.mock.calls.length).toBe(callsAfterRelease);

        cleanup?.();
      });

      it('waits for a tap once recovery after a give-up is rejected by the autoplay policy', async () => {
        vi.useFakeTimers();
        setVisibility('visible');
        const { audioElement, play, cleanup } = bindPausedAudioElement();
        play.mockRejectedValue(new Error('playback failed'));
        await vi.advanceTimersByTimeAsync(0);
        audioElement.dispatchEvent(new Event('pause'));
        for (let i = 0; i < 20; i++) {
          await vi.advanceTimersByTimeAsync(6000);
        }

        play.mockRejectedValue(new DOMException('', 'NotAllowedError'));
        setVisibility('hidden');
        setVisibility('visible');
        await vi.advanceTimersByTimeAsync(0);
        const callsAfterBlock = play.mock.calls.length;

        audioElement.dispatchEvent(new Event('pause'));
        for (let i = 0; i < 20; i++) {
          await vi.advanceTimersByTimeAsync(6000);
        }

        expect(play.mock.calls.length).toBe(callsAfterBlock);

        cleanup?.();
      });

      it('runs a pending restart on a tap while the context stays interrupted', async () => {
        await withSharedContext(async (setContextState) => {
          const { pause, cleanup } = bindPlayingAudioElement();
          dynascaleManager.keepAudioPlaybackUnlocked();

          setContextState('interrupted');
          await vi.advanceTimersByTimeAsync(5000);
          expect(pause).not.toHaveBeenCalled();

          document.dispatchEvent(new Event('click'));
          expect(pause).toHaveBeenCalledTimes(1);

          cleanup?.();
        });
      });

      it('restarts again when an interruption a tap restarted during really ends', async () => {
        await withSharedContext(async (setContextState) => {
          const { pause, cleanup } = bindPlayingAudioElement();
          dynascaleManager.keepAudioPlaybackUnlocked();

          setContextState('interrupted');
          document.dispatchEvent(new Event('click'));
          await vi.advanceTimersByTimeAsync(700);
          expect(pause).toHaveBeenCalledTimes(1);

          setContextState('running');
          await vi.advanceTimersByTimeAsync(1100);
          expect(pause).toHaveBeenCalledTimes(2);

          cleanup?.();
        });
      });

      it('plays the elements a restart paused when the unlock is released', async () => {
        await withSharedContext(async (setContextState) => {
          const { audioElement, play, pause, cleanup } =
            bindPlayingAudioElement();
          pause.mockImplementation(() => {
            // @ts-expect-error simulate the pause
            audioElement.paused = true;
          });
          dynascaleManager.keepAudioPlaybackUnlocked();
          setContextState('interrupted');
          setContextState('running');
          await vi.advanceTimersByTimeAsync(1050);
          expect(pause).toHaveBeenCalledTimes(1);
          play.mockClear();

          dynascaleManager.releaseAudioPlaybackUnlock();

          expect(play).toHaveBeenCalledTimes(1);

          cleanup?.();
        });
      });

      it('resumes the silent element after a restart was replaced and never ran', async () => {
        await withSharedContext(async (setContextState) => {
          const { cleanup } = bindPlayingAudioElement();
          dynascaleManager.keepAudioPlaybackUnlocked();
          const silent = document.querySelector<HTMLAudioElement>(
            'audio[data-stream-silent-audio]',
          )!;
          const silentPlay = vi.spyOn(silent, 'play').mockResolvedValue();

          setContextState('interrupted');
          setContextState('running');
          await vi.advanceTimersByTimeAsync(1050);
          setContextState('interrupted');
          setContextState('running');
          setContextState('interrupted');
          await vi.advanceTimersByTimeAsync(1100);
          expect(silentPlay).not.toHaveBeenCalled();

          setVisibility('hidden');
          setVisibility('visible');
          await vi.advanceTimersByTimeAsync(1000);

          expect(silentPlay).toHaveBeenCalledTimes(1);

          cleanup?.();
        });
      });

      it('does not restart a frozen audio context outside WebKit', async () => {
        await withSharedContext(async (_, context) => {
          globalThis._isWebKit = false;
          dynascaleManager.keepAudioPlaybackUnlocked();
          await vi.advanceTimersByTimeAsync(20000);
          expect(context.suspend).not.toHaveBeenCalled();
        });
      });

      it('does not restart a failing recovery on every tap', async () => {
        vi.useFakeTimers();
        setVisibility('visible');
        globalThis._isSafari = true;
        try {
          const { audioElement, play, cleanup } = bindPausedAudioElement();
          dynascaleManager.keepAudioPlaybackUnlocked();
          play.mockRejectedValue(new Error('playback failed'));
          await vi.advanceTimersByTimeAsync(0);
          audioElement.dispatchEvent(new Event('pause'));
          await vi.advanceTimersByTimeAsync(0);
          const callsBeforeTaps = play.mock.calls.length;

          for (let i = 0; i < 20; i++) {
            document.dispatchEvent(new Event('keydown'));
          }

          expect(play.mock.calls.length).toBe(callsBeforeTaps);

          cleanup?.();
        } finally {
          globalThis._isSafari = undefined;
        }
      });

      it('re-plays a paused element when the page becomes visible again', async () => {
        vi.useFakeTimers();
        setVisibility('visible');
        const { play, cleanup } = bindPausedAudioElement();
        play.mockResolvedValue();
        await vi.advanceTimersByTimeAsync(0);

        setVisibility('hidden');
        await vi.advanceTimersByTimeAsync(0);
        const callsWhileHidden = play.mock.calls.length;

        setVisibility('visible');
        await vi.advanceTimersByTimeAsync(1000);

        expect(play.mock.calls.length).toBe(callsWhileHidden + 1);

        cleanup?.();
      });

      it('does not apply a queued source change after the element is unbound', async () => {
        vi.useFakeTimers();
        setVisibility('visible');
        const audioElement = document.createElement('audio');
        Object.defineProperties(audioElement, {
          srcObject: { writable: true },
          paused: { writable: true, configurable: true },
          readyState: { writable: true, configurable: true },
        });
        // @ts-expect-error simulate paused, ready-to-play element
        audioElement.paused = true;
        // @ts-expect-error simulate paused, ready-to-play element
        audioElement.readyState = 4;
        const play = vi.spyOn(audioElement, 'play').mockResolvedValue();

        // @ts-expect-error incomplete data
        call.state.updateOrAddParticipant('session-id', {
          userId: 'user-id',
          sessionId: 'session-id',
          publishedTracks: [],
        });
        const cleanup = dynascaleManager.bindAudioElement(
          audioElement,
          'session-id',
          'audioTrack',
        );
        call.state.updateParticipant('session-id', {
          audioStream: new MediaStream(),
        });
        cleanup?.();
        await vi.runAllTimersAsync();

        expect(audioElement.srcObject).toBeNull();
        expect(play).not.toHaveBeenCalled();

        setVisibility('hidden');
        setVisibility('visible');
        await vi.advanceTimersByTimeAsync(0);
        expect(play).not.toHaveBeenCalled();
      });

      it('stops re-arming after the element is unbound', async () => {
        vi.useFakeTimers();
        setVisibility('visible');
        const { play, cleanup } = bindPausedAudioElement();
        play.mockResolvedValue();
        await vi.advanceTimersByTimeAsync(0);
        cleanup?.();
        const callsAfterCleanup = play.mock.calls.length;

        setVisibility('hidden');
        setVisibility('visible');
        await vi.advanceTimersByTimeAsync(0);

        expect(play.mock.calls.length).toBe(callsAfterCleanup);
      });
    });

    it('audio: no watchdog attached when useWebAudio is true', async () => {
      globalThis._isSafari = true;
      dynascaleManager.setUseWebAudio(true);

      vi.useFakeTimers();
      const audioElement = document.createElement('audio');
      Object.defineProperties(audioElement, {
        srcObject: { writable: true },
        paused: { writable: true, configurable: true },
        readyState: { writable: true, configurable: true },
      });
      // @ts-expect-error simulate paused, ready-to-play element
      audioElement.paused = true;
      // @ts-expect-error simulate paused, ready-to-play element
      audioElement.readyState = 4;
      const play = vi.spyOn(audioElement, 'play').mockResolvedValue();

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      const cleanup = dynascaleManager.bindAudioElement(
        audioElement,
        'session-id',
        'audioTrack',
      );

      call.state.updateParticipant('session-id', {
        audioStream: new MediaStream(),
      });
      vi.runAllTimers();

      audioElement.dispatchEvent(new Event('pause'));
      await vi.advanceTimersByTimeAsync(0);

      expect(play).not.toHaveBeenCalled();

      cleanup?.();
    });

    it('audio: watchdog defers to BlockedAudioTracker when element is blocked', async () => {
      vi.useFakeTimers();
      const audioElement = document.createElement('audio');
      Object.defineProperties(audioElement, {
        srcObject: { writable: true },
        paused: { writable: true, configurable: true },
        readyState: { writable: true, configurable: true },
      });
      // @ts-expect-error simulate paused, ready-to-play element
      audioElement.paused = true;
      // @ts-expect-error simulate paused, ready-to-play element
      audioElement.readyState = 4;
      const play = vi
        .spyOn(audioElement, 'play')
        .mockRejectedValue(new DOMException('', 'NotAllowedError'));

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      const cleanup = call.bindAudioElement(
        audioElement,
        'session-id',
        'audioTrack',
      );

      call.state.updateParticipant('session-id', {
        audioStream: new MediaStream(),
      });
      vi.runAllTimers();
      await vi.advanceTimersByTimeAsync(0);

      expect(call.blockedAudioTracker.isBlocked(audioElement)).toBe(true);

      play.mockClear();
      audioElement.dispatchEvent(new Event('pause'));
      await vi.advanceTimersByTimeAsync(60_000);

      expect(play).not.toHaveBeenCalled();

      cleanup?.();
    });

    it('video: should unsubscribe when element dimensions are zero', () => {
      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [TrackType.VIDEO],
        viewportVisibilityState: {
          videoTrack: VisibilityState.VISIBLE,
          screenShareTrack: VisibilityState.UNKNOWN,
        },
      });

      const updateSubscription = vi.spyOn(
        call.state,
        'updateParticipantTracks',
      );

      // @ts-expect-error simulate resize
      videoElement.clientHeight = 0;
      // @ts-expect-error simulate resize
      videoElement.clientWidth = 0;

      const cleanup = dynascaleManager.bindVideoElement(
        videoElement,
        'session-id',
        'videoTrack',
      );

      expect(updateSubscription).toHaveBeenCalledWith('videoTrack', {
        'session-id': { dimension: undefined },
      });

      cleanup?.();

      expect(updateSubscription).toHaveBeenLastCalledWith('videoTrack', {
        'session-id': { dimension: undefined },
      });
    });
  });
});

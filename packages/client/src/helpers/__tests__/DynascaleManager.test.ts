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
import { StreamVideoWriteableStateStore } from '../../store';
import { getCurrentValue } from '../../store/rxUtils';
import { VisibilityState } from '../../types';
import { noopComparator } from '../../sorting';
import { TrackType } from '../../gen/video/sfu/models/models';

describe('DynascaleManager', () => {
  let dynascaleManager: DynascaleManager;
  let call: Call;

  beforeEach(() => {
    call = new Call({
      id: 'id',
      type: 'default',
      streamClient: new StreamClient('api-key', {
        devicePersistence: { enabled: false },
      }),
      clientStore: new StreamVideoWriteableStateStore(),
    });
    call.setSortParticipantsBy(noopComparator());
    dynascaleManager = call.dynascaleManager;
  });

  afterEach(() => {
    call.leave();
  });

  describe('visibility tracking', () => {
    it('should track element visibility visibility', () => {
      let visibilityHandler: any;
      vi.spyOn(dynascaleManager.viewportTracker, 'observe').mockImplementation(
        (el, handler) => {
          visibilityHandler = handler;
          return vi.fn();
        },
      );

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      const element = document.createElement('div');
      const untrack = dynascaleManager.trackElementVisibility(
        element,
        'session-id',
        'videoTrack',
      );

      expect(visibilityHandler).toBeDefined();
      expect(dynascaleManager.viewportTracker.observe).toHaveBeenCalledWith(
        element,
        expect.any(Function),
      );

      // test becoming visible
      visibilityHandler({ isIntersecting: true });
      expect(
        call.state.findParticipantBySessionId('session-id')
          ?.viewportVisibilityState?.videoTrack,
      ).toBe(VisibilityState.VISIBLE);

      // test becoming invisible
      visibilityHandler({ isIntersecting: false });
      expect(
        call.state.findParticipantBySessionId('session-id')
          ?.viewportVisibilityState?.videoTrack,
      ).toBe(VisibilityState.INVISIBLE);

      // test track reset
      untrack();
      expect(
        call.state.findParticipantBySessionId('session-id')
          ?.viewportVisibilityState?.videoTrack,
      ).toBe(VisibilityState.UNKNOWN);
    });
  });

  describe('element binding', () => {
    let videoElement: globalThis.HTMLVideoElement;

    beforeEach(() => {
      // Mock global isSafari to false for testing
      globalThis._isSafari = false;
      vi.mock(import('../browsers'), async (importOriginal) => {
        const module = await importOriginal();
        return {
          ...module,
          isSafari: () => globalThis._isSafari ?? false,
        };
      });

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

    it('audio: Safari should use AudioContext for audio playback', () => {
      globalThis._isSafari = true;
      dynascaleManager.setUseWebAudio(true); // enabled by default on Safari

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
      expect(audioElement.setSinkId).toHaveBeenCalledWith(
        'different-device-id',
      );
      // @ts-expect-error sinkId isn't available in the TS definition
      expect(audioContext.sinkId).toBe('different-device-id');

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

    it('audio: should register and unregister watchdog binding', () => {
      const watchdog = call.audioBindingsWatchdog!;
      const registerSpy = vi.spyOn(watchdog, 'register');
      const unregisterSpy = vi.spyOn(watchdog, 'unregister');

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      const cleanup = call.bindAudioElement(
        document.createElement('audio'),
        'session-id',
        'audioTrack',
      );

      expect(registerSpy).toHaveBeenCalledWith(
        expect.any(HTMLAudioElement),
        'session-id',
        'audioTrack',
      );

      cleanup?.();

      expect(unregisterSpy).toHaveBeenCalledWith('session-id', 'audioTrack');
    });

    it('audio: should track blocked audio elements on NotAllowedError', async () => {
      vi.useFakeTimers();
      const audioElement = document.createElement('audio');
      Object.defineProperty(audioElement, 'srcObject', { writable: true });
      const notAllowedError = new DOMException('', 'NotAllowedError');
      vi.spyOn(audioElement, 'play').mockRejectedValue(notAllowedError);

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

      expect(getCurrentValue(call.audioHealthMonitor!.autoplayBlocked$)).toBe(
        true,
      );

      cleanup?.();
      expect(getCurrentValue(call.audioHealthMonitor!.autoplayBlocked$)).toBe(
        false,
      );
    });

    it('audio: should unblock audio elements on explicit resumeAudio call', async () => {
      vi.useFakeTimers();
      const audioElement = document.createElement('audio');
      Object.defineProperty(audioElement, 'srcObject', { writable: true });
      const playSpy = vi
        .spyOn(audioElement, 'play')
        .mockRejectedValueOnce(new DOMException('', 'NotAllowedError'))
        .mockResolvedValue(undefined);

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

      expect(getCurrentValue(call.audioHealthMonitor!.autoplayBlocked$)).toBe(
        true,
      );

      await call.audioHealthMonitor!.resumeMedia();
      await vi.advanceTimersByTimeAsync(0);

      expect(playSpy).toHaveBeenCalledTimes(2);
      expect(getCurrentValue(call.audioHealthMonitor!.autoplayBlocked$)).toBe(
        false,
      );

      cleanup?.();
    });

    it('audio: does not register a detached element if play() rejects after cleanup', async () => {
      vi.useFakeTimers();
      const audioElement = document.createElement('audio');
      Object.defineProperty(audioElement, 'srcObject', { writable: true });
      // Hold play()'s rejection until we explicitly trigger it, so cleanup
      // can run while the .catch handler is still pending.
      let rejectPlay!: (err: unknown) => void;
      vi.spyOn(audioElement, 'play').mockReturnValue(
        new Promise<void>((_, reject) => {
          rejectPlay = reject;
        }),
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

      // Tear down the binding before play() rejects.
      cleanup?.();

      // Now let play() reject. The .catch must NOT register the
      // already-detached element back into the blocked set.
      rejectPlay(new DOMException('', 'NotAllowedError'));
      await vi.advanceTimersByTimeAsync(0);

      expect(getCurrentValue(call.audioHealthMonitor!.autoplayBlocked$)).toBe(
        false,
      );
    });

    it('audio: should clear blocked state when the audio stream is removed', async () => {
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

      expect(getCurrentValue(call.audioHealthMonitor!.autoplayBlocked$)).toBe(
        true,
      );

      call.state.updateParticipant('session-id', {
        audioStream: undefined,
      });

      vi.runAllTimers();
      await vi.advanceTimersByTimeAsync(0);

      expect(audioElement.srcObject).toBeNull();
      expect(getCurrentValue(call.audioHealthMonitor!.autoplayBlocked$)).toBe(
        false,
      );

      cleanup?.();
    });

    it('audio: should warn when binding an already-bound session', () => {
      const watchdog = call.audioBindingsWatchdog!;
      // @ts-expect-error private property
      const warnSpy = vi.spyOn(watchdog.logger, 'warn');

      // @ts-expect-error incomplete data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      const audioElement1 = document.createElement('audio');
      const audioElement2 = document.createElement('audio');

      const cleanup1 = call.bindAudioElement(
        audioElement1,
        'session-id',
        'audioTrack',
      );

      const cleanup2 = call.bindAudioElement(
        audioElement2,
        'session-id',
        'audioTrack',
      );

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Audio element already bound'),
      );

      cleanup1?.();
      cleanup2?.();
    });

    it('video: forwards pause/play events to MediaHealthMonitor', () => {
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

      // Wire a real MediaStream into the participant so the bind's
      // streamSubscription assigns it to videoElement.srcObject. Then
      // mock getVideoTracks to report a live track, which is what the
      // pause-listener's benign-pause filter checks.
      const mediaStream = new MediaStream();
      vi.spyOn(mediaStream, 'getVideoTracks').mockReturnValue([
        { readyState: 'live' } as MediaStreamTrack,
      ]);
      call.state.updateParticipant('session-id', {
        publishedTracks: [TrackType.VIDEO],
        videoStream: mediaStream,
      });

      videoElement.dispatchEvent(new Event('pause'));
      expect(
        // @ts-expect-error private property
        call.audioHealthMonitor!.pausedVideo.elements.has(videoElement),
      ).toBe(true);

      videoElement.dispatchEvent(new Event('play'));
      expect(
        // @ts-expect-error private property
        call.audioHealthMonitor!.pausedVideo.elements.has(videoElement),
      ).toBe(false);

      cleanup?.();
    });

    it('video: filters benign pauses (no live tracks)', () => {
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

      // No videoStream on the participant - bind leaves srcObject null,
      // so the pause-listener's liveness check filters the event out.
      videoElement.dispatchEvent(new Event('pause'));
      expect(
        // @ts-expect-error private property
        call.audioHealthMonitor!.pausedVideo.elements.has(videoElement),
      ).toBe(false);

      cleanup?.();
    });

    it('video: cleanup detaches pause/play listeners and clears paused state', () => {
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
      vi.spyOn(mediaStream, 'getVideoTracks').mockReturnValue([
        { readyState: 'live' } as MediaStreamTrack,
      ]);
      call.state.updateParticipant('session-id', {
        publishedTracks: [TrackType.VIDEO],
        videoStream: mediaStream,
      });

      videoElement.dispatchEvent(new Event('pause'));
      expect(
        // @ts-expect-error private property
        call.audioHealthMonitor!.pausedVideo.elements.size,
      ).toBe(1);

      cleanup?.();

      // Cleanup must drop the element from the recovery set so a
      // still-paused unbound element doesn't keep the loop alive.
      expect(
        // @ts-expect-error private property
        call.audioHealthMonitor!.pausedVideo.elements.size,
      ).toBe(0);

      // Further pause events on the detached element are no-ops.
      videoElement.dispatchEvent(new Event('pause'));
      expect(
        // @ts-expect-error private property
        call.audioHealthMonitor!.pausedVideo.elements.size,
      ).toBe(0);
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

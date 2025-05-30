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
      streamClient: new StreamClient('api-key'),
      clientStore: new StreamVideoWriteableStateStore(),
    });
    call.setSortParticipantsBy(noopComparator());
    dynascaleManager = new DynascaleManager(call.state, call.speaker);
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

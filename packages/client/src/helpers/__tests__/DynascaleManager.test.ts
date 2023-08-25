/**
 * @vitest-environment happy-dom
 */

import '../../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DynascaleManager } from '../DynascaleManager';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { StreamVideoWriteableStateStore } from '../../store';
import { DebounceType, VisibilityState } from '../../types';
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
    dynascaleManager = new DynascaleManager(call);
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

      // @ts-ignore
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
      });

      const element = document.createElement('div');
      const untrack = dynascaleManager.trackElementVisibility(
        element,
        'session-id',
        'video',
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
          ?.viewportVisibilityState?.video,
      ).toBe(VisibilityState.VISIBLE);

      // test becoming invisible
      visibilityHandler({ isIntersecting: false });
      expect(
        call.state.findParticipantBySessionId('session-id')
          ?.viewportVisibilityState?.video,
      ).toBe(VisibilityState.INVISIBLE);

      // test track reset
      untrack();
      expect(
        call.state.findParticipantBySessionId('session-id')
          ?.viewportVisibilityState?.video,
      ).toBe(VisibilityState.UNKNOWN);
    });
  });

  describe('element binding', () => {
    let videoElement: globalThis.HTMLVideoElement;

    beforeEach(() => {
      videoElement = document.createElement('video');
      // @ts-ignore
      videoElement.clientWidth = 100;
      // @ts-ignore
      videoElement.clientHeight = 100;
    });

    it('should bind audio element', () => {
      vi.useFakeTimers();
      const audioElement = document.createElement('audio');
      const play = vi.spyOn(audioElement, 'play').mockResolvedValue();
      // @ts-expect-error setSinkId is not defined in types
      audioElement.setSinkId = vi.fn();

      // @ts-ignore
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
      });

      // @ts-ignore
      call.state.updateOrAddParticipant('session-id-local', {
        userId: 'user-id-local',
        sessionId: 'session-id-local',
        isLocalParticipant: true,
      });

      const cleanup = dynascaleManager.bindAudioElement(
        audioElement,
        'session-id',
      );
      expect(audioElement.autoplay).toBe(true);

      const mediaStream = new MediaStream();
      call.state.updateParticipant('session-id', {
        audioStream: mediaStream,
      });

      vi.runAllTimers();

      expect(play).toHaveBeenCalled();
      expect(audioElement.srcObject).toBe(mediaStream);

      call.state.updateParticipant('session-id-local', {
        audioOutputDeviceId: 'new-device-id',
      });

      // @ts-expect-error setSinkId is not defined in types
      expect(audioElement.setSinkId).toHaveBeenCalledWith('new-device-id');

      cleanup?.();
    });

    it('video: should update subscription when track becomes available', () => {
      const updateSubscription = vi.spyOn(call, 'updateSubscriptionsPartial');

      // @ts-ignore
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      const cleanup = dynascaleManager.bindVideoElement(
        videoElement,
        'session-id',
        'video',
      );

      expect(videoElement.autoplay).toBe(true);
      expect(videoElement.muted).toBe(true);
      expect(videoElement.playsInline).toBe(true);

      expect(updateSubscription).toHaveBeenCalledWith(
        'video',
        { 'session-id': { dimension: undefined } },
        DebounceType.IMMEDIATE,
      );

      call.state.updateParticipant('session-id', {
        publishedTracks: [TrackType.VIDEO],
      });

      expect(updateSubscription).toHaveBeenCalledWith(
        'video',
        {
          'session-id': {
            dimension: {
              width: videoElement.clientWidth,
              height: videoElement.clientHeight,
            },
          },
        },
        DebounceType.IMMEDIATE,
      );

      call.state.updateParticipant('session-id', {
        publishedTracks: [TrackType.VIDEO],
      });

      expect(updateSubscription).toHaveBeenCalledWith(
        'video',
        { 'session-id': { dimension: undefined } },
        DebounceType.IMMEDIATE,
      );

      cleanup?.();
    });

    it('video: should play video when track becomes available', () => {
      vi.useFakeTimers();

      const updateSubscription = vi.spyOn(call, 'updateSubscriptionsPartial');
      const play = vi.spyOn(videoElement, 'play').mockResolvedValue();

      // @ts-ignore
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
      });

      const cleanup = dynascaleManager.bindVideoElement(
        videoElement,
        'session-id',
        'video',
      );

      const mediaStream = new MediaStream();
      call.state.updateParticipant('session-id', {
        publishedTracks: [TrackType.VIDEO],
        videoStream: mediaStream,
      });

      vi.runAllTimers();

      expect(updateSubscription).toHaveBeenCalledWith(
        'video',
        {
          'session-id': {
            dimension: {
              width: videoElement.clientWidth,
              height: videoElement.clientHeight,
            },
          },
        },
        DebounceType.IMMEDIATE,
      );
      expect(play).toHaveBeenCalled();
      expect(videoElement.srcObject).toBe(mediaStream);

      cleanup?.();
    });

    it('video: should update subscription when element becomes visible', () => {
      // @ts-ignore
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [],
        viewportVisibilityState: {
          video: VisibilityState.UNKNOWN,
          screen: VisibilityState.UNKNOWN,
        },
      });

      const updateSubscription = vi.spyOn(call, 'updateSubscriptionsPartial');

      const cleanup = dynascaleManager.bindVideoElement(
        videoElement,
        'session-id',
        'video',
      );

      expect(updateSubscription).toHaveBeenCalledWith(
        'video',
        { 'session-id': { dimension: undefined } },
        DebounceType.IMMEDIATE,
      );

      call.state.updateParticipant('session-id', {
        viewportVisibilityState: {
          video: VisibilityState.VISIBLE,
          screen: VisibilityState.UNKNOWN,
        },
      });

      expect(updateSubscription).toHaveBeenCalledWith(
        'video',
        {
          'session-id': {
            dimension: {
              width: videoElement.clientWidth,
              height: videoElement.clientHeight,
            },
          },
        },
        DebounceType.MEDIUM,
      );

      call.state.updateParticipant('session-id', {
        viewportVisibilityState: {
          video: VisibilityState.INVISIBLE,
          screen: VisibilityState.UNKNOWN,
        },
      });

      expect(updateSubscription).toHaveBeenCalledWith(
        'video',
        { 'session-id': { dimension: undefined } },
        DebounceType.MEDIUM,
      );

      call.state.updateParticipant('session-id', {
        viewportVisibilityState: {
          video: VisibilityState.UNKNOWN,
          screen: VisibilityState.UNKNOWN,
        },
      });

      expect(updateSubscription).toHaveBeenCalledWith(
        'video',
        {
          'session-id': {
            dimension: {
              width: videoElement.clientWidth,
              height: videoElement.clientHeight,
            },
          },
        },
        DebounceType.MEDIUM,
      );

      cleanup?.();
    });

    it('video: should update subscription when element resizes', () => {
      // @ts-ignore
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [TrackType.VIDEO],
        viewportVisibilityState: {
          video: VisibilityState.VISIBLE,
          screen: VisibilityState.UNKNOWN,
        },
      });

      let updateSubscription = vi.spyOn(call, 'updateSubscriptionsPartial');

      let resizeObserverCallback: ResizeObserverCallback;
      window.ResizeObserver = class ResizeObserver {
        observe = vi.fn().mockImplementation(() => {
          // @ts-ignore simulate initial trigger
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
        'video',
      );

      expect(updateSubscription).toHaveBeenCalledWith(
        'video',
        {
          'session-id': {
            dimension: {
              width: videoElement.clientWidth,
              height: videoElement.clientHeight,
            },
          },
        },
        DebounceType.IMMEDIATE,
      );

      // @ts-ignore simulate resize
      videoElement.clientHeight = 101;
      // @ts-ignore simulate resize
      videoElement.clientWidth = 101;

      // @ts-ignore simulate resize
      resizeObserverCallback();

      expect(updateSubscription).toHaveBeenCalledWith(
        'video',
        { 'session-id': { dimension: { width: 101, height: 101 } } },
        DebounceType.SLOW,
      );

      cleanup?.();
    });
  });
});

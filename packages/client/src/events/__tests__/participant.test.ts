import '../../rtc/__tests__/mocks/webrtc.mocks';
import { describe, expect, it, vi } from 'vitest';
import { CallState } from '../../store';
import { VisibilityState } from '../../types';
import { TrackType } from '../../gen/video/sfu/models/models';
import { noopComparator } from '../../sorting';
import {
  watchParticipantJoined,
  watchParticipantLeft,
  watchParticipantUpdated,
  watchTrackPublished,
  watchTrackUnpublished,
} from '../participant';

describe('Participant events', () => {
  describe('participantJoined / participantLeft / participantUpdated', () => {
    it('adds and removes the participant to the list of participants', () => {
      const state = new CallState();
      state.setSortParticipantsBy(noopComparator());

      const onParticipantJoined = watchParticipantJoined(state);
      const onParticipantLeft = watchParticipantLeft(state);
      const onParticipantUpdated = watchParticipantUpdated(state);

      onParticipantJoined({
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
          roles: ['user'],
        },
      });

      expect(state.participants).toEqual([
        {
          userId: 'user-id',
          sessionId: 'session-id',
          roles: ['user'],
          viewportVisibilityState: {
            videoTrack: VisibilityState.UNKNOWN,
            screenShareTrack: VisibilityState.UNKNOWN,
          },
        },
      ]);

      onParticipantUpdated({
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
          roles: ['host'],
        },
      });

      expect(state.participants).toEqual([
        {
          userId: 'user-id',
          sessionId: 'session-id',
          roles: ['host'],
          viewportVisibilityState: {
            videoTrack: VisibilityState.UNKNOWN,
            screenShareTrack: VisibilityState.UNKNOWN,
          },
        },
      ]);

      onParticipantLeft({
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
        },
      });

      expect(state.participants).toEqual([]);
    });

    it('sets a server-side pin when isPinned is true', () => {
      const state = new CallState();
      state.setSortParticipantsBy(noopComparator());

      const onParticipantJoined = watchParticipantJoined(state);
      const now = Date.now();

      onParticipantJoined({
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
        },
        isPinned: true,
      });

      const participant = state.findParticipantBySessionId('session-id');
      expect(participant?.pin).toBeDefined();
      expect(participant?.pin?.isLocalPin).toBe(false);
      expect(participant?.pin?.pinnedAt).toBeGreaterThanOrEqual(now);
    });

    it('does not set a pin when isPinned is false', () => {
      const state = new CallState();
      state.setSortParticipantsBy(noopComparator());

      const onParticipantJoined = watchParticipantJoined(state);

      onParticipantJoined({
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
        },
        isPinned: false,
      });

      const participant = state.findParticipantBySessionId('session-id');
      expect(participant?.pin).toBeUndefined();
    });
  });

  describe('orphaned tracks reconciliation', () => {
    it('participantJoined should reconcile orphaned tracks if any', () => {
      const state = new CallState();
      const mediaStream = new MediaStream();
      state.registerOrphanedTrack({
        trackLookupPrefix: 'track-lookup-prefix',
        trackType: TrackType.VIDEO,
        track: mediaStream,
        id: mediaStream.id,
      });
      const onParticipantJoined = watchParticipantJoined(state);
      onParticipantJoined({
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
          trackLookupPrefix: 'track-lookup-prefix',
        },
      });

      const p = state.findParticipantBySessionId('session-id');
      expect(p).toBeDefined();
      expect(p?.videoStream).toBe(mediaStream);
      expect(state.takeOrphanedTracks('track-lookup-prefix')).toHaveLength(0);
    });

    it('trackPublished should reconcile orphaned tracks if any', () => {
      const state = new CallState();
      const mediaStream = new MediaStream();
      state.registerOrphanedTrack({
        trackLookupPrefix: 'track-lookup-prefix',
        trackType: TrackType.AUDIO,
        track: mediaStream,
        id: mediaStream.id,
      });
      const onTrackPublished = watchTrackPublished(state);
      onTrackPublished({
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
          trackLookupPrefix: 'track-lookup-prefix',
        },
      });

      const p = state.findParticipantBySessionId('session-id');
      expect(p).toBeDefined();
      expect(p?.audioStream).toBe(mediaStream);
      expect(state.takeOrphanedTracks('track-lookup-prefix')).toHaveLength(0);
    });

    it('trackUnpublished should reconcile orphaned tracks if any', () => {
      const state = new CallState();
      const mediaStream = new MediaStream();
      state.registerOrphanedTrack({
        trackLookupPrefix: 'track-lookup-prefix',
        trackType: TrackType.SCREEN_SHARE,
        track: mediaStream,
        id: mediaStream.id,
      });
      const onTrackUnPublished = watchTrackUnpublished(state);
      onTrackUnPublished({
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
          trackLookupPrefix: 'track-lookup-prefix',
        },
      });

      const p = state.findParticipantBySessionId('session-id');
      expect(p).toBeDefined();
      expect(p?.screenShareStream).toBe(mediaStream);
      expect(state.takeOrphanedTracks('track-lookup-prefix')).toHaveLength(0);
    });

    it('participantJoined should attach E2EE decryptor to orphaned track receiver', () => {
      const state = new CallState();
      const mediaStream = new MediaStream();
      const receiver = {} as RTCRtpReceiver;
      const e2ee = { decrypt: vi.fn() };
      state.registerOrphanedTrack({
        trackLookupPrefix: 'track-lookup-prefix',
        trackType: TrackType.VIDEO,
        track: mediaStream,
        id: mediaStream.id,
        receiver,
      });
      // @ts-expect-error partial mock
      const onParticipantJoined = watchParticipantJoined(state, e2ee);
      onParticipantJoined({
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
          trackLookupPrefix: 'track-lookup-prefix',
        },
      });

      expect(e2ee.decrypt).toHaveBeenCalledWith(receiver, 'user-id');
    });

    it('trackPublished should attach E2EE decryptor to orphaned track receiver', () => {
      const state = new CallState();
      const mediaStream = new MediaStream();
      const receiver = {} as RTCRtpReceiver;
      const e2ee = { decrypt: vi.fn() };
      state.registerOrphanedTrack({
        trackLookupPrefix: 'track-lookup-prefix',
        trackType: TrackType.AUDIO,
        track: mediaStream,
        id: mediaStream.id,
        receiver,
      });
      // @ts-expect-error partial mock
      const onTrackPublished = watchTrackPublished(state, e2ee);
      onTrackPublished({
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
          trackLookupPrefix: 'track-lookup-prefix',
        },
      });

      expect(e2ee.decrypt).toHaveBeenCalledWith(receiver, 'user-id');
    });

    it('trackUnpublished should attach E2EE decryptor to orphaned track receiver', () => {
      const state = new CallState();
      const mediaStream = new MediaStream();
      const receiver = {} as RTCRtpReceiver;
      const e2ee = { decrypt: vi.fn() };
      state.registerOrphanedTrack({
        trackLookupPrefix: 'track-lookup-prefix',
        trackType: TrackType.SCREEN_SHARE,
        track: mediaStream,
        id: mediaStream.id,
        receiver,
      });
      // @ts-expect-error partial mock
      const onTrackUnPublished = watchTrackUnpublished(state, e2ee);
      onTrackUnPublished({
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
          trackLookupPrefix: 'track-lookup-prefix',
        },
      });

      expect(e2ee.decrypt).toHaveBeenCalledWith(receiver, 'user-id');
    });

    it('should not call decrypt when no E2EE manager is provided', () => {
      const state = new CallState();
      const mediaStream = new MediaStream();
      const receiver = {} as RTCRtpReceiver;
      state.registerOrphanedTrack({
        trackLookupPrefix: 'track-lookup-prefix',
        trackType: TrackType.VIDEO,
        track: mediaStream,
        id: mediaStream.id,
        receiver,
      });
      const onParticipantJoined = watchParticipantJoined(state);
      onParticipantJoined({
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
          trackLookupPrefix: 'track-lookup-prefix',
        },
      });

      const p = state.findParticipantBySessionId('session-id');
      expect(p?.videoStream).toBe(mediaStream);
    });

    it('should not call decrypt when orphaned track has no receiver', () => {
      const state = new CallState();
      const mediaStream = new MediaStream();
      const e2ee = { decrypt: vi.fn() };
      state.registerOrphanedTrack({
        trackLookupPrefix: 'track-lookup-prefix',
        trackType: TrackType.VIDEO,
        track: mediaStream,
        id: mediaStream.id,
      });
      // @ts-expect-error partial mock
      const onParticipantJoined = watchParticipantJoined(state, e2ee);
      onParticipantJoined({
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
          trackLookupPrefix: 'track-lookup-prefix',
        },
      });

      expect(e2ee.decrypt).not.toHaveBeenCalled();
      const p = state.findParticipantBySessionId('session-id');
      expect(p?.videoStream).toBe(mediaStream);
    });
  });

  describe('trackPublished', () => {
    it('updates the participant track list', () => {
      const state = new CallState();
      const handler = watchTrackPublished(state);

      // @ts-expect-error setup one participant
      state.setParticipants([{ sessionId: 'session-id', publishedTracks: [] }]);

      // @ts-expect-error incomplete data
      handler({
        sessionId: 'session-id',
        type: TrackType.VIDEO,
      });

      expect(state.findParticipantBySessionId('session-id')).toEqual({
        sessionId: 'session-id',
        publishedTracks: [TrackType.VIDEO],
      });
    });

    it('adds the participant to the list of participants if provided', () => {
      const state = new CallState();
      const handler = watchTrackPublished(state);

      handler({
        sessionId: 'session-id',
        type: TrackType.VIDEO,
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
          publishedTracks: [TrackType.VIDEO],
        },
      });

      expect(state.findParticipantBySessionId('session-id')).toEqual({
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [TrackType.VIDEO],
      });
    });

    it('updates the participant info if the provided participant already exists', () => {
      const state = new CallState();
      const handler = watchTrackPublished(state);

      state.setParticipants([
        // @ts-expect-error setup one participant
        {
          sessionId: 'session-id',
          publishedTracks: [],
          screenShareDimension: { width: 100, height: 100 },
        },
      ]);

      handler({
        sessionId: 'session-id',
        type: TrackType.VIDEO,
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
          publishedTracks: [TrackType.VIDEO, TrackType.AUDIO],
        },
      });

      expect(state.findParticipantBySessionId('session-id')).toEqual({
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [TrackType.VIDEO, TrackType.AUDIO],
        screenShareDimension: { width: 100, height: 100 },
      });
    });
  });

  describe('trackUnpublished', () => {
    it('updates the participant track list', () => {
      const state = new CallState();
      const handler = watchTrackUnpublished(state);

      state.setParticipants([
        // @ts-expect-error setup one participant
        { sessionId: 'session-id', publishedTracks: [TrackType.VIDEO] },
      ]);

      // @ts-expect-error incomplete data
      handler({ sessionId: 'session-id', type: TrackType.VIDEO });

      expect(state.findParticipantBySessionId('session-id')).toEqual({
        sessionId: 'session-id',
        publishedTracks: [],
      });
    });

    it('resets the paused track list if the track is unpublished', () => {
      const state = new CallState();
      state.setParticipants([
        // @ts-expect-error setup one participant
        {
          sessionId: 'session-id',
          publishedTracks: [TrackType.VIDEO, TrackType.SCREEN_SHARE],
          pausedTracks: [TrackType.VIDEO, TrackType.SCREEN_SHARE],
        },
      ]);

      const trackUnpublish = watchTrackUnpublished(state);
      // @ts-expect-error incomplete data
      trackUnpublish({ sessionId: 'session-id', type: TrackType.VIDEO });
      expect(state.findParticipantBySessionId('session-id')).toEqual({
        sessionId: 'session-id',
        publishedTracks: [TrackType.SCREEN_SHARE],
        pausedTracks: [TrackType.SCREEN_SHARE],
      });

      // @ts-expect-error incomplete data
      trackUnpublish({ sessionId: 'session-id', type: TrackType.SCREEN_SHARE });
      expect(state.findParticipantBySessionId('session-id')).toEqual({
        sessionId: 'session-id',
        publishedTracks: [],
        pausedTracks: [],
      });
    });

    it('resets the paused track list if the track is unpublished on full participant update', () => {
      const state = new CallState();
      state.setParticipants([
        // @ts-expect-error setup one participant
        {
          sessionId: 'session-id',
          publishedTracks: [TrackType.VIDEO, TrackType.SCREEN_SHARE],
          pausedTracks: [TrackType.VIDEO, TrackType.SCREEN_SHARE],
        },
      ]);

      const trackUnpublished = watchTrackUnpublished(state);
      trackUnpublished({
        sessionId: 'session-id',
        type: TrackType.VIDEO,
        // @ts-expect-error incomplete data
        participant: { publishedTracks: [TrackType.SCREEN_SHARE] },
      });
      expect(state.findParticipantBySessionId('session-id')).toEqual({
        sessionId: 'session-id',
        publishedTracks: [TrackType.SCREEN_SHARE],
        pausedTracks: [TrackType.SCREEN_SHARE],
      });

      trackUnpublished({
        sessionId: 'session-id',
        type: TrackType.SCREEN_SHARE,
        // @ts-expect-error incomplete data
        participant: { publishedTracks: [] },
      });
      expect(state.findParticipantBySessionId('session-id')).toEqual({
        sessionId: 'session-id',
        publishedTracks: [],
        pausedTracks: [],
      });
    });

    it('adds the participant to the list of participants if provided', () => {
      const state = new CallState();
      const handler = watchTrackUnpublished(state);

      handler({
        sessionId: 'session-id',
        type: TrackType.AUDIO,
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
          publishedTracks: [TrackType.VIDEO, TrackType.SCREEN_SHARE],
        },
      });

      expect(state.findParticipantBySessionId('session-id')).toEqual({
        userId: 'user-id',
        sessionId: 'session-id',
        publishedTracks: [TrackType.VIDEO, TrackType.SCREEN_SHARE],
      });
    });

    it('updates the participant info if the provided participant already exists', () => {
      const state = new CallState();
      const handler = watchTrackUnpublished(state);

      state.setParticipants([
        // @ts-expect-error setup one participant
        {
          userId: 'user-id',
          sessionId: 'session-id',
          publishedTracks: [TrackType.AUDIO, TrackType.VIDEO],
          videoDimension: { width: 10, height: 10 },
        },
      ]);

      handler({
        sessionId: 'session-id',
        type: TrackType.AUDIO,
        // @ts-expect-error incomplete data
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
          trackLookupPrefix: 'track-lookup-prefix',
          publishedTracks: [TrackType.VIDEO],
        },
      });

      expect(state.findParticipantBySessionId('session-id')).toEqual({
        userId: 'user-id',
        sessionId: 'session-id',
        trackLookupPrefix: 'track-lookup-prefix',
        publishedTracks: [TrackType.VIDEO],
        videoDimension: { width: 10, height: 10 },
      });
    });
  });
});

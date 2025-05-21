import '../../rtc/__tests__/mocks/webrtc.mocks';
import { describe, expect, it } from 'vitest';
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

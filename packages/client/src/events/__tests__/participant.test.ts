import { describe, expect, it } from 'vitest';
import { CallState } from '../../store';
import { VisibilityState } from '../../types';
import { TrackType } from '../../gen/video/sfu/models/models';
import {
  watchParticipantJoined,
  watchParticipantLeft,
  watchTrackPublished,
  watchTrackUnpublished,
} from '../participant';

describe('Participant events', () => {
  describe('participantJoined / participantLeft', () => {
    it('adds and removes the participant to the list of participants', () => {
      const state = new CallState();

      const onParticipantJoined = watchParticipantJoined(state);
      const onParticipantLeft = watchParticipantLeft(state);

      onParticipantJoined({
        // @ts-ignore
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
        },
      });

      expect(state.participants).toEqual([
        {
          userId: 'user-id',
          sessionId: 'session-id',
          viewportVisibilityState: {
            videoTrack: VisibilityState.UNKNOWN,
            screenShareTrack: VisibilityState.UNKNOWN,
          },
        },
      ]);

      onParticipantLeft({
        // @ts-ignore
        participant: {
          userId: 'user-id',
          sessionId: 'session-id',
        },
      });

      expect(state.participants).toEqual([]);
    });
  });

  describe('trackPublished', () => {
    it('updates the participant track list', () => {
      const state = new CallState();
      const handler = watchTrackPublished(state);

      // @ts-ignore setup one participant
      state.setParticipants([{ sessionId: 'session-id', publishedTracks: [] }]);

      // @ts-ignore
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

      // @ts-ignore
      handler({
        sessionId: 'session-id',
        type: TrackType.VIDEO,
        // @ts-ignore
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
        // @ts-ignore setup one participant
        {
          sessionId: 'session-id',
          publishedTracks: [],
          screenShareDimension: { width: 100, height: 100 },
        },
      ]);

      // @ts-ignore
      handler({
        sessionId: 'session-id',
        type: TrackType.VIDEO,
        // @ts-ignore
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
        // @ts-ignore setup one participant
        { sessionId: 'session-id', publishedTracks: [TrackType.VIDEO] },
      ]);

      // @ts-ignore
      handler({
        sessionId: 'session-id',
        type: TrackType.VIDEO,
      });

      expect(state.findParticipantBySessionId('session-id')).toEqual({
        sessionId: 'session-id',
        publishedTracks: [],
      });
    });

    it('adds the participant to the list of participants if provided', () => {
      const state = new CallState();
      const handler = watchTrackUnpublished(state);

      // @ts-ignore
      handler({
        sessionId: 'session-id',
        type: TrackType.AUDIO,
        // @ts-ignore
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
        // @ts-ignore setup one participant
        {
          userId: 'user-id',
          sessionId: 'session-id',
          publishedTracks: [TrackType.AUDIO, TrackType.VIDEO],
          videoDimension: { width: 10, height: 10 },
        },
      ]);

      // @ts-ignore
      handler({
        sessionId: 'session-id',
        type: TrackType.AUDIO,
        // @ts-ignore
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

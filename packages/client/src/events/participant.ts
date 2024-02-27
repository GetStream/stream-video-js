import type {
  ParticipantJoined,
  ParticipantLeft,
  TrackPublished,
  TrackUnpublished,
} from '../gen/video/sfu/event/events';
import { StreamVideoParticipant, VisibilityState } from '../types';
import { CallState } from '../store';

/**
 * An event responder which handles the `participantJoined` event.
 */
export const watchParticipantJoined = (state: CallState) => {
  return function onParticipantJoined(e: ParticipantJoined) {
    const { participant } = e;
    if (!participant) return;
    // `state.updateOrAddParticipant` acts as a safeguard against
    // potential duplicate events from the SFU.
    //
    // Although the SFU should not send duplicate events, we have seen
    // some race conditions in the past during the `join-flow` where
    // the SFU would send participant info as part of the `join`
    // response and then follow up with a `participantJoined` event for
    // already announced participants.
    state.updateOrAddParticipant(
      participant.sessionId,
      Object.assign<StreamVideoParticipant, Partial<StreamVideoParticipant>>(
        participant,
        {
          viewportVisibilityState: {
            videoTrack: VisibilityState.UNKNOWN,
            screenShareTrack: VisibilityState.UNKNOWN,
          },
        },
      ),
    );
  };
};

/**
 * An event responder which handles the `participantLeft` event.
 */
export const watchParticipantLeft = (state: CallState) => {
  return function onParticipantLeft(e: ParticipantLeft) {
    const { participant } = e;
    if (!participant) return;

    state.setParticipants((participants) =>
      participants.filter((p) => p.sessionId !== participant.sessionId),
    );
  };
};

/**
 * An event responder which handles the `trackPublished` event.
 * The SFU will send this event when a participant publishes a track.
 */
export const watchTrackPublished = (state: CallState) => {
  return function onTrackPublished(e: TrackPublished) {
    const { type, sessionId, participant } = e;
    // An optimization for large calls.
    // After a certain threshold, the SFU would stop emitting `participantJoined`
    // events, and instead, it would only provide the participant's information
    // once they start publishing a track.
    if (participant) {
      state.updateOrAddParticipant(sessionId, participant);
    } else {
      state.updateParticipant(sessionId, (p) => ({
        publishedTracks: [...p.publishedTracks, type].filter(unique),
      }));
    }
  };
};

/**
 * An event responder which handles the `trackUnpublished` event.
 * The SFU will send this event when a participant unpublishes a track.
 */
export const watchTrackUnpublished = (state: CallState) => {
  return function onTrackUnpublished(e: TrackUnpublished) {
    const { type, sessionId, participant } = e;
    // An optimization for large calls. See `watchTrackPublished`.
    if (participant) {
      state.updateOrAddParticipant(sessionId, participant);
    } else {
      state.updateParticipant(sessionId, (p) => ({
        publishedTracks: p.publishedTracks.filter((t) => t !== type),
      }));
    }
  };
};

const unique = <T>(v: T, i: number, arr: T[]) => arr.indexOf(v) === i;

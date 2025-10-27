import type {
  ParticipantJoined,
  ParticipantLeft,
  ParticipantUpdated,
  TrackPublished,
  TrackUnpublished,
} from '../gen/video/sfu/event/events';
import type { Participant } from '../gen/video/sfu/models/models';
import {
  StreamVideoParticipant,
  StreamVideoParticipantPatch,
  VisibilityState,
} from '../types';
import { CallState } from '../store';
import { trackTypeToParticipantStreamKey } from '../rtc';
import { pushToIfMissing } from '../helpers/array';

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
    // some race conditions in the past during the `join-flow`.
    // The SFU would send participant info as part of the `join`
    // response and then follow up with a `participantJoined` event for
    // already announced participants.
    const orphanedTracks = reconcileOrphanedTracks(state, participant);
    state.updateOrAddParticipant(
      participant.sessionId,
      Object.assign<
        StreamVideoParticipant,
        StreamVideoParticipantPatch | undefined,
        Partial<StreamVideoParticipant>
      >(participant, orphanedTracks, {
        viewportVisibilityState: {
          videoTrack: VisibilityState.UNKNOWN,
          screenShareTrack: VisibilityState.UNKNOWN,
        },
      }),
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
 * An event responder which handles the `participantUpdated` event.
 */
export const watchParticipantUpdated = (state: CallState) => {
  return function onParticipantUpdated(e: ParticipantUpdated) {
    const { participant } = e;
    if (!participant) return;
    state.updateParticipant(participant.sessionId, participant);
  };
};

/**
 * An event responder which handles the `trackPublished` event.
 * The SFU will send this event when a participant publishes a track.
 */
export const watchTrackPublished = (state: CallState) => {
  return function onTrackPublished(e: TrackPublished) {
    const { type, sessionId } = e;
    // An optimization for large calls.
    // After a certain threshold, the SFU would stop emitting `participantJoined`
    // events, and instead, it would only provide the participant's information
    // once they start publishing a track.
    if (e.participant) {
      const orphanedTracks = reconcileOrphanedTracks(state, e.participant);
      const participant = Object.assign(e.participant, orphanedTracks);
      state.updateOrAddParticipant(sessionId, participant);
    } else {
      state.updateParticipant(sessionId, (p) => ({
        publishedTracks: pushToIfMissing([...p.publishedTracks], type),
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
    const { type, sessionId } = e;
    // An optimization for large calls. See `watchTrackPublished`.
    if (e.participant) {
      const orphanedTracks = reconcileOrphanedTracks(state, e.participant);
      const participant = Object.assign(e.participant, orphanedTracks);
      state.updateOrAddParticipant(sessionId, participant, (p) => ({
        pausedTracks: p.pausedTracks?.filter((t) => t !== type),
      }));
    } else {
      state.updateParticipant(sessionId, (p) => ({
        publishedTracks: p.publishedTracks.filter((t) => t !== type),
        pausedTracks: p.pausedTracks?.filter((t) => t !== type),
      }));
    }
  };
};

/**
 * Reconciles orphaned tracks (if any) for the given participant.
 *
 * @param state the call state.
 * @param participant the participant.
 */
const reconcileOrphanedTracks = (
  state: CallState,
  participant: Participant,
): StreamVideoParticipantPatch | undefined => {
  const orphanTracks = state.takeOrphanedTracks(participant.trackLookupPrefix);
  if (!orphanTracks.length) return;
  const reconciledTracks: StreamVideoParticipantPatch = {};
  for (const orphan of orphanTracks) {
    const key = trackTypeToParticipantStreamKey(orphan.trackType);
    if (!key) continue;
    reconciledTracks[key] = orphan.track;
  }
  return reconciledTracks;
};

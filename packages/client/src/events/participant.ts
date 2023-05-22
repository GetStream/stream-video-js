import { Dispatcher } from '../rtc';
import { VisibilityState } from '../types';
import { CallState } from '../store';

/**
 * An event responder which handles the `participantJoined` event.
 */
export const watchParticipantJoined = (
  dispatcher: Dispatcher,
  state: CallState,
) => {
  return dispatcher.on('participantJoined', (e) => {
    if (e.eventPayload.oneofKind !== 'participantJoined') return;
    const { participant } = e.eventPayload.participantJoined;
    if (!participant) return;
    state.setParticipants((participants) => [
      ...participants,
      { ...participant, viewportVisibilityState: VisibilityState.UNKNOWN },
    ]);
  });
};

/**
 * An event responder which handles the `participantLeft` event.
 */
export const watchParticipantLeft = (
  dispatcher: Dispatcher,
  state: CallState,
) => {
  return dispatcher.on('participantLeft', (e) => {
    if (e.eventPayload.oneofKind !== 'participantLeft') return;
    const { participant } = e.eventPayload.participantLeft;
    if (!participant) return;

    state.setParticipants((participants) =>
      participants.filter((p) => p.sessionId !== participant.sessionId),
    );
  });
};

/**
 * An event responder which handles the `trackPublished` event.
 * The SFU will send this event when a participant publishes a track.
 */
export const watchTrackPublished = (
  dispatcher: Dispatcher,
  state: CallState,
) => {
  return dispatcher.on('trackPublished', (e) => {
    if (e.eventPayload.oneofKind !== 'trackPublished') return;
    const {
      trackPublished: { type, sessionId, participant },
    } = e.eventPayload;

    // An optimization for large calls.
    // After a certain threshold, the SFU would stop emitting `participantJoined`
    // events, and instead, it would only provide the participant's information
    // once they start publishing a track.
    if (participant) {
      state.updateOrAddParticipant(participant.sessionId, participant);
    } else {
      state.updateParticipant(sessionId, (p) => ({
        publishedTracks: [...p.publishedTracks, type].filter(unique),
      }));
    }
  });
};

/**
 * An event responder which handles the `trackUnpublished` event.
 * The SFU will send this event when a participant unpublishes a track.
 */
export const watchTrackUnpublished = (
  dispatcher: Dispatcher,
  state: CallState,
) => {
  return dispatcher.on('trackUnpublished', (e) => {
    if (e.eventPayload.oneofKind !== 'trackUnpublished') return;
    const {
      trackUnpublished: { type, sessionId, participant },
    } = e.eventPayload;

    // An optimization for large calls. See `watchTrackPublished`.
    if (participant) {
      state.updateOrAddParticipant(participant.sessionId, participant);
    } else {
      state.updateParticipant(sessionId, (p) => ({
        publishedTracks: p.publishedTracks.filter((t) => t !== type),
      }));
    }
  });
};

const unique = <T>(v: T, i: number, arr: T[]) => arr.indexOf(v) === i;

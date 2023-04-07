import { Dispatcher } from '../rtc/Dispatcher';
import { VisibilityState } from '../rtc/types';
import { CallState } from '../store';

/**
 * An event responder which handles the `participantJoined` event.
 */
export const watchParticipantJoined = (
  dispatcher: Dispatcher,
  store: CallState,
) => {
  return dispatcher.on('participantJoined', (e) => {
    if (e.eventPayload.oneofKind !== 'participantJoined') return;
    const { participant } = e.eventPayload.participantJoined;
    if (!participant) return;
    store.participants = [
      ...store.participants,
      { ...participant, viewportVisibilityState: VisibilityState.UNKNOWN },
    ];
  });
};

/**
 * An event responder which handles the `participantLeft` event.
 */
export const watchParticipantLeft = (
  dispatcher: Dispatcher,
  store: CallState,
) => {
  return dispatcher.on('participantLeft', (e) => {
    if (e.eventPayload.oneofKind !== 'participantLeft') return;
    const { participant } = e.eventPayload.participantLeft;
    if (!participant) return;

    // FIXME OL: sort out the active call
    // const activeCall = store.getCurrentValue(store.activeCallSubject);
    // if (callCid !== activeCall?.data.call.cid) {
    //   console.warn('Received participantLeft notification for a unknown call');
    //   return;
    // }

    store.participants = store.participants.filter(
      (p) => p.sessionId !== participant.sessionId,
    );
  });
};

/**
 * An event responder which handles the `trackPublished` event.
 * The SFU will send this event when a participant publishes a track.
 */
export const watchTrackPublished = (
  dispatcher: Dispatcher,
  store: CallState,
) => {
  return dispatcher.on('trackPublished', (e) => {
    if (e.eventPayload.oneofKind !== 'trackPublished') return;
    const {
      trackPublished: { type, sessionId },
    } = e.eventPayload;
    store.updateParticipant(sessionId, (p) => ({
      publishedTracks: [...p.publishedTracks, type].filter(unique),
    }));
  });
};

/**
 * An event responder which handles the `trackUnpublished` event.
 * The SFU will send this event when a participant unpublishes a track.
 */
export const watchTrackUnpublished = (
  dispatcher: Dispatcher,
  store: CallState,
) => {
  return dispatcher.on('trackUnpublished', (e) => {
    if (e.eventPayload.oneofKind !== 'trackUnpublished') return;
    const {
      trackUnpublished: { type, sessionId },
    } = e.eventPayload;
    store.updateParticipant(sessionId, (p) => ({
      publishedTracks: p.publishedTracks.filter((t) => t !== type),
    }));
  });
};

const unique = <T>(v: T, i: number, arr: T[]) => arr.indexOf(v) === i;

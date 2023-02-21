import { Dispatcher } from '../rtc/Dispatcher';
import { StreamVideoWriteableStateStore } from '../store';

/**
 * An event responder which handles the `participantJoined` event.
 */
export const watchParticipantJoined = (
  dispatcher: Dispatcher,
  store: StreamVideoWriteableStateStore,
) => {
  return dispatcher.on('participantJoined', (e) => {
    if (e.eventPayload.oneofKind !== 'participantJoined') return;
    const { participant } = e.eventPayload.participantJoined;

    if (!participant) return;

    store.setCurrentValue(store.participantsSubject, (currentParticipants) => [
      ...currentParticipants,
      participant,
    ]);
  });
};

/**
 * An event responder which handles the `participantLeft` event.
 */
export const watchParticipantLeft = (
  dispatcher: Dispatcher,
  store: StreamVideoWriteableStateStore,
) => {
  return dispatcher.on('participantLeft', (e) => {
    if (e.eventPayload.oneofKind !== 'participantLeft') return;
    const { participant, callCid } = e.eventPayload.participantLeft;
    if (!participant) return;

    const activeCall = store.getCurrentValue(store.activeCallSubject);
    if (callCid !== activeCall?.data.call.cid) {
      console.warn('Received participantLeft notification for a unknown call');
      return;
    }

    store.setCurrentValue(store.participantsSubject, (participants) =>
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
  store: StreamVideoWriteableStateStore,
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
  store: StreamVideoWriteableStateStore,
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

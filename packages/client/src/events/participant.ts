import { Batcher } from '../Batcher';
import { Dispatcher } from '../rtc/Dispatcher';
import { StreamVideoWriteableStateStore } from '../store';

/**
 * An event responder which handles the `participantJoined` event.
 */
export const watchParticipantJoined = (
  dispatcher: Dispatcher,
  store: StreamVideoWriteableStateStore,
  userBatcher: Batcher<string>,
) => {
  return dispatcher.on('participantJoined', (e) => {
    if (e.eventPayload.oneofKind !== 'participantJoined') return;
    const { participant } = e.eventPayload.participantJoined;
    const call = store.getCurrentValue(store.activeCallSubject);

    const { users } = call!.data;

    // TODO: handle the case where non-creator of the call joins the call first (current user)
    // TODO: test reconnect (leave and join again)
    // TODO: when triggering a refresh while in a active call, populate "unknown" user data on re-join
    console.log('batch', 'ParticipantJoined', participant?.userId);

    const userData = users[participant!.userId];

    // if user is in call.data.users, update from there, otherwise pull from coordinator
    if (!userData) userBatcher.pushItem(participant!.userId);

    if (participant) {
      store.setCurrentValue(
        store.participantsSubject,
        (currentParticipants) => [
          ...currentParticipants,
          {
            ...participant,
            user: userData,
          },
        ],
      );
    }
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
    const { participant } = e.eventPayload.participantLeft;
    if (participant) {
      store.setCurrentValue(store.participantsSubject, (participants) =>
        participants.filter((p) => p.sessionId !== participant.sessionId),
      );
    }
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

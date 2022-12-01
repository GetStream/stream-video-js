import { StreamVideoWriteableStateStore } from '../stateStore';
import { Dispatcher } from '../rtc/Dispatcher';
import { trackTypeToParticipantStreamKey } from '../rtc/helpers/tracks';

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
    if (participant) {
      store.setCurrentValue(
        store.activeCallAllParticipantsSubject,
        (currentParticipants) => [...currentParticipants, participant],
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
      const currentParticipants = store.getCurrentValue(
        store.activeCallAllParticipantsSubject,
      );
      const activeCall = store.getCurrentValue(store.activeRingCallMetaSubject);
      const activeCallLocalParticipant = store.getCurrentValue(
        store.activeCallLocalParticipantSubject,
      );
      if (activeCall) {
        if (
          currentParticipants.length === 2 &&
          participant.sessionId !== activeCallLocalParticipant?.sessionId
        ) {
          store.setCurrentValue(store.activeRingCallMetaSubject, undefined);
        }
      }
      store.setCurrentValue(
        store.activeCallAllParticipantsSubject,
        currentParticipants.filter(
          (p) => p.sessionId !== participant.sessionId,
        ),
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
    store.updateParticipant(sessionId, (p) => {
      const key = trackTypeToParticipantStreamKey(type);
      return {
        publishedTracks: p.publishedTracks.filter((t) => t !== type),
        [key!]: undefined,
      };
    });
  });
};

const unique = <T>(v: T, i: number, arr: T[]) => arr.indexOf(v) === i;

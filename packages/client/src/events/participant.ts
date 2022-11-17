import { StreamVideoWriteableStateStore } from '../stateStore';
import { Dispatcher } from '../rtc/Dispatcher';

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
      const currentParticipants = store.getCurrentValue(
        store.activeCallAllParticipantsSubject,
      );
      store.setCurrentValue(store.activeCallAllParticipantsSubject, [
        ...currentParticipants,
        participant,
      ]);
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
      const connectedUser = store.getCurrentValue(store.connectedUserSubject);
      if (activeCall) {
        if (
          currentParticipants.length === 2 &&
          participant.user?.id !== connectedUser?.name
        ) {
          store.setCurrentValue(store.activeRingCallMetaSubject, undefined);
          store.setCurrentValue(
            store.terminatedRingCallMetaSubject,
            activeCall,
          );
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

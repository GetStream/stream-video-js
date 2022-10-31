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
      const participants = [
        ...store.getCurrentValue(store.activeCallParticipantsSubject),
        participant,
      ];

      store.setCurrentValue(store.activeCallParticipantsSubject, participants);
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
      const participants = store
        .getCurrentValue(store.activeCallParticipantsSubject)
        .filter(
          (p) =>
            p.user?.id !== participant.user?.id &&
            p.sessionId !== participant.sessionId,
        );

      store.setCurrentValue(store.activeCallParticipantsSubject, participants);
    }
  });
};

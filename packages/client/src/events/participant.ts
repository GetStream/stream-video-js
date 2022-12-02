import { Dispatcher } from '../rtc/Dispatcher';
import { StreamVideoWriteableStateStore2 } from '../store';

/**
 * An event responder which handles the `participantJoined` event.
 */
export const watchParticipantJoined = (
  dispatcher: Dispatcher,
  store: StreamVideoWriteableStateStore2,
) => {
  return dispatcher.on('participantJoined', (e) => {
    if (e.eventPayload.oneofKind !== 'participantJoined') return;
    const { participant } = e.eventPayload.participantJoined;
    if (participant) {
      store.setCurrentValue(store.participantsSubject, [
        ...store.getCurrentValue(store.participantsSubject),
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
  store: StreamVideoWriteableStateStore2,
) => {
  return dispatcher.on('participantLeft', (e) => {
    if (e.eventPayload.oneofKind !== 'participantLeft') return;
    const { participant } = e.eventPayload.participantLeft;
    if (participant) {
      store.setCurrentValue(
        store.participantsSubject,
        store
          .getCurrentValue(store.participantsSubject)
          .filter((p) => p.user?.id !== participant.user?.id),
      );
    }
  });
};

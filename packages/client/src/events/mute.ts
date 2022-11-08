import { Dispatcher } from '../rtc/Dispatcher';
import { StreamVideoWriteableStateStore } from '../stateStore';

/**
 * Watches for `muteStateChanged` events (called if video or audio is turned on/off by a participant).
 */
export const watchMuteStateChanged = (
  dispatcher: Dispatcher,
  store: StreamVideoWriteableStateStore,
) => {
  return dispatcher.on('muteStateChanged', (e) => {
    if (e.eventPayload.oneofKind !== 'muteStateChanged') return;
    const { muteStateChanged } = e.eventPayload;
    const participants = store.getCurrentValue(
      store.activeCallParticipantsSubject,
    );
    const participantToUpdate = participants.find(
      (p) => p.user?.id === muteStateChanged.userId,
    );
    if (!participantToUpdate) {
      return;
    }

    store.setCurrentValue(
      store.activeCallParticipantsSubject,
      participants.map((p) =>
        p.user?.id === participantToUpdate.user?.id
          ? {
              ...p,
              audio: !muteStateChanged.audioMuted,
              video: !muteStateChanged.videoMuted,
            }
          : p,
      ),
    );
  });
};

import { Dispatcher } from '../rtc/Dispatcher';
import { StreamVideoWriteableStateStore2 } from '../store';

/**
 * Watches for `muteStateChanged` events (called if video or audio is turned on/off by a participant).
 */
export const watchMuteStateChanged = (
  dispatcher: Dispatcher,
  store: StreamVideoWriteableStateStore2,
) => {
  return dispatcher.on('muteStateChanged', (e) => {
    if (e.eventPayload.oneofKind !== 'muteStateChanged') return;
    const { muteStateChanged } = e.eventPayload;
    const participants = store.getCurrentValue(store.participantsSubject);
    const participantToUpdate = participants.find(
      (p) => p.user?.id === muteStateChanged.userId,
    );
    if (!participantToUpdate) {
      return;
    }

    store.setCurrentValue(
      store.participantsSubject,
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

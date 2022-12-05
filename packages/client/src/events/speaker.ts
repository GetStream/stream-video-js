import { Dispatcher } from '../rtc/Dispatcher';
import { StreamVideoWriteableStateStore } from '../store';

const SPEAKING_THRESHOLD = 0.3;

/**
 * Watches for `dominantSpeakerChanged` events.
 */
export const watchDominantSpeakerChanged = (
  dispatcher: Dispatcher,
  store: StreamVideoWriteableStateStore,
) => {
  return dispatcher.on('dominantSpeakerChanged', (e) => {
    if (e.eventPayload.oneofKind !== 'dominantSpeakerChanged') return;
    const { dominantSpeakerChanged } = e.eventPayload;
    store.setCurrentValue(
      store.dominantSpeakerSubject,
      dominantSpeakerChanged.userId,
    );
  });
};

/**
 * Watches for `audioLevelChanged` events.
 */
export const watchAudioLevelChanged = (
  dispatcher: Dispatcher,
  store: StreamVideoWriteableStateStore,
) => {
  return dispatcher.on('audioLevelChanged', (e) => {
    if (e.eventPayload.oneofKind !== 'audioLevelChanged') return;
    const { audioLevels } = e.eventPayload.audioLevelChanged;
    const userIdLookup = audioLevels.reduce<Record<string, number>>(
      (acc, current) => {
        acc[current.userId] = current.level;
        return acc;
      },
      {},
    );

    const participantsSubject = store.participantsSubject;
    const participants = store.getCurrentValue(participantsSubject);
    store.setCurrentValue(
      participantsSubject,
      participants.map((participant) => {
        const { id } = participant.user!;
        const audioLevel = userIdLookup[id];
        if (participant.audioLevel !== audioLevel) {
          // FIXME OL: consider doing deep-clone
          return {
            ...participant,
            audioLevel,
            isSpeaking: audioLevel >= SPEAKING_THRESHOLD,
          };
        }
        return participant;
      }),
    );
  });
};

import { Dispatcher } from '../rtc/Dispatcher';
import { StreamVideoWriteableStateStore } from '../stateStore';
import { StreamVideoParticipantPatches } from '../rtc/types';

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
    const {
      dominantSpeakerChanged: { sessionId },
    } = e.eventPayload;
    const dominantSpeaker = store.findParticipantBySessionId(sessionId);
    store.setCurrentValue(store.dominantSpeakerSubject, dominantSpeaker);
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
    store.updateParticipants(
      audioLevels.reduce<StreamVideoParticipantPatches>((drafts, current) => {
        drafts[current.sessionId] = {
          audioLevel: current.level,
          isSpeaking: current.level > SPEAKING_THRESHOLD,
        };
        return drafts;
      }, {}),
    );
  });
};

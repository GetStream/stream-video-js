import { Dispatcher } from '../rtc/Dispatcher';
import { StreamVideoWriteableStateStore } from '../stateStore';

const SPEAKING_THRESHOLD = 0.3;

/**
 * Watches for `dominantSpeakerChanged` events.
 */
export const watchDominantSpeakerChanged = <
  RTCPeerConnectionType extends RTCPeerConnection,
>(
  dispatcher: Dispatcher,
  store: StreamVideoWriteableStateStore<RTCPeerConnectionType>,
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
export const watchAudioLevelChanged = <
  RTCPeerConnectionType extends RTCPeerConnection,
>(
  dispatcher: Dispatcher,
  store: StreamVideoWriteableStateStore<RTCPeerConnectionType>,
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

    const participantsSubject = store.activeCallParticipantsSubject;
    const participants = store.getCurrentValue(participantsSubject);
    store.setCurrentValue(
      participantsSubject,
      participants.map((p) => {
        const { id } = p.user!;
        const audioLevel = userIdLookup[id];
        if (typeof audioLevel !== 'undefined' && p.audioLevel !== audioLevel) {
          // FIXME OL: consider doing deep-clone
          return {
            ...p,
            audioLevel,
            isSpeaking: audioLevel >= SPEAKING_THRESHOLD,
          };
        }
        return p;
      }),
    );
  });
};

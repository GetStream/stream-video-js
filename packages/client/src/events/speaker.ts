import { Dispatcher } from '../rtc/Dispatcher';
import { StreamVideoWriteableStateStore } from '../stateStore';
import { CallParticipants } from '../rtc/types';

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

    const participantsSubject = store.activeCallParticipantsSubject;
    const participants = store.getCurrentValue(participantsSubject);

    // FIXME OL: support multiple sessions per userId
    const userIdToSessionId = Object.entries(participants).reduce<
      Record<string, string>
    >((acc, [sessionId, participant]) => {
      acc[participant.user!.id] = sessionId;
      return acc;
    }, {});

    const audioLevelsPerUserId = audioLevels.reduce<Record<string, number>>(
      (acc, current) => {
        acc[current.userId] = current.level;
        return acc;
      },
      {},
    );

    store.setCurrentValue(
      participantsSubject,
      Object.entries(audioLevelsPerUserId).reduce<CallParticipants>(
        (acc, [userId, audioLevel]) => {
          const sessionId = userIdToSessionId[userId];
          const participant = acc[sessionId];
          if (participant && participant.audioLevel !== audioLevel) {
            acc[sessionId] = {
              // FIXME OL: consider doing deep-clone
              ...participant,
              audioLevel,
              isSpeaking: audioLevel >= SPEAKING_THRESHOLD,
            };
          }
          return acc;
        },
        { ...participants },
      ),
    );
  });
};

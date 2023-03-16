import { Dispatcher } from '../rtc/Dispatcher';
import { CallState } from '../store';
import { StreamVideoParticipantPatches } from '../rtc/types';

/**
 * Watches for `dominantSpeakerChanged` events.
 */
export const watchDominantSpeakerChanged = (
  dispatcher: Dispatcher,
  store: CallState,
) => {
  return dispatcher.on('dominantSpeakerChanged', (e) => {
    if (e.eventPayload.oneofKind !== 'dominantSpeakerChanged') return;
    const {
      dominantSpeakerChanged: { sessionId },
    } = e.eventPayload;
    const dominantSpeaker = store.getCurrentValue(store.dominantSpeaker$);
    if (sessionId === dominantSpeaker?.sessionId) return;
    store.setCurrentValue(store.participantsSubject, (participants) =>
      participants.map((participant) => {
        // mark the new dominant speaker
        if (participant.sessionId === sessionId) {
          return {
            ...participant,
            isDominantSpeaker: true,
          };
        }
        // unmark the old dominant speaker
        if (participant.isDominantSpeaker) {
          return {
            ...participant,
            isDominantSpeaker: false,
          };
        }
        return participant; // no change
      }),
    );
  });
};

/**
 * Watches for `audioLevelChanged` events.
 */
export const watchAudioLevelChanged = (
  dispatcher: Dispatcher,
  store: CallState,
) => {
  return dispatcher.on('audioLevelChanged', (e) => {
    if (e.eventPayload.oneofKind !== 'audioLevelChanged') return;

    const { audioLevels } = e.eventPayload.audioLevelChanged;
    store.updateParticipants(
      audioLevels.reduce<StreamVideoParticipantPatches>((patches, current) => {
        patches[current.sessionId] = {
          audioLevel: current.level,
          isSpeaking: current.isSpeaking,
        };
        return patches;
      }, {}),
    );
  });
};

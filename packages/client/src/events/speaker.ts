import { Dispatcher } from '../rtc';
import { CallState } from '../store';
import { StreamVideoParticipantPatches } from '../types';

/**
 * Watches for `dominantSpeakerChanged` events.
 */
export const watchDominantSpeakerChanged = (
  dispatcher: Dispatcher,
  state: CallState,
) => {
  return dispatcher.on('dominantSpeakerChanged', (e) => {
    const { sessionId } = e;
    if (sessionId === state.dominantSpeaker?.sessionId) return;
    state.setParticipants((participants) =>
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
  state: CallState,
) => {
  return dispatcher.on('audioLevelChanged', (e) => {
    const { audioLevels } = e;
    state.updateParticipants(
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

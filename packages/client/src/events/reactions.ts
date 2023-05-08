import { StreamVideoEvent } from '../coordinator/connection/types';
import { CallState } from '../store';

/**
 * Watches the delivery of CallReactionEvent.
 *
 * @param state the state store to update.
 */
export const watchNewReactions = (state: CallState) => {
  return function onNewReactions(event: StreamVideoEvent) {
    if (event.type !== 'call.reaction_new') return;
    const { reaction } = event;
    const { user, custom, type, emoji_code } = reaction;
    state.setParticipants((participants) => {
      return participants.map((p) => {
        // skip if the reaction is not for this participant
        if (p.userId !== user.id) return p;
        // update the participant with the new reaction
        return {
          ...p,
          reaction: {
            type,
            emoji_code,
            custom,
          },
        };
      });
    });
  };
};

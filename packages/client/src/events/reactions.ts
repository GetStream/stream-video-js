import { StreamVideoEvent } from '../coordinator/connection/types';
import { StreamVideoWriteableStateStore } from '../store';

/**
 * Watches the delivery of CallReactionEvent.
 *
 * @param store the state store to update.
 */
export const watchNewReactions = (store: StreamVideoWriteableStateStore) => {
  return function onNewReactions(event: StreamVideoEvent) {
    if (event.type !== 'call.reaction_new') {
      return;
    }
    const { call_cid, reaction } = event;
    const activeCall = store.activeCall;
    if (!activeCall || activeCall.cid !== call_cid) {
      console.warn(
        'Received CallReactionEvent for an inactive or unknown call',
      );
      return;
    }

    const state = activeCall.state;
    const { user, custom, type, emoji_code } = reaction;
    state.setParticipants((participants) => {
      return participants.map((p) => {
        // skip if the reaction is not for this participant
        if (p.userId !== user.id) return p;

        // skip if the reaction is not for this session
        if (custom.sessionId && p.sessionId !== custom.sessionId) return p;

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

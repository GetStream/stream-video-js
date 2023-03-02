import { StreamVideoWriteableStateStore } from '../store';
import type { CallReactionEvent } from '../gen/coordinator';

/**
 * Watches the delivery of CallReactionEvent.
 *
 * @param store the state store to update.
 */
export const watchNewReactions = (store: StreamVideoWriteableStateStore) => {
  return function onNewReactions(event: CallReactionEvent) {
    const { call_cid, reaction } = event;
    const activeCall = store.getCurrentValue(store.activeCallSubject);
    if (!activeCall || activeCall.data.call.cid !== call_cid) {
      console.warn(
        'Received CallReactionEvent for an inactive or unknown call',
      );
      return;
    }

    store.setCurrentValue(store.participantsSubject, (participants) => {
      const { user, custom, type, emoji_code } = reaction;
      return participants.map((p) => {
        // skip if the reaction is not for this participant
        if (p.userId !== user.id) return p;

        // skip if the reaction is not for this session
        if (custom.sessionId && p.sessionId !== custom.sessionId) return p;

        // push the reaction to the participant's reactions array
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

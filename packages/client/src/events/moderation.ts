import { BlockedUserEvent, UnblockedUserEvent } from '../gen/coordinator';
import { StreamVideoWriteableStateStore } from '../store';

/**
 * Event handler that watches for `call.blocked_user` events,
 * updates the call store `blocked_user_ids` property by adding
 * `event.user_id` to the list
 */
export const watchBlockedUser =
  (store: StreamVideoWriteableStateStore) => (event: BlockedUserEvent) => {
    const activeCall = store.getCurrentValue(store.activeCallSubject);

    if (!activeCall || activeCall.cid !== event.call_cid) {
      console.warn(
        `Received "call.blocked_user" for an inactive or unknown call`,
        event,
      );
      return;
    }

    const state = activeCall.state;
    const localParticipant = state.getCurrentValue(state.localParticipant$);

    // FIXME: end call
    if (localParticipant?.userId === event.user.id) {
      activeCall.leave();
    }

    state.setCurrentValue(state.metadataSubject, (metadata) => ({
      ...metadata!,
      blocked_user_ids: [...metadata!.blocked_user_ids, event.user.id],
    }));
  };

/**
 * Event handler that watches for `call.unblocked_user` events,
 * updates the call store `blocked_user_ids` property by
 * removing `event.user_id` from the list
 */
export const watchUnblockedUser =
  (store: StreamVideoWriteableStateStore) => (event: UnblockedUserEvent) => {
    const activeCall = store.getCurrentValue(store.activeCallSubject);

    if (!activeCall || activeCall.cid !== event.call_cid) {
      console.warn(
        `Received "call.unblocked_user" for an inactive or unknown call`,
        event,
      );
      return;
    }

    const state = activeCall.state;

    state.setCurrentValue(state.metadataSubject, (metadata) => {
      const blocked_user_ids = metadata!.blocked_user_ids.filter(
        (userId) => event.user.id !== userId,
      );

      return {
        ...metadata!,
        blocked_user_ids,
      };
    });
  };

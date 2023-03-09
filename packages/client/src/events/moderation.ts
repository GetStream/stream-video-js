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
    const localParticipant = store.getCurrentValue(store.localParticipant$);

    if (!activeCall) {
      console.warn(
        `Ignoring "call.blocked_user" as there is no active call`,
        event,
      );
      return;
    }

    if (activeCall.data.call.cid !== event.call_cid) {
      console.warn(
        `Ignoring "call.blocked_user" as it doesn't belong to the active call`,
        event,
      );
      return;
    }

    // FIXME: end call
    if (localParticipant?.userId === event.user_id) {
      activeCall.leave();
    }

    activeCall.data.updateCallMetadata((metadata) => ({
      ...metadata,
      blocked_user_ids: [...metadata.blocked_user_ids, event.user_id],
    }));
  };

/**
 * Event handler that watches for `call.unblocked_user` events,
 * updates the call store `blocked_user_ids` property by
 * removing `event.user_id` from the list
 */
export const watchUnblockedUser =
  (store: StreamVideoWriteableStateStore) => (event: UnblockedUserEvent) => {
    console.warn(event);
    const activeCall = store.getCurrentValue(store.activeCallSubject);

    if (!activeCall) {
      console.warn(
        `Ignoring "call.unblocked_user" as there is no active call`,
        event,
      );
      return;
    }

    if (activeCall.data.call.cid !== event.call_cid) {
      console.warn(
        `Ignoring "call.unblocked_user" as it doesn't belong to the active call`,
        event,
      );
      return;
    }

    activeCall.data.updateCallMetadata((metadata) => {
      const blocked_user_ids = metadata.blocked_user_ids.filter(
        (userId) => event.user_id !== userId,
      );

      console.log({
        blocked_user_ids_new: blocked_user_ids,
        old: metadata.blocked_user_ids,
      });

      return {
        ...metadata,
        blocked_user_ids,
      };
    });
  };

import { StreamVideoEvent } from '../coordinator/connection/types';
import { CallState } from '../store';

/**
 * Event handler that watches for `call.blocked_user` events,
 * updates the call store `blocked_user_ids` property by adding
 * `event.user_id` to the list
 */
export const watchBlockedUser =
  (state: CallState) => (event: StreamVideoEvent) => {
    if (event.type !== 'call.blocked_user') return;
    state.setMetadata((metadata) => ({
      ...metadata!,
      blocked_user_ids: [...(metadata?.blocked_user_ids || []), event.user.id],
    }));
  };

/**
 * Event handler that watches for `call.unblocked_user` events,
 * updates the call store `blocked_user_ids` property by
 * removing `event.user_id` from the list
 */
export const watchUnblockedUser =
  (state: CallState) => (event: StreamVideoEvent) => {
    if (event.type !== 'call.unblocked_user') return;
    state.setMetadata((metadata) => {
      const blocked_user_ids = (metadata?.blocked_user_ids || []).filter(
        (userId) => event.user.id !== userId,
      );
      return {
        ...metadata!,
        blocked_user_ids,
      };
    });
  };

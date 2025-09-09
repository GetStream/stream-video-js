import { CallState } from '../store';
import type { CallGrantsUpdated } from '../gen/video/sfu/event/events';

/**
 * Event handler that watches for `callGrantsUpdated` events.
 *
 * @param state the call state to update.
 */
export const watchCallGrantsUpdated = (state: CallState) => {
  return function onCallGrantsUpdated(event: CallGrantsUpdated) {
    const { currentGrants } = event;

    if (!currentGrants) return;

    state.setCallGrants(currentGrants);
  };
};

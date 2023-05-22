import { StreamVideoEvent } from '../coordinator/connection/types';
import { CallState } from '../store';

/**
 * Watches for `call.live_started` events.
 */
export const watchCallLiveStarted = (state: CallState) => {
  return function onCallLiveStarted(event: StreamVideoEvent) {
    if (event.type !== 'call.live_started') return;
    state.setMetadata((metadata) => ({
      ...metadata!,
      backstage: false,
    }));
  };
};

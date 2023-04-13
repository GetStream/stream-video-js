import { StreamVideoEvent } from '../coordinator/connection/types';
import { CallState } from '../store';

/**
 * Event handler that watches for `call.permission_request` events
 * Updates the state store using the `callPermissionRequest$` stream
 */
export const watchCallPermissionRequest = (state: CallState) => {
  return function onCallPermissionRequest(event: StreamVideoEvent) {
    if (event.type !== 'call.permission_request') return;
    state.setCallPermissionRequest(event);
  };
};

/**
 * Event handler that watches for `call.permissions_updated` events
 */
export const watchCallPermissionsUpdated = (state: CallState) => {
  return function onCallPermissionsUpdated(event: StreamVideoEvent) {
    if (event.type !== 'call.permissions_updated') return;
    const { localParticipant } = state;
    if (event.user.id === localParticipant?.userId) {
      state.setMetadata((metadata) => ({
        ...metadata!,
        own_capabilities: event.own_capabilities,
      }));
    }
  };
};

import { StreamVideoEvent } from '../coordinator/connection/types';
import { StreamVideoWriteableStateStore } from '../store';

/**
 * Event handler that watches for `call.permission_request` events
 * Updates the state store using the `callPermissionRequest$` stream
 */
export const watchCallPermissionRequest = (
  store: StreamVideoWriteableStateStore,
) => {
  return function onCallPermissionRequest(event: StreamVideoEvent) {
    if (event.type !== 'call.permission_request') {
      return;
    }
    const activeCall = store.getCurrentValue(store.activeCallSubject);

    if (!activeCall) {
      console.warn(
        `Ignoring "call.permission_request" as there is no active call`,
        event,
      );
      return;
    }

    if (activeCall.cid !== event.call_cid) {
      console.warn(
        `Ignoring "call.permission_request" as it doesn't belong to the active call`,
        event,
      );
      return;
    }

    const state = activeCall.state;
    const localParticipant = state.getCurrentValue(state.localParticipant$);
    if (
      !localParticipant?.ownCapabilities.includes('update-call-permissions')
    ) {
      console.warn(
        `Ignoring "call.permission_request" as the user doesn't have permission to handle it`,
      );
      return;
    }

    state.setCurrentValue(state.callPermissionRequestSubject, event);
  };
};

/**
 * Event handler that watches for `call.permissions_updated` events
 * It will update the `localParticipant$` or `remoteParticipants$` based on whose permissions were changed.
 */
export const watchCallPermissionsUpdated = (
  store: StreamVideoWriteableStateStore,
) => {
  return function onCallPermissionsUpdated(event: StreamVideoEvent) {
    if (event.type !== 'call.permissions_updated') {
      return;
    }
    const activeCall = store.getCurrentValue(store.activeCallSubject);
    if (!activeCall) {
      console.warn(
        `Ignoring "call.permissions_updated" as there is no active call`,
        event,
      );
      return;
    }

    if (activeCall.cid !== event.call_cid) {
      console.warn(
        `Ignoring "call.permissions_updated" as it doesn't belong to the active call`,
        event,
      );
      return;
    }

    const state = activeCall.state;
    const localParticipant = state.getCurrentValue(state.localParticipant$);
    if (event.user.id === localParticipant?.userId) {
      state.updateParticipant(localParticipant.sessionId, {
        ownCapabilities: event.own_capabilities,
      });
    }

    // TODO: update remote participant once SFU includes that info in the participant data model
  };
};

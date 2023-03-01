import {
  PermissionRequestEvent,
  UpdatedCallPermissionsEvent,
} from '../gen/coordinator';
import { StreamVideoWriteableStateStore } from '../store';

/**
 * Event handler that watches for `call.permission_request` events
 * Updates the state store using the `callPermissionRequest$` stream
 */
export const watchCallPermissionRequest = (
  store: StreamVideoWriteableStateStore,
) => {
  return function onCallPermissionRequest(event: PermissionRequestEvent) {
    const activeCall = store.getCurrentValue(store.activeCallSubject);

    if (!activeCall) {
      console.warn(
        `Ignoring "call.permission_request" as there is no active call`,
        event,
      );
      return;
    }

    if (activeCall.data.call.cid !== event.call_cid) {
      console.warn(
        `Ignoring "call.permission_request" as it doesn't belong to the active call`,
        event,
      );
      return;
    }

    const localParticipant = store.getCurrentValue(store.localParticipant$);
    if (
      !localParticipant?.ownCapabilities.includes('update-call-permissions')
    ) {
      console.warn(
        `Ignoring "call.permission_request" as the user doesn't have permission to handle it`,
      );
      return;
    }

    console.warn(event);

    store.callPermissionRequestSubject.next(event);
  };
};

/**
 * Event handler that watches for `call.permissions_updated` events
 * It will update the `localParticipant$` or `remoteParticipants$` based on whose permissions were changed.
 */
export const watchCallPermissionsUpdated = (
  store: StreamVideoWriteableStateStore,
) => {
  return function onCallPermissionsUpdated(event: UpdatedCallPermissionsEvent) {
    console.warn(event);
    const activeCall = store.getCurrentValue(store.activeCallSubject);

    if (!activeCall) {
      console.warn(
        `Ignoring "call.permission_request" as there is no active call`,
        event,
      );
      return;
    }

    if (activeCall.data.call.cid !== event.call_cid) {
      console.warn(
        `Ignoring "call.permission_request" as it doesn't belong to the active call`,
        event,
      );
      return;
    }

    const localParticipant = store.getCurrentValue(store.localParticipant$);
    if (event.user.id === localParticipant?.userId) {
      store.updateParticipant(localParticipant.sessionId, {
        ownCapabilities: event.own_capabilities,
      });
    }

    // TODO: update remote participant once SFU includes that info in the participant data model
  };
};

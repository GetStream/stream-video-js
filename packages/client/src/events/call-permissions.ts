import { StreamVideoEvent } from '../coordinator/connection/types';
import { CallState } from '../store';
import { SfuEvent } from '../gen/video/sfu/event/events';
import { OwnCapability } from '../gen/coordinator';

/**
 * Event handler that watches for `call.permission_request` events
 * Updates the state store using the `callPermissionRequest$` stream
 */
export const watchCallPermissionRequest = (state: CallState) => {
  return function onCallPermissionRequest(event: StreamVideoEvent) {
    if (event.type !== 'call.permission_request') return;
    const { localParticipant } = state;
    if (event.user.id !== localParticipant?.userId) {
      state.setCallPermissionRequest(event);
    }
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
      state.setOwnCapabilities(event.own_capabilities);
    }
  };
};

/**
 * Event handler that watches for `callGrantsUpdated` events.
 *
 * @param state the call state to update.
 */
export const watchCallGrantsUpdated = (state: CallState) => {
  return function onCallGrantsUpdated(event: SfuEvent) {
    if (event.eventPayload.oneofKind !== 'callGrantsUpdated') return;
    const { currentGrants } = event.eventPayload.callGrantsUpdated;
    if (currentGrants) {
      const { canPublishAudio, canPublishVideo, canScreenshare } =
        currentGrants;

      const update: Partial<Record<OwnCapability, boolean>> = {
        [OwnCapability.SEND_AUDIO]: canPublishAudio,
        [OwnCapability.SEND_VIDEO]: canPublishVideo,
        [OwnCapability.SCREENSHARE]: canScreenshare,
      };

      const nextCapabilities = state.ownCapabilities.filter(
        (capability) => update[capability] !== false,
      );
      Object.entries(update).forEach(([capability, value]) => {
        if (value && !nextCapabilities.includes(capability as OwnCapability)) {
          nextCapabilities.push(capability as OwnCapability);
        }
      });

      state.setOwnCapabilities(nextCapabilities);
    }
  };
};

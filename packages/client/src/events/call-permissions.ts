import { CallState } from '../store';
import { SfuEvent } from '../gen/video/sfu/event/events';
import { OwnCapability } from '../gen/coordinator';

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

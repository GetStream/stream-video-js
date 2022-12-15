import { Dispatcher } from '../rtc/Dispatcher';
import { Call } from '../rtc/Call';
import { StreamVideoWriteableStateStore } from '../stateStore';
import { StreamVideoParticipantPatches } from '../rtc/types';

/**
 * An event responder which handles the `changePublishQuality` event.
 */
export const watchChangePublishQuality = (
  dispatcher: Dispatcher,
  call: Call,
) => {
  return dispatcher.on('changePublishQuality', (e) => {
    if (e.eventPayload.oneofKind !== 'changePublishQuality') return;
    const { videoSenders } = e.eventPayload.changePublishQuality;
    videoSenders.forEach((videoSender) => {
      const { layers } = videoSender;
      call.updatePublishQuality(
        layers.filter((l) => l.active).map((l) => l.name),
      );
    });
  });
};

export const watchConnectionQualityChanged = (
  dispatcher: Dispatcher,
  store: StreamVideoWriteableStateStore,
) => {
  return dispatcher.on('connectionQualityChanged', (e) => {
    if (e.eventPayload.oneofKind !== 'connectionQualityChanged') return;
    const { connectionQualityChanged } = e.eventPayload;
    const { connectionQualityUpdates } = connectionQualityChanged;
    if (!connectionQualityUpdates) return;
    store.updateParticipants(
      connectionQualityUpdates.reduce<StreamVideoParticipantPatches>(
        (patches, update) => {
          const { sessionId, connectionQuality } = update;
          patches[sessionId] = {
            connectionQuality,
          };
          return patches;
        },
        {},
      ),
    );
  });
};

import { Dispatcher } from '../rtc';
import { Call } from '../Call';
import { CallState } from '../store';
import { StreamVideoParticipantPatches } from '../types';

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
  state: CallState,
) => {
  return dispatcher.on('connectionQualityChanged', (e) => {
    if (e.eventPayload.oneofKind !== 'connectionQualityChanged') return;
    const { connectionQualityChanged } = e.eventPayload;
    const { connectionQualityUpdates } = connectionQualityChanged;
    if (!connectionQualityUpdates) return;
    state.updateParticipants(
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

/**
 * Updates the approximate number of participants in the call by peeking at the
 * health check events that our SFU sends.
 */
export const watchParticipantCountChanged = (
  dispatcher: Dispatcher,
  state: CallState,
) => {
  return dispatcher.on('healthCheckResponse', (e) => {
    if (e.eventPayload.oneofKind !== 'healthCheckResponse') return;
    const { participantCount } = e.eventPayload.healthCheckResponse;
    if (participantCount) {
      state.setParticipantCount(participantCount.total);
      state.setAnonymousParticipantCount(participantCount.anonymous);
    }
  });
};

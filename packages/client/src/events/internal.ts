import { Dispatcher } from '../rtc';
import { Call } from '../Call';
import { CallState } from '../store';
import { StreamVideoParticipantPatches } from '../types';
import { getLogger } from '../logger';
import type { PinsChanged } from '../gen/video/sfu/event/events';
import {
  ErrorCode,
  WebsocketReconnectStrategy,
} from '../gen/video/sfu/models/models';
import { OwnCapability } from '../gen/coordinator';

/**
 * An event responder which handles the `changePublishQuality` event.
 */
export const watchChangePublishQuality = (
  dispatcher: Dispatcher,
  call: Call,
) => {
  return dispatcher.on('changePublishQuality', (e) => {
    const { videoSenders } = e;
    videoSenders.forEach((videoSender) => {
      const { layers } = videoSender;
      call.updatePublishQuality(layers.filter((l) => l.active));
    });
  });
};

export const watchConnectionQualityChanged = (
  dispatcher: Dispatcher,
  state: CallState,
) => {
  return dispatcher.on('connectionQualityChanged', (e) => {
    const { connectionQualityUpdates } = e;
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
    const { participantCount } = e;
    if (participantCount) {
      state.setParticipantCount(participantCount.total);
      state.setAnonymousParticipantCount(participantCount.anonymous);
    }
  });
};

export const watchLiveEnded = (dispatcher: Dispatcher, call: Call) => {
  return dispatcher.on('error', (e) => {
    if (e.error && e.error.code !== ErrorCode.LIVE_ENDED) return;

    if (!call.permissionsContext.hasPermission(OwnCapability.JOIN_BACKSTAGE)) {
      call.leave({ reason: 'live ended' }).catch((err) => {
        call.logger('error', 'Failed to leave call after live ended', err);
      });
    }
  });
};

/**
 * Watches and logs the errors reported by the currently connected SFU.
 */
export const watchSfuErrorReports = (dispatcher: Dispatcher) => {
  return dispatcher.on('error', (e) => {
    if (!e.error) return;
    const logger = getLogger(['SfuClient']);
    const { error, reconnectStrategy } = e;
    logger('error', 'SFU reported error', {
      code: ErrorCode[error.code],
      reconnectStrategy: WebsocketReconnectStrategy[reconnectStrategy],
      message: error.message,
      shouldRetry: error.shouldRetry,
    });
  });
};

/**
 * Watches for `pinsUpdated` events and updates the pinned state of participants
 * in the call.
 */
export const watchPinsUpdated = (state: CallState) => {
  return function onPinsUpdated(e: PinsChanged) {
    const { pins } = e;
    state.setServerSidePins(pins);
  };
};

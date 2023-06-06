import { CallState } from '../store';
import { StreamVideoEvent } from '../coordinator/connection/types';

/**
 * Watches for `call.recording_started` events.
 */
export const watchCallRecordingStarted = (state: CallState) => {
  return function onCallRecordingStarted(event: StreamVideoEvent) {
    if (event.type !== 'call.recording_started') return;
    state.setMetadata((metadata) => ({
      ...metadata!,
      recording: true,
    }));
  };
};

/**
 * Watches for `call.recording_stopped` events.
 */
export const watchCallRecordingStopped = (state: CallState) => {
  return function onCallRecordingStopped(event: StreamVideoEvent) {
    if (event.type !== 'call.recording_stopped') return;
    state.setMetadata((metadata) => ({
      ...metadata!,
      recording: false,
    }));
  };
};

/**
 * Watches for `call.broadcasting_started` events.
 */
export const watchCallBroadcastingStarted = (state: CallState) => {
  return function onCallBroadcastingStarted(event: StreamVideoEvent) {
    if (event.type !== 'call.broadcasting_started') return;
    state.setMetadata((metadata) => ({
      ...metadata!,
      egress: {
        ...metadata!.egress,
        broadcasting: true,
        hls: {
          ...metadata!.egress.hls,
          playlist_url: event.hls_playlist_url,
        },
      },
    }));
  };
};

/**
 * Watches for `call.broadcasting_stopped` events.
 */
export const watchCallBroadcastingStopped = (state: CallState) => {
  return function onCallBroadcastingStopped(event: StreamVideoEvent) {
    if (event.type !== 'call.broadcasting_stopped') return;
    state.setMetadata((metadata) => ({
      ...metadata!,
      egress: {
        ...metadata!.egress,
        broadcasting: false,
      },
    }));
  };
};

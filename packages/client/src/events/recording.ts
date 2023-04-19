import { CallState } from '../store';
import { StreamVideoEvent } from '../coordinator/connection/types';

/**
 * Watches for `call.recording_started` events.
 */
export const watchCallRecordingStarted = (state: CallState) => {
  return function onCallRecordingStarted(event: StreamVideoEvent) {
    if (event.type !== 'call.recording_started') return;
    state.setCallRecordingInProgress(true);
  };
};

/**
 * Watches for `call.recording_stopped` events.
 */
export const watchCallRecordingStopped = (state: CallState) => {
  return function onCallRecordingStopped(event: StreamVideoEvent) {
    if (event.type !== 'call.recording_stopped') return;
    state.setCallRecordingInProgress(false);
  };
};

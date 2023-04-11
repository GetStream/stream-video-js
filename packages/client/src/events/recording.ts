import { StreamVideoWriteableStateStore } from '../store';
import { StreamVideoEvent } from '../coordinator/connection/types';

/**
 * Watches for `call.recording_started` events.
 */
export const watchCallRecordingStarted = (
  store: StreamVideoWriteableStateStore,
) => {
  return function onCallRecordingStarted(event: StreamVideoEvent) {
    if (event.type !== 'call.recording_started') {
      return;
    }
    const { call_cid } = event;
    const activeCall = store.activeCall;
    if (!activeCall || activeCall.cid !== call_cid) {
      console.warn('Received CallRecordingStartedEvent for a non-active call');
      return;
    }
    const state = activeCall.state;
    state.setCallRecordingInProgress(true);
  };
};

/**
 * Watches for `call.recording_stopped` events.
 */
export const watchCallRecordingStopped = (
  store: StreamVideoWriteableStateStore,
) => {
  return function onCallRecordingStopped(event: StreamVideoEvent) {
    if (event.type !== 'call.recording_stopped') {
      return;
    }
    const { call_cid } = event;
    const activeCall = store.activeCall;
    if (!activeCall || activeCall.cid !== call_cid) {
      console.warn('Received CallRecordingStoppedEvent for a non-active call');
      return;
    }
    const state = activeCall.state;
    state.setCallRecordingInProgress(false);
  };
};

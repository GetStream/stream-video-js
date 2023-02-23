import { StreamVideoWriteableStateStore } from '../store';
import { CallRecordingStarted, CallRecordingStopped } from '../gen/coordinator';

/**
 * Watches for `call.recording_started` events.
 */
export const watchCallRecordingStarted = (
  store: StreamVideoWriteableStateStore,
) => {
  return function onCallRecordingStarted(event: CallRecordingStarted) {
    const { call_cid } = event;
    const activeCall = store.getCurrentValue(store.activeCallSubject);
    if (!activeCall || activeCall.data.call.cid !== call_cid) {
      console.warn('Received CallRecordingStarted event for a non-active call');
      return;
    }
    store.setCurrentValue(store.callRecordingInProgressSubject, true);
  };
};

/**
 * Watches for `call.recording_stopped` events.
 */
export const watchCallRecordingStopped = (
  store: StreamVideoWriteableStateStore,
) => {
  return function onCallRecordingStopped(event: CallRecordingStopped) {
    const { call_cid } = event;
    const activeCall = store.getCurrentValue(store.activeCallSubject);
    if (!activeCall || activeCall.data.call.cid !== call_cid) {
      console.warn('Received CallRecordingStopped event for a non-active call');
      return;
    }
    store.setCurrentValue(store.callRecordingInProgressSubject, false);
  };
};

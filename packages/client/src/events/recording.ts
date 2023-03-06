import { StreamVideoWriteableStateStore } from '../store';
import {
  CallRecordingStartedEvent,
  CallRecordingStoppedEvent,
} from '../gen/coordinator';

/**
 * Watches for `call.recording_started` events.
 */
export const watchCallRecordingStarted = (
  store: StreamVideoWriteableStateStore,
) => {
  return function onCallRecordingStarted(event: CallRecordingStartedEvent) {
    const { call_cid } = event;
    const activeCall = store.getCurrentValue(store.activeCallSubject);
    if (!activeCall || activeCall.data.call.cid !== call_cid) {
      console.warn('Received CallRecordingStartedEvent for a non-active call');
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
  return function onCallRecordingStopped(event: CallRecordingStoppedEvent) {
    const { call_cid } = event;
    const activeCall = store.getCurrentValue(store.activeCallSubject);
    if (!activeCall || activeCall.data.call.cid !== call_cid) {
      console.warn('Received CallRecordingStoppedEvent for a non-active call');
      return;
    }
    store.setCurrentValue(store.callRecordingInProgressSubject, false);
  };
};

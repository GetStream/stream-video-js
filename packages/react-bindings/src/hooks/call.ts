import { useObservableValue } from './helpers/useObservableValue';
import { useStore } from './store';

/**
 * Utility hook which provides information whether the current call is being recorded.
 */
export const useIsCallRecordingInProgress = () => {
  const { callRecordingInProgress$ } = useStore();
  return useObservableValue(callRecordingInProgress$);
};

/**
 * Utility hook which provides the latest stats report of the current call.
 */
export const useCurrentCallStatsReport = () => {
  const { callStatsReport$ } = useStore();
  return useObservableValue(callStatsReport$);
};

/**
 * Utility hook which provides the dominant speaker of the current call.
 */
export const useDominantSpeaker = () => {
  const { dominantSpeaker$ } = useStore();
  return useObservableValue(dominantSpeaker$);
};

/**
 * Utility hook which provides the currently active call.
 */
export const useActiveCall = () => {
  const { activeCall$ } = useStore();
  return useObservableValue(activeCall$);
};

/**
 * Utility hook which provides the currently active ring-call meta.
 */
export const useActiveRingCall = () => {
  const { activeRingCallMeta$ } = useStore();
  return useObservableValue(activeRingCallMeta$);
};

/**
 * Utility hook which provides the currently terminated ring call meta.
 */
export const useTerminatedRingCall = () => {
  const { terminatedRingCallMeta$ } = useStore();
  return useObservableValue(terminatedRingCallMeta$);
};

/**
 * Utility hook which provides the currently active ring-call details.
 */
export const useActiveRingCallDetails = () => {
  const { activeRingCallDetails$ } = useStore();
  return useObservableValue(activeRingCallDetails$);
};

/**
 * Utility hook which provides a list of all incoming ring calls.
 */
export const useIncomingRingCalls = () => {
  const { incomingRingCalls$ } = useStore();
  return useObservableValue(incomingRingCalls$);
};

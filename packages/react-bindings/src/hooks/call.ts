import { useObservableValue } from './helpers/useObservableValue';
import { useCallState, useStore } from './store';

/**
 * Utility hook which provides information whether the current call is being recorded.
 */
export const useIsCallRecordingInProgress = () => {
  const { callRecordingInProgress$ } = useCallState();
  return useObservableValue(callRecordingInProgress$);
};

/**
 * Utility hook which provides a boolean indicating whether there is
 * a participant in the current call which shares their screen.
 */
export const useHasOngoingScreenShare = () => {
  const { hasOngoingScreenShare$ } = useCallState();
  return useObservableValue(hasOngoingScreenShare$);
};

/**
 * Utility hook which provides the latest stats report of the current call.
 *
 * The latest stats report of the current call.
 * When stats gathering is enabled, this observable will emit a new value
 * at a regular (configurable) interval.
 *
 * Consumers of this observable can implement their own batching logic
 * in case they want to show historical stats data.
 */
export const useCurrentCallStatsReport = () => {
  const { callStatsReport$ } = useCallState();
  return useObservableValue(callStatsReport$);
};

/**
 * Utility hook which provides the dominant speaker of the current call.
 */
export const useDominantSpeaker = () => {
  const { dominantSpeaker$ } = useCallState();
  return useObservableValue(dominantSpeaker$);
};

/**
 * Utility hook which provides controller for the currently active call and active call's metadata.
 * `activeCall$` will be set after calling [`join` on a `Call` instance](./Call.md/#join) and cleared after calling [`leave`](./Call.md/#leave).
 */
export const useActiveCall = () => {
  const { activeCall$ } = useStore();
  return useObservableValue(activeCall$);
};

/**
 * Utility hook which provides a list of all notifications about created calls.
 * In the ring call settings, these calls can be outgoing (I have called somebody)
 * or incoming (somebody has called me).
 */
export const usePendingCalls = () => {
  const { pendingCalls$ } = useStore();
  return useObservableValue(pendingCalls$);
};

/**
 * Utility hook which provides a list of all incoming ring calls (somebody calls me).
 */
export const useIncomingCalls = () => {
  const { incomingCalls$ } = useStore();
  return useObservableValue(incomingCalls$);
};

/**
 * Utility hook which provides a list of all outgoing ring calls (I call somebody).
 */
export const useOutgoingCalls = () => {
  const { outgoingCalls$ } = useStore();
  return useObservableValue(outgoingCalls$);
};

export const useAcceptedCall = () => {
  const { acceptedCall$ } = useStore();
  return useObservableValue(acceptedCall$);
};

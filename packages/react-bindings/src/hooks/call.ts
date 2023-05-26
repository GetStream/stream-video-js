import { useObservableValue } from './helpers/useObservableValue';
import { useCallState, useStore } from './store';

/**
 * Utility hook which provides information whether the current call is being recorded.
 *
 * @category Call State
 */
export const useIsCallRecordingInProgress = () => {
  const metadata = useCallMetadata();
  return !!metadata?.recording;
};

/**
 * Utility hook which provides information whether the current call is broadcasting.
 *
 * @category Call State
 */
export const useIsCallBroadcastingInProgress = () => {
  const metadata = useCallMetadata();
  return !!metadata?.broadcasting;
};

/**
 * Utility hook which provides information whether the current call is live.
 *
 * @category Call State
 */
export const useIsCallLive = () => {
  const metadata = useCallMetadata();
  return !metadata?.backstage;
};

/**
 * Utility hook which provides a boolean indicating whether there is
 * a participant in the current call which shares their screen.
 *
 * @category Call State
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
 *
 * @category Call State
 */
export const useCallStatsReport = () => {
  const { callStatsReport$ } = useCallState();
  return useObservableValue(callStatsReport$);
};

/**
 * Utility hook which provides the dominant speaker of the current call.
 *
 * @category Call State
 */
export const useDominantSpeaker = () => {
  const { dominantSpeaker$ } = useCallState();
  return useObservableValue(dominantSpeaker$);
};

/**
 * Utility hook which provides a list of all notifications about created calls.
 * In the ring call settings, these calls can be outgoing (I have called somebody)
 * or incoming (somebody has called me).
 *
 * @category Client State
 */
export const useCalls = () => {
  const { calls$ } = useStore();
  return useObservableValue(calls$);
};

/**
 * Utility hook which provides a list of all incoming ring calls (somebody calls me).
 *
 * @deprecated derive from useCalls()/useCall() instead.
 * @internal
 * @category Client State
 */
export const useIncomingCalls = () => {
  const { incomingCalls$ } = useStore();
  return useObservableValue(incomingCalls$);
};

/**
 * Utility hook which provides a list of all outgoing ring calls (I call somebody).
 *
 * @deprecated derive from useCalls()/useCall() instead.
 * @internal
 * @category Client State
 */
export const useOutgoingCalls = () => {
  const { outgoingCalls$ } = useStore();
  return useObservableValue(outgoingCalls$);
};

/**
 * Utility hook which provides call metadata (such as blocked users and own capabilities).
 *
 * @category Call State
 */
export const useCallMetadata = () => {
  const { metadata$ } = useCallState();
  return useObservableValue(metadata$);
};

/**
 * Utility hook which provides a list of call members.
 *
 * @category Call State
 */
export const useCallMembers = () => {
  const { members$ } = useCallState();
  return useObservableValue(members$);
};

/**
 * Utility hook providing the latest list of recordings performed during the active call
 *
 * @category Call State
 */
export const useCallRecordings = () => {
  const { callRecordingList$ } = useCallState();
  return useObservableValue(callRecordingList$);
};

/**
 * Utility hook providing the current calling state of the call.
 *
 * @category Call State
 */
export const useCallCallingState = () => {
  const { callingState$ } = useCallState();
  return useObservableValue(callingState$);
};

/**
 * Utility hook providing the actual start time of the call.
 * Useful for calculating the call duration.
 *
 * @category Call State
 */
export const useCallStartedAt = () => {
  const { startedAt$ } = useCallState();
  return useObservableValue(startedAt$);
};

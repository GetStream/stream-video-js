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
 * Utility hook which provides a boolean indicating whether there is
 * a participant in the current call which shares their screen.
 */
export const useHasOngoingScreenShare = () => {
  const { hasOngoingScreenShare$ } = useStore();
  return useObservableValue(hasOngoingScreenShare$);
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
 * Utility hook which provides controller for the currently active call and active call's metadata.
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

/**
 * Utility hook which provides a list of all call rejections (I refused to join when somebody called me)
 * or cancellations (I have left an active call or have cancelled my outgoing call before joining it).
 * The list is not filtered by user, so it contains all the notifications done by any user for all the initiated calls.
 */
export const useHangUpNotifications = () => {
  const { hangupNotifications$ } = useStore();
  return useObservableValue(hangupNotifications$);
};

/**
 * Utility hook which provides a list of all call rejections (I refused to join when somebody called me)
 * or cancellations (I have left an active call or have cancelled my outgoing call before joining it) do by me.
 */
export const useLocalHangUpNotifications = () => {
  const { localHangupNotifications$ } = useStore();
  return useObservableValue(localHangupNotifications$);
};

export const useRemoteHangUpNotifications = () => {
  const { remoteHangupNotifications$ } = useStore();
  return useObservableValue(remoteHangupNotifications$);
};

export const useActiveCallHangUpNotification = () => {
  const { activeCallHangupNotifications$ } = useStore();
  return useObservableValue(activeCallHangupNotifications$);
};

export const useOutgoingCallHangUpNotification = () => {
  const { outgoingCallHangupNotifications$ } = useStore();
  return useObservableValue(outgoingCallHangupNotifications$);
};

export const useIncomingCallHangUpNotification = () => {
  const { incomingCallHangupNotifications$ } = useStore();
  return useObservableValue(incomingCallHangupNotifications$);
};

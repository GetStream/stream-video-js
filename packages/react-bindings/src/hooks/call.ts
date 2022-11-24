import { useObservableValue } from './helpers/useObservableValue';
import { useStore } from './store';

export const useIsCallRecordingInProgress = () => {
  const { callRecordingInProgress$ } = useStore();
  return useObservableValue(callRecordingInProgress$);
};

export const useDominantSpeaker = () => {
  const { dominantSpeaker$ } = useStore();
  return useObservableValue(dominantSpeaker$);
};

export const useActiveCall = () => {
  const { activeCall$ } = useStore();
  return useObservableValue(activeCall$);
};

export const useActiveRingCall = () => {
  const { activeRingCallMeta$ } = useStore();
  return useObservableValue(activeRingCallMeta$);
};

export const useTerminatedRingCall = () => {
  const { terminatedRingCallMeta$ } = useStore();
  return useObservableValue(terminatedRingCallMeta$);
};

export const useActiveRingCallDetails = () => {
  const { activeRingCallDetails$ } = useStore();
  return useObservableValue(activeRingCallDetails$);
};

export const useIncomingRingCalls = () => {
  const { incomingRingCalls$ } = useStore();
  return useObservableValue(incomingRingCalls$);
};

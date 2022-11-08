import { useObservableValue, useStore } from './useStore';

export const useParticipants = () => {
  const { activeCallParticipants$ } = useStore();
  return useObservableValue(activeCallParticipants$);
};

export const useLocalParticipant = () => {
  const { localParticipant$ } = useStore();
  return useObservableValue(localParticipant$);
};

export const useRemoteParticipants = () => {
  const { remoteParticipants$ } = useStore();
  return useObservableValue(remoteParticipants$);
};

import { useObservableValue } from './helpers/useObservableValue';
import { useStore } from './store';

export const useParticipants = () => {
  const { participants$ } = useStore();
  return useObservableValue(participants$);
};

export const useLocalParticipant = () => {
  const { localParticipant$ } = useStore();
  return useObservableValue(localParticipant$);
};

export const useRemoteParticipants = () => {
  const { remoteParticipants$ } = useStore();
  return useObservableValue(remoteParticipants$);
};

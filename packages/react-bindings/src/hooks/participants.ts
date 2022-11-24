import { useObservableValue } from './helpers/useObservableValue';
import { useStore } from './store';

export const useParticipants = () => {
  const { activeCallAllParticipants$ } = useStore();
  return useObservableValue(activeCallAllParticipants$);
};

export const useLocalParticipant = () => {
  const { activeCallLocalParticipant$ } = useStore();
  return useObservableValue(activeCallLocalParticipant$);
};

export const useRemoteParticipants = () => {
  const { activeCallRemoteParticipants$ } = useStore();
  return useObservableValue(activeCallRemoteParticipants$);
};

export const useLatestStats = () => {
  const { participantStats$ } = useStore();
  return useObservableValue(participantStats$);
};

import { useObservableValue, useStore } from './useStore';

export const useParticipants = () => {
  const { activeCallParticipants$ } = useStore();
  return useObservableValue(activeCallParticipants$);
};

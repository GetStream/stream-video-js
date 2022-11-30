import { useObservableValue, useStore } from './useStore';

export const useActiveCall = () => {
  const { activeCall$ } = useStore();
  return useObservableValue(activeCall$);
};

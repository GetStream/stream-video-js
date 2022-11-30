import { useObservableValue, useStore } from './useStore';

export const useOutgoingCalls = () => {
  const { outgoingCalls$ } = useStore();
  return useObservableValue(outgoingCalls$);
};

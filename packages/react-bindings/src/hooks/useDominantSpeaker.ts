import { useObservableValue, useStore } from './useStore';

export const useDominantSpeaker = () => {
  const { dominantSpeaker$ } = useStore();
  return useObservableValue(dominantSpeaker$);
};

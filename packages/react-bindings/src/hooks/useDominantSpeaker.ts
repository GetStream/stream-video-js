import { useObservableValue } from './helpers/useObservableValue';
import { useStore } from './useStore';

export const useDominantSpeaker = () => {
  const { dominantSpeaker$ } = useStore();
  return useObservableValue(dominantSpeaker$);
};

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

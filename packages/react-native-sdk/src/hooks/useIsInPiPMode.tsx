import { useSyncExternalStore } from 'react';
import { isInPiPMode$ } from '../utils/internal/pipState';

const subscribe = (onChange: () => void) => {
  const subscription = isInPiPMode$.subscribe(onChange);
  return () => subscription.unsubscribe();
};

const getSnapshot = () => isInPiPMode$.getValue();

export function useIsInPiPMode() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

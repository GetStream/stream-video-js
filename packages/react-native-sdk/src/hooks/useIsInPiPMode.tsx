import { useEffect, useState } from 'react';
import { RxUtils } from '@stream-io/video-client';
import { isInPiPModeAndroid$ } from '../utils/internal/rxSubjects';

export function useIsInPiPMode() {
  const [value, setValue] = useState<boolean>(() => {
    return RxUtils.getCurrentValue(isInPiPModeAndroid$);
  });

  useEffect(() => {
    const subscription = isInPiPModeAndroid$.subscribe({
      next: setValue,
      error: (err) => {
        console.log('An error occurred while reading isInPiPModeAndroid$', err);
        setValue(false);
      },
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return value;
}

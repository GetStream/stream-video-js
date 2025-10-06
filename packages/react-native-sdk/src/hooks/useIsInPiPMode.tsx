import { useEffect, useState } from 'react';
import { RxUtils } from '@stream-io/video-client';
import { isInPiPMode$ } from '../utils/internal/rxSubjects';

export function useIsInPiPMode() {
  const [value, setValue] = useState<boolean>(() => {
    return RxUtils.getCurrentValue(isInPiPMode$);
  });

  useEffect(() => {
    const subscription = isInPiPMode$.subscribe({
      next: setValue,
      error: (err) => {
        console.log('An error occurred while reading isInPiPMode$', err);
        setValue(false);
      },
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return value;
}

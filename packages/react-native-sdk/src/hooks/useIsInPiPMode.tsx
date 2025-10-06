import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { RxUtils } from '@stream-io/video-client';
import {
  isInPiPModeAndroid$,
  isInPiPModeiOS$,
} from '../utils/internal/rxSubjects';

export function useIsInPiPMode() {
  const [value, setValue] = useState<boolean>(() => {
    return RxUtils.getCurrentValue(isInPiPModeAndroid$);
  });

  useEffect(() => {
    if (Platform.OS === 'ios') {
      const subscription = isInPiPModeiOS$.subscribe({
        next: setValue,
        error: (err) => {
          console.log('An error occurred while reading isInPiPModeiOS$', err);
          setValue(false);
        },
      });
      return () => {
        subscription.unsubscribe();
      };
    } else {
      const subscription = isInPiPModeAndroid$.subscribe({
        next: setValue,
        error: (err) => {
          console.log(
            'An error occurred while reading isInPiPModeAndroid$',
            err,
          );
          setValue(false);
        },
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  return value;
}

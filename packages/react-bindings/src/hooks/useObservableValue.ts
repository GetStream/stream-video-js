import type { Observable } from 'rxjs';
import { useEffect, useState } from 'react';
import { RxUtils } from '@stream-io/video-client';

/**
 * Utility hook which provides the current value of the given observable.
 *
 * @param observable$ the observable to read data from.
 * @param defaultValue a default value. Used when the observable data can't be read or emits an error.
 */
export const useObservableValue = <T>(
  observable$: Observable<T>,
  defaultValue?: T,
) => {
  const [value, setValue] = useState<T>(() => {
    try {
      return RxUtils.getCurrentValue(observable$);
    } catch (err) {
      if (typeof defaultValue === 'undefined') throw err;
      return defaultValue;
    }
  });

  useEffect(() => {
    return RxUtils.createSubscription(observable$, setValue, (err) => {
      console.log('An error occurred while reading an observable', err);
      if (defaultValue) setValue(defaultValue);
    });
  }, [defaultValue, observable$]);

  return value;
};

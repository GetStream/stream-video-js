import type { Observable } from 'rxjs';
import { useCallback } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { RxUtils } from '@stream-io/video-client';

/**
 * Utility hook which provides the current value of the given observable.
 *
 * @param observable$ the observable to read data from.
 * @param defaultValue a default value. Used when the observable data can't be read or emits an error - must be stable.
 */
export const useObservableValue = <T>(
  observable$: Observable<T>,
  defaultValue?: T,
) => {
  const getSnapshot = useCallback(() => {
    try {
      return RxUtils.getCurrentValue(observable$);
    } catch (error) {
      if (typeof defaultValue === 'undefined') throw error;
      return defaultValue;
    }
  }, [defaultValue, observable$]);

  const subscribe = useCallback(
    (onStoreChange: (v: T) => void) => {
      const unsubscribe = RxUtils.createSubscription(
        observable$,
        onStoreChange,
        (error) => {
          console.log('An error occurred while reading an observable', error);

          if (defaultValue) onStoreChange(defaultValue);
        },
      );

      return unsubscribe;
    },
    [defaultValue, observable$],
  );

  return useSyncExternalStore(subscribe, getSnapshot);
};

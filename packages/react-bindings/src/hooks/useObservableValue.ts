import type { Observable } from 'rxjs';
import { useCallback, useRef } from 'react';
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
): T => {
  const initialRenderRef = useRef(false);
  const valueRef = useRef<T | undefined>(undefined);
  if (valueRef.current === undefined && !initialRenderRef.current) {
    initialRenderRef.current = true;
    try {
      valueRef.current = RxUtils.getCurrentValue(observable$);
    } catch (error) {
      if (typeof defaultValue === 'undefined') throw error;
      valueRef.current = defaultValue;
    }
  }

  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      RxUtils.createSubscription(
        observable$,
        (value: T) => {
          valueRef.current = value;
          onStoreChange();
        },
        (err) => console.log('Failed to read an observable', err),
      ),
    [observable$],
  );

  const getSnapshot = useCallback(() => valueRef.current as T, []);
  return useSyncExternalStore(subscribe, getSnapshot);
};

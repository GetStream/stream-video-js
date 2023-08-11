import type { Observable } from 'rxjs';
import { useEffect, useState } from 'react';
import { RxUtils } from '@stream-io/video-client';

/**
 * Utility hook which provides the current value of the given observable.
 * @internal
 */
export const useObservableValue = <T>(observable$: Observable<T>) => {
  const [value, setValue] = useState<T>(() =>
    RxUtils.getCurrentValue(observable$),
  );
  useEffect(() => {
    const subscription = observable$.subscribe(setValue);
    return () => {
      subscription.unsubscribe();
    };
  }, [observable$]);

  return value;
};

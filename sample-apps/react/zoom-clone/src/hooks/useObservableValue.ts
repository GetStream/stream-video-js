import type { Observable } from 'rxjs';
import { useEffect, useState } from 'react';

export const useObservableValue = <T>(observable$: Observable<T>) => {
  const [value, setValue] = useState<T>();
  useEffect(() => {
    const subscription = observable$.subscribe(setValue);
    return () => {
      subscription.unsubscribe();
    };
  }, [observable$]);

  return value;
};

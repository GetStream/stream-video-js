import { useEffect, useState } from 'react';
import { Observable, take } from 'rxjs';

export const useObservableValue = <T>(observable$: Observable<T>) => {
  const [value, setValue] = useState<T>(() => getCurrentValue(observable$));
  useEffect(() => {
    const subscription = observable$.subscribe(setValue);
    return () => subscription.unsubscribe();
  }, [observable$]);

  return value;
};

const getCurrentValue = <T>(observable$: Observable<T>) => {
  let value!: T;
  observable$.pipe(take(1)).subscribe((v) => (value = v));

  return value;
};

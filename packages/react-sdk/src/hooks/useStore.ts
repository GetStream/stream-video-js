import { useEffect, useState } from 'react';
import { Observable, take } from 'rxjs';
import { useStreamVideoClient } from '../StreamVideo';

export const useStore = () => {
  const client = useStreamVideoClient();
  if (!client) {
    throw new Error(
      `StreamVideoClient isn't initialized or this hook is called outside of <StreamVideo> context.`,
    );
  }

  return client.readOnlyStateStore;
};

export const useObservableValue = <T>(observable$: Observable<T>) => {
  const [value, setValue] = useState<T>(() => getCurrentValue(observable$));
  useEffect(() => {
    const subscription = observable$.subscribe(setValue);
    return subscription.unsubscribe;
  }, [observable$]);

  return value;
};

// FIXME OL: duplicate of StreamVideoReadOnlyStateStore.getCurrentValue, perhaps export as an util?
const getCurrentValue = <T>(observable$: Observable<T>) => {
  let value!: T;
  observable$.pipe(take(1)).subscribe((v) => (value = v));

  return value;
};

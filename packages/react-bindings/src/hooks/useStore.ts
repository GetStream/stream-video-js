import { useEffect, useState } from 'react';
import { Observable } from 'rxjs';
import { useStreamVideoClient } from '../contexts';

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
  const [value, setValue] = useState<T>();
  useEffect(() => {
    const subscription = observable$.subscribe(setValue);
    return () => subscription.unsubscribe();
  }, [observable$]);

  return value;
};

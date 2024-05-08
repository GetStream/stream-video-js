import { useCallback, useEffect, useRef, useState } from 'react';

interface Toggleable {
  toggle: () => Promise<void>;
}

export function useOptimisticDeviceStatus(
  isMute: boolean,
  manager: Toggleable,
) {
  const [optimisticIsMute, setOptimisticIsMute] = useState(isMute);
  const requestPromise = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (optimisticIsMute !== isMute && requestPromise.current === null) {
      requestPromise.current = manager.toggle().finally(() => {
        requestPromise.current = null;
      });
    }
  }, [manager, optimisticIsMute, isMute]);

  const toggle = useCallback(
    () => setOptimisticIsMute((prevStatus) => !prevStatus),
    [],
  );

  return {
    toggle,
    optimisticIsMute,
  };
}

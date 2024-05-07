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
    console.log({ optimisticIsMute, isMute });
    if (optimisticIsMute !== isMute && requestPromise.current === null) {
      requestPromise.current = manager.toggle().then(() => {
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

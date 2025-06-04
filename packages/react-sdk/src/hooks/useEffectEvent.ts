import { useCallback, useLayoutEffect, useRef } from 'react';

export function useEffectEvent<P extends unknown[]>(
  cb: ((...args: P) => void) | undefined,
): (...args: P) => void {
  const cbRef = useRef<((...args: P) => void) | undefined>(undefined);

  useLayoutEffect(() => {
    cbRef.current = cb;
  }, [cb]);

  return useCallback((...args: P) => {
    const callback = cbRef.current;
    callback?.(...args);
  }, []);
}

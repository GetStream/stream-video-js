import {
  useCallback,
  useLayoutEffect,
  useRef,
  useEffectEvent as BuiltInHook,
} from 'react';

function useEffectEventShim<T extends (...args: any[]) => any>(
  cb: T,
): (...funcArgs: Parameters<T>) => ReturnType<T> {
  const cbRef = useRef(cb);

  useLayoutEffect(() => {
    cbRef.current = cb;
  }, [cb]);

  return useCallback((...args: Parameters<T>) => {
    const callback = cbRef.current;
    return callback(...args);
  }, []);
}

export const useEffectEvent = BuiltInHook ?? useEffectEventShim;

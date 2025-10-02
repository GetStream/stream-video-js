import * as React from 'react';

function useEffectEventShim<T extends (...args: any[]) => any>(
  cb: T,
): (...funcArgs: Parameters<T>) => ReturnType<T> {
  const cbRef = React.useRef(cb);

  React.useLayoutEffect(() => {
    cbRef.current = cb;
  }, [cb]);

  return React.useCallback((...args: Parameters<T>) => {
    const callback = cbRef.current;
    return callback(...args);
  }, []);
}

export const useEffectEvent = React.useEffectEvent ?? useEffectEventShim;

import { useMemo } from 'react';

/**
 * Internal purpose hook. Enables certain dev mode tools.
 */
export const useIsDebugMode = () => {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return !!params.get('debug') || false;
  }, []);
};

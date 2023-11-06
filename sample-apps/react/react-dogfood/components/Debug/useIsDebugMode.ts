import { useMemo } from 'react';

const useQueryParams = () =>
  useMemo(
    () =>
      typeof window === 'undefined'
        ? null
        : new URLSearchParams(window.location.search),
    [],
  );

/**
 * Internal purpose hook. Enables certain development mode tools.
 */
export const useIsDebugMode = () => {
  const params = useQueryParams();
  return !!params?.get('debug');
};

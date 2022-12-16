import { useMemo } from 'react';

const useQueryParams = () => {
  return useMemo(() => new URLSearchParams(window.location.search), []);
};

/**
 * Internal purpose hook. Enables certain development mode tools.
 */
export const useIsDebugMode = () => {
  const params = useQueryParams();
  return !!params.get('debug');
};

export const useDebugPreferredVideoCodec = () => {
  const params = useQueryParams();
  return params.get('video_codec');
};

import { useSearchParams } from 'next/navigation';

/**
 * Internal purpose hook. Enables certain development mode tools.
 */
export const useIsDebugMode = () => {
  const params = useSearchParams();
  return !!params.get('debug');
};

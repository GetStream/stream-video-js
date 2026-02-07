import { useEffect, useRef, useState } from 'react';

type INoiseCancellation =
  import('@stream-io/audio-filters-web').INoiseCancellation;

/**
 * Hook that lazily loads the noise cancellation module from @stream-io/audio-filters-web.
 * Returns the NoiseCancellation instance when loaded, or undefined if unavailable.
 * The `loaded` flag becomes `true` once loading completes (even on failure).
 */
export const useNoiseCancellationLoader = () => {
  const [noiseCancellation, setNoiseCancellation] =
    useState<INoiseCancellation>();
  const [loaded, setLoaded] = useState(false);
  const ncLoader = useRef<Promise<void> | undefined>(undefined);

  useEffect(() => {
    const load = (ncLoader.current || Promise.resolve())
      .then(() => import('@stream-io/audio-filters-web'))
      .then(({ NoiseCancellation }) => {
        const nc = new NoiseCancellation({});
        setNoiseCancellation(nc);
      })
      .catch((err) => {
        console.warn(
          '[EmbeddedStreamClient] Failed to load noise cancellation. ' +
            'Make sure @stream-io/audio-filters-web is installed.',
          err,
        );
      })
      .finally(() => {
        setLoaded(true);
      });

    return () => {
      ncLoader.current = load.then(() => {
        setNoiseCancellation(undefined);
        setLoaded(false);
      });
    };
  }, []);

  return { noiseCancellation, loaded };
};

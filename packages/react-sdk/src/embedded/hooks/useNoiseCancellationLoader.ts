import { useEffect, useRef, useState } from 'react';

type INoiseCancellation =
  import('@stream-io/audio-filters-web').INoiseCancellation;

/**
 * Hook that lazily loads the noise cancellation module from @stream-io/audio-filters-web.
 * Returns the NoiseCancellation instance when loaded, or undefined while loading.
 */
export const useNoiseCancellationLoader = (enabled = true) => {
  const [noiseCancellation, setNoiseCancellation] =
    useState<INoiseCancellation>();
  const ncLoader = useRef<Promise<void> | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

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
      });

    return () => {
      ncLoader.current = load.then(() => setNoiseCancellation(undefined));
    };
  }, [enabled]);

  return noiseCancellation;
};

import { useEffect, useRef, useState } from 'react';
import { type Call } from '@stream-io/video-client';
import type { NoiseCancellationProviderName } from '../types';

type INoiseCancellation =
  import('@stream-io/audio-filters-web').INoiseCancellation;

/**
 * Hook that lazily loads the noise cancellation module from @stream-io/audio-filters-web.
 * Skips loading if the server-side noise cancellation setting is disabled.
 * Returns the NoiseCancellation instance when loaded, or undefined if unavailable.
 * The `ready` flag becomes `true` once loading completes (even on failure),
 * or immediately if noise cancellation is disabled by server settings.
 */
export const useNoiseCancellationLoader = (
  call?: Call,
  provider: NoiseCancellationProviderName = 'krisp',
) => {
  const [noiseCancellation, setNoiseCancellation] =
    useState<INoiseCancellation>();
  const [ready, setReady] = useState(false);
  const ncLoader = useRef<Promise<void> | undefined>(undefined);

  const ncSettings = call?.state.settings?.audio?.noise_cancellation;
  const isNoiseCancellationEnabled = !!(
    ncSettings && ncSettings.mode !== 'disabled'
  );

  useEffect(() => {
    if (!call) return;

    if (!isNoiseCancellationEnabled) {
      setNoiseCancellation(undefined);
      setReady(true);
      return;
    }

    // set by the cleanup: a newer effect run owns the instance from then on
    let stale = false;
    const load = (ncLoader.current || Promise.resolve())
      .then(() => import('@stream-io/audio-filters-web'))
      .then(({ NoiseCancellation, FastEnhancerNoiseCancellation }) => {
        if (stale) return;
        if (provider === 'fastenhancer') {
          // older versions of the package don't export it
          if (typeof FastEnhancerNoiseCancellation !== 'function') {
            console.warn(
              '[EmbeddedStreamClient] The FastEnhancer noise cancellation ' +
                'requires a version of @stream-io/audio-filters-web that ' +
                'exports FastEnhancerNoiseCancellation. ' +
                'Noise cancellation is unavailable.',
            );
            setNoiseCancellation(undefined);
            return;
          }
          setNoiseCancellation(new FastEnhancerNoiseCancellation());
          return;
        }
        setNoiseCancellation(new NoiseCancellation({}));
      })
      .catch((err) => {
        console.warn(
          '[EmbeddedStreamClient] Failed to load noise cancellation. ' +
            'Make sure @stream-io/audio-filters-web is installed.',
          err,
        );
      })
      .finally(() => {
        setReady(true);
      });

    return () => {
      stale = true;
      // Keep the current instance until the next one replaces it, so that
      // NoiseCancellationProvider stays mounted and runs the old instance's
      // cleanup before initializing the new one. Unmounting it here would let
      // the old cleanup disable the replacement.
      ncLoader.current = load.then(() => {});
    };
  }, [call, isNoiseCancellationEnabled, provider]);

  return { noiseCancellation, ready };
};

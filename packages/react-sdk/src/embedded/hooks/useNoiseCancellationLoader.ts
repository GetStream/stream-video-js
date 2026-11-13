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
  provider?: NoiseCancellationProviderName,
) => {
  // Both are bound to the call they were loaded for, so that a previous
  // call's instance (being disposed by its provider) is never handed to a
  // new call, and a new call starts out not ready.
  const [loaded, setLoaded] = useState<{
    call: Call;
    noiseCancellation: INoiseCancellation;
  }>();
  const [readyFor, setReadyFor] = useState<Call>();
  const ncLoader = useRef<Promise<void> | undefined>(undefined);

  const ncSettings = call?.state.settings?.audio?.noise_cancellation;
  const isNoiseCancellationEnabled = !!(
    ncSettings && ncSettings.mode !== 'disabled'
  );

  useEffect(() => {
    if (!call) return;

    if (!isNoiseCancellationEnabled) {
      setLoaded(undefined);
      setReadyFor(call);
      return;
    }

    // set by the cleanup: a newer effect run owns the instance from then on
    let stale = false;
    const load = (ncLoader.current || Promise.resolve())
      .then(() => import('@stream-io/audio-filters-web'))
      .then((filters) => {
        const {
          NoiseCancellation,
          KrispNoiseCancellation,
          StreamNoiseCancellation,
        } = filters;
        if (stale) return;
        if (provider === 'stream') {
          // older versions of the package don't export it
          if (typeof StreamNoiseCancellation !== 'function') {
            console.warn(
              '[EmbeddedStreamClient] The Stream noise cancellation ' +
                'requires a version of @stream-io/audio-filters-web that ' +
                'exports StreamNoiseCancellation. ' +
                'Noise cancellation is unavailable.',
            );
            setLoaded(undefined);
            return;
          }
          setLoaded({ call, noiseCancellation: new StreamNoiseCancellation() });
          return;
        }
        if (
          provider === 'krisp' &&
          typeof KrispNoiseCancellation === 'function'
        ) {
          setLoaded({ call, noiseCancellation: new KrispNoiseCancellation() });
          return;
        }
        // no provider (or an older package without KrispNoiseCancellation):
        // the router runs the engine the call settings pick, Krisp by default
        setLoaded({ call, noiseCancellation: new NoiseCancellation({}) });
      })
      .catch((err) => {
        console.warn(
          '[EmbeddedStreamClient] Failed to load noise cancellation. ' +
            'Make sure @stream-io/audio-filters-web is installed.',
          err,
        );
      })
      .finally(() => {
        if (!stale) setReadyFor(call);
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

  const noiseCancellation =
    call && loaded?.call === call ? loaded.noiseCancellation : undefined;
  const ready = !!call && readyFor === call;
  return { noiseCancellation, ready };
};

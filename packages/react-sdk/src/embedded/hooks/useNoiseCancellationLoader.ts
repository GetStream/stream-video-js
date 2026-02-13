import { useEffect, useRef, useState } from 'react';
import {
  NoiseCancellationSettingsModeEnum,
  type Call,
} from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

type INoiseCancellation =
  import('@stream-io/audio-filters-web').INoiseCancellation;

/**
 * Hook that lazily loads the noise cancellation module from @stream-io/audio-filters-web.
 * Skips loading if the server-side noise cancellation setting is disabled.
 * Returns the NoiseCancellation instance when loaded, or undefined if unavailable.
 * The `ready` flag becomes `true` once loading completes (even on failure),
 * or immediately if noise cancellation is disabled by server settings.
 */
export const useNoiseCancellationLoader = (call?: Call) => {
  const [noiseCancellation, setNoiseCancellation] =
    useState<INoiseCancellation>();
  const [ready, setReady] = useState(false);
  const ncLoader = useRef<Promise<void> | undefined>(undefined);

  const { useCallSettings } = useCallStateHooks();
  const settings = useCallSettings();
  const ncSettings = settings?.audio?.noise_cancellation;
  const isNoiseCancellationEnabled = !!(
    ncSettings && ncSettings.mode !== NoiseCancellationSettingsModeEnum.DISABLED
  );

  useEffect(() => {
    if (!call) return;

    if (!isNoiseCancellationEnabled) {
      setReady(true);
      return;
    }

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
        setReady(true);
      });

    return () => {
      ncLoader.current = load.then(() => {
        setNoiseCancellation(undefined);
        setReady(false);
      });
    };
  }, [call, isNoiseCancellationEnabled]);

  return { noiseCancellation, ready };
};

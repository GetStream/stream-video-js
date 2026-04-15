import { useContext, useEffect, useRef } from 'react';
import { useCall } from '@stream-io/video-react-bindings';
import { BackgroundFiltersContext } from '../contexts/internal/BackgroundFiltersContext';

export interface ModerationOptions {
  /**
   * How long the moderation effect should stay active before being disabled.
   * Set to `0` to keep it active indefinitely. Defaults to 5000 ms.
   */
  duration?: number;
}

export const useModeration = (options?: ModerationOptions) => {
  const { duration = 5000 } = options || {};
  const call = useCall();

  // accessing the filters context directly, as it is optional, but our
  // useBackgroundFilters() throws an error if used outside the provider
  const filtersApi = useContext(BackgroundFiltersContext);
  const {
    isSupported = false,
    currentBackgroundFilter,
    applyBackgroundBlurFilter,
    applyBackgroundImageFilter,
    applyVideoBlurFilter,
    disableAllFilters,
  } = filtersApi || {};
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const restoreRef = useRef<Promise<void>>(undefined);
  useEffect(() => {
    if (!call) return;
    const unsubscribe = call.on('call.moderation_blur', () => {
      const turnCameraOff = () =>
        call.camera.disable().catch((err) => {
          console.error(`Failed to disable camera`, err);
        });

      // not scheduling a timeout to enable the camera
      clearTimeout(blurTimeoutRef.current);
      if (!isSupported) return turnCameraOff();

      restoreRef.current = (restoreRef.current || Promise.resolve()).then(() =>
        applyVideoBlurFilter?.('heavy').then(() => {
          if (duration <= 0) return;

          const restore = () => {
            const { blur, image } = currentBackgroundFilter || {};
            const action = blur
              ? applyBackgroundBlurFilter?.(blur)
              : image
                ? applyBackgroundImageFilter?.(image)
                : Promise.resolve(disableAllFilters?.());

            action?.catch((err) => {
              console.error(`Failed to restore pre-moderation effect`, err);
            });
          };

          blurTimeoutRef.current = setTimeout(restore, duration);
        }, turnCameraOff),
      );
    });
    return () => {
      unsubscribe();
    };
  }, [
    applyBackgroundBlurFilter,
    applyBackgroundImageFilter,
    applyVideoBlurFilter,
    call,
    currentBackgroundFilter,
    disableAllFilters,
    duration,
    isSupported,
  ]);

  useEffect(
    () => () => {
      restoreRef.current?.then(() => clearTimeout(blurTimeoutRef.current));
    },
    [],
  );
};

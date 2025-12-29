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

  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!call) return;
    const unsubscribe = call.on('call.moderation_blur', () => {
      clearTimeout(blurTimeoutRef.current);
      if (!filtersApi?.isSupported) {
        call.camera.disable().catch((err) => console.error(err));
        return; // not scheduling a timeout to enable the camera
      }

      const { blur, image } = filtersApi.currentBackgroundFilter || {};
      filtersApi.applyVideoBlurFilter('heavy');
      if (duration > 0) {
        blurTimeoutRef.current = setTimeout(() => {
          if (blur) {
            filtersApi.applyBackgroundBlurFilter(blur);
          } else if (image) {
            filtersApi.applyBackgroundImageFilter(image);
          } else {
            filtersApi.disableAllFilters();
          }
        }, duration);
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(blurTimeoutRef.current);
    };
  }, [call, duration, filtersApi]);
};

import { useCallback, useEffect, useRef } from 'react';
import { useCall } from '@stream-io/video-react-bindings';

type FullScreenBlurType =
  typeof import('@stream-io/video-filters-web').FullScreenBlur;

const isFullScreenBlurPlatformSupported = (): boolean => {
  if (
    typeof window === 'undefined' ||
    typeof OffscreenCanvas === 'undefined' ||
    typeof VideoFrame === 'undefined' ||
    !window.WebGL2RenderingContext
  ) {
    return false;
  }

  try {
    const canvas = new OffscreenCanvas(1, 1);
    return !!canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      desynchronized: true,
    });
  } catch {
    return false;
  }
};

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

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processorRef = useRef<InstanceType<FullScreenBlurType> | null>(null);
  const unregisterRef = useRef<(() => Promise<void>) | null>(null);

  const blurModulePromise = useRef<Promise<FullScreenBlurType> | null>(null);

  /**
   * Lazily loads and caches the video-filters-web module.
   */
  const loadVideoFiltersWebModule = useCallback(() => {
    if (!blurModulePromise.current) {
      blurModulePromise.current = import('@stream-io/video-filters-web')
        .then((module) => module.FullScreenBlur)
        .catch((error) => {
          console.error('[moderation] Failed to import blur module:', error);
          throw error;
        });
    }

    return blurModulePromise.current;
  }, []);

  const disableBlur = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    unregisterRef
      .current?.()
      .catch((err) => console.error('[moderation] unregister error:', err));

    unregisterRef.current = null;
  }, []);

  const handleFallback = useCallback(async () => {
    try {
      await call?.camera.disable();
    } catch (error) {
      console.error('[moderation] Failed to disable camera:', error);
    }
  }, [call]);

  useEffect(() => {
    if (!call) return;

    return call.on('call.moderation_warning', async () => {
      try {
        await loadVideoFiltersWebModule();
      } catch (importErr) {
        console.error('[moderation] Failed to import blur module:', importErr);
      }
    });
  }, [call, loadVideoFiltersWebModule]);

  useEffect(() => {
    if (!call) return;

    return call.on('call.moderation_blur', async () => {
      if (unregisterRef.current) return;

      let FullScreenBlurClass: FullScreenBlurType;

      try {
        FullScreenBlurClass = await loadVideoFiltersWebModule();
      } catch (importErr) {
        console.error('[moderation] Failed to import blur module:', importErr);
        await handleFallback();
        return;
      }

      if (!isFullScreenBlurPlatformSupported()) {
        console.warn('[moderation] Blur not supported on this platform');
        await handleFallback();
        return;
      }

      const { unregister } = call.camera.registerFilter((inputStream) => {
        unregisterRef.current = unregister;

        const outputPromise = new Promise<MediaStream>(
          async (resolve, reject) => {
            const [track] = inputStream.getVideoTracks();

            let processor: InstanceType<FullScreenBlurType>;

            try {
              processor = new FullScreenBlurClass(track);
              processorRef.current = processor;

              const result = await processor.start();
              const output = new MediaStream([result]);
              resolve(output);

              if (duration > 0) {
                timeoutRef.current = setTimeout(disableBlur, duration);
              }
            } catch (error) {
              reject(error);
              console.error('[moderation] Processor init failed:', error);

              await unregisterRef.current?.();
              unregisterRef.current = null;
              processorRef.current = null;

              await handleFallback();
              return;
            }
          },
        );

        return {
          output: outputPromise,
          stop: () => {
            if (processorRef.current) {
              processorRef.current.stop();
              processorRef.current = null;
            }
          },
        };
      });
    });
  }, [call, loadVideoFiltersWebModule, disableBlur, handleFallback, duration]);

  useEffect(() => disableBlur, [disableBlur]);
};

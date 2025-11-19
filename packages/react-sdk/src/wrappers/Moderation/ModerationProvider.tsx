import { PropsWithChildren, useCallback, useEffect, useRef } from 'react';
import { useCall } from '@stream-io/video-react-bindings';
import {
  FullScreenBlur,
  ModerationBlurIntensity,
} from '@stream-io/video-filters-web';

export interface ModerationProviderProps {
  /**
   * Strength of the blur effect.
   */
  blurIntensity?: ModerationBlurIntensity;
  /**
   * Duration (in milliseconds) to keep the blur active before automatically disabling it.
   * Set to `0` to keep the blur enabled indefinitely.
   *
   * @default 5000
   */
  blurTimeout?: number;
}

/**
 * Adds a temporary blur effect to the user’s camera whenever the call
 * emits a `call.moderation_blur` event. It starts a FullScreenBlur
 * processor on the outgoing video track, keeps it active for the
 * configured timeout, and then removes it. If the component unmounts
 * or another blur is already active, it safely cleans up and ignores
 * duplicate events.
 */
export const ModerationProvider = (
  props: PropsWithChildren<ModerationProviderProps>,
) => {
  const { children, blurIntensity, blurTimeout = 5000 } = props;

  const call = useCall();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processorRef = useRef<FullScreenBlur | null>(null);
  const unregisterRef = useRef<(() => Promise<void>) | null>(null);

  const isActive = useRef<boolean>(false);

  const disableBlur = useCallback(() => {
    isActive.current = false;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    unregisterRef
      .current?.()
      .catch((err) =>
        console.error('[ModerationProvider] unregister error', err),
      );

    unregisterRef.current = null;
    processorRef.current = null;
  }, []);

  useEffect(() => {
    if (!call) return;

    return call.on('call.moderation_blur', () => {
      if (unregisterRef.current || isActive.current) return;

      isActive.current = true;

      const { unregister } = call.camera.registerFilter((inputStream) => {
        const [track] = inputStream.getVideoTracks();

        const processor = new FullScreenBlur(track, {
          blurIntensity,
        });
        processorRef.current = processor;

        const outputPromise = new Promise<MediaStream>((resolve, reject) => {
          processor
            .start()
            .then((processedTrack) => {
              const outputStream = new MediaStream([processedTrack]);
              resolve(outputStream);

              unregisterRef.current = unregister;
              if (blurTimeout > 0) {
                timeoutRef.current = setTimeout(disableBlur, blurTimeout);
              }
            })
            .catch(async (error) => {
              console.error(
                '[ModerationProvider] processor start failed',
                error,
              );

              processorRef.current = null;
              reject(error);
            });
        });

        return {
          output: outputPromise,
          stop: () => {
            if (processorRef.current === processor) {
              processorRef.current.stop();
              processorRef.current = null;
            }
          },
        };
      });
    });
  }, [call, blurIntensity, blurTimeout, disableBlur]);

  useEffect(() => disableBlur, [disableBlur]);

  return <>{children}</>;
};

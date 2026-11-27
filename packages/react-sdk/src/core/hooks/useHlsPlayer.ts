import { useLayoutEffect } from 'react';
import { type HlsPlayback, videoLoggerSystem } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

/**
 * Plays the call's HLS stream in `videoElement` while the call is on HLS
 * playback, and stops it on unmount. hls.js is loaded only then.
 *
 * Internal: apps use `<HlsVideo />`.
 *
 * @param videoElement the `<video>` to play the stream in.
 */
export const useHlsPlayer = (videoElement: HTMLVideoElement | null) => {
  const call = useCall();
  const { usePlaybackType } = useCallStateHooks();
  // the call follows a restarted broadcast to its new URL by itself
  const isHls = usePlaybackType().type === 'hls';

  useLayoutEffect(() => {
    if (!call || !videoElement || !isHls) return;

    let cancelled = false;
    let playback: HlsPlayback | undefined;

    const register = async () => {
      try {
        const { default: Hls } = await import('hls.js');
        if (cancelled) return;
        playback = call.registerHlsPlayer(Hls, videoElement);
      } catch (err) {
        if (cancelled) return;
        const error = err instanceof Error ? err : new Error(String(err));
        videoLoggerSystem
          .getLogger('useHlsPlayer')
          .error('Failed to start HLS playback', error);
      }
    };

    void register();

    return () => {
      cancelled = true;
      playback?.unregister();
    };
  }, [call, videoElement, isHls]);
};

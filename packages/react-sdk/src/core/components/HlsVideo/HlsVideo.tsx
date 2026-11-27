import { ComponentPropsWithoutRef, useState } from 'react';
import clsx from 'clsx';
import { useHlsPlayer } from '../../hooks/useHlsPlayer';

/**
 * The props of {@link HlsVideo}: the `<video>` element's own props, and a way
 * to get the element.
 *
 * @beta
 */
export type HlsVideoProps = ComponentPropsWithoutRef<'video'> & {
  /**
   * An object with setRef functions meant for exposing the internal elements
   * of this component.
   */
  refs?: {
    /**
     * The `<video>` that plays the stream.
     * @param element the video element.
     */
    setVideoElement?: (element: HTMLVideoElement | null) => void;
  };
};

/**
 * Plays the call's HLS stream in a `<video>`, when the server sent this
 * viewer to HLS at join time. While the call is on WebRTC, the `<video>`
 * stays empty: render the participants instead.
 *
 * ```tsx
 * const call = useCall();
 * const { usePlaybackType, useHlsPlaybackState, useIsAutoplayBlocked } =
 *   useCallStateHooks();
 * const { type } = usePlaybackType();
 * const { state, error } = useHlsPlaybackState();
 * const isAutoplayBlocked = useIsAutoplayBlocked();
 * if (type !== 'hls') return <MyParticipants />;
 * return (
 *   <>
 *     <HlsVideo className="my-video" />
 *     {state === 'buffering' && <Spinner />}
 *     {isAutoplayBlocked && (
 *       <button onClick={() => call.resumeAudio()}>Tap to play</button>
 *     )}
 *   </>
 * );
 * ```
 *
 * It has no controls: build them with `useHlsPlaybackState()` and
 * `useIsAutoplayBlocked()`. When the browser blocks autoplay, start the
 * stream with `call.resumeAudio()` from a user gesture; any tap on the page
 * starts it too.
 *
 * A call has one HLS player: a newer `<HlsVideo />` takes over from the
 * previous one. hls.js ships with the SDK and is loaded only when HLS
 * playback starts. To play the stream in a `<video>` you create yourself,
 * use `call.registerHlsPlayer()`.
 *
 * @beta
 */
export const HlsVideo = ({ className, refs, ...rest }: HlsVideoProps) => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null,
  );

  useHlsPlayer(videoElement);

  return (
    <video
      playsInline
      {...rest}
      className={clsx('str-video__hls-video', className)}
      ref={(element) => {
        setVideoElement(element);
        refs?.setVideoElement?.(element);
      }}
    />
  );
};

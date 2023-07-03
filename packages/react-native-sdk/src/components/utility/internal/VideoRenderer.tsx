import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { MediaStream, RTCView } from 'react-native-webrtc';

/**
 * Props to be passed for the VideoRenderer component.
 */
export interface VideoRendererProps {
  /**
   * The stream that should be rendered.
   */
  mediaStream: MediaStream;
  /**
   * Indicates whether the video should be
   * mirrored during rendering. Commonly, applications choose to mirror the
   * user-facing camera.
   *
   * @defaultValue
   * The default is `false`
   */
  mirror?: boolean;
  /**
   * Similarly to the CSS property z-index, specifies the z-order of this
   * `RTCView` in the stacking space of all `RTCView`s. When `RTCView`s overlap,
   * `zOrder` determines which one covers the other. An `RTCView` with a larger
   * `zOrder` generally covers an RTCView with a lower one.
   *
   * Non-overlapping `RTCView`s may safely share a z-order (because one does not
   * have to cover the other).
   *
   * The support for `zOrder` is platform-dependent and/or
   * implementation-specific. Thus, specifying a value for `zOrder` is to be
   * thought of as giving a hint rather than as imposing a requirement. For
   * example, video renderers such as `RTCView` are commonly implemented using
   * OpenGL and OpenGL views may have different numbers of layers in their
   * stacking space. android has three: a layer bellow the window (aka
   * default), a layer bellow the window again but above the previous layer
   * (aka media overlay), and above the window. Consequently, it is advisable
   * to limit the number of utilized layers in the stacking space to the
   * minimum sufficient for the desired display. For example, a video call
   * application usually needs a maximum of two `zOrder` values: 0 for the
   * remote one or more videos which appear in the background, and 1 for the local
   * one or more videos which appear above the remote one or more videos.
   */
  zOrder?: number;
  /**
   * In the fashion of
   * https://www.w3.org/TR/html5/embedded-content-0.html#dom-video-videowidth
   * and https://www.w3.org/TR/html5/rendering.html#video-object-fit,
   * resembles the CSS style object-fit.
   *
   * @defaultValue
   * The default is `cover`
   */
  objectFit?: 'contain' | 'cover';
  /**
   * Style to override the default style of the `RTCView`.
   * @defaultValue
   * The default is `{ flex: 1 }`
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Lower level component, that represents only the video part (wrapper around the WebRTC)
 * //Todo: SG: add photo's with all states
 */
export const VideoRenderer = (props: VideoRendererProps) => {
  const {
    mediaStream,
    mirror = false,
    style = { flex: 1 },
    zOrder = undefined,
    objectFit = 'cover',
  } = props;
  return (
    <RTCView
      streamURL={mediaStream?.toURL()}
      mirror={mirror}
      style={style}
      objectFit={objectFit}
      zOrder={zOrder}
    />
  );
};

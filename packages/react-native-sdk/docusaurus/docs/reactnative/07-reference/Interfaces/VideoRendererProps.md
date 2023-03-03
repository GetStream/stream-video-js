# VideoRendererProps

Props to be passed for the VideoRenderer component.

## Properties

### mediaStream

• **mediaStream**: `default`

The stream that should be rendered.

#### Defined in

[src/components/VideoRenderer.tsx:12](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/components/VideoRenderer.tsx#L12)

___

### mirror

• `Optional` **mirror**: `boolean`

Indicates whether the video should be
mirrored during rendering. Commonly, applications choose to mirror the
user-facing camera.

**`Default Value`**

The default is `false`

#### Defined in

[src/components/VideoRenderer.tsx:21](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/components/VideoRenderer.tsx#L21)

___

### objectFit

• `Optional` **objectFit**: ``"contain"`` \| ``"cover"``

In the fashion of
https://www.w3.org/TR/html5/embedded-content-0.html#dom-video-videowidth
and https://www.w3.org/TR/html5/rendering.html#video-object-fit,
resembles the CSS style object-fit.

**`Default Value`**

The default is `cover`

#### Defined in

[src/components/VideoRenderer.tsx:55](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/components/VideoRenderer.tsx#L55)

___

### style

• `Optional` **style**: `StyleProp`<`ViewStyle`\>

Style to override the default style of the `RTCView`.

**`Default Value`**

The default is `{ flex: 1 }`

#### Defined in

[src/components/VideoRenderer.tsx:61](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/components/VideoRenderer.tsx#L61)

___

### zOrder

• `Optional` **zOrder**: `number`

Similarly to the CSS property z-index, specifies the z-order of this
`RTCView` in the stacking space of all `RTCView`s. When `RTCView`s overlap,
`zOrder` determines which one covers the other. An `RTCView` with a larger
`zOrder` generally covers an RTCView with a lower one.

Non-overlapping `RTCView`s may safely share a z-order (because one does not
have to cover the other).

The support for `zOrder` is platform-dependent and/or
implementation-specific. Thus, specifying a value for `zOrder` is to be
thought of as giving a hint rather than as imposing a requirement. For
example, video renderers such as `RTCView` are commonly implemented using
OpenGL and OpenGL views may have different numbers of layers in their
stacking space. android has three: a layer bellow the window (aka
default), a layer bellow the window again but above the previous layer
(aka media overlay), and above the window. Consequently, it is advisable
to limit the number of utilized layers in the stacking space to the
minimum sufficient for the desired display. For example, a video call
application usually needs a maximum of two `zOrder` values: 0 for the
remote one or more videos which appear in the background, and 1 for the local
one or more videos which appear above the remote one or more videos.

#### Defined in

[src/components/VideoRenderer.tsx:45](https://github.com/GetStream/stream-video-js/blob/a5ad0d43/packages/react-native-sdk/src/components/VideoRenderer.tsx#L45)

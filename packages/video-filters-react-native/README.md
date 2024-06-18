# @stream-io/video-filters-react-native

Video Filters for React Native WebRTC

## Installation

```sh
npm install @stream-io/video-filters-react-native @stream-io/react-native-webrtc
```

## Usage

```ts
import { registerBackgroundBlurVideoFilters, registerVirtualBackgroundFilter } from '@stream-io/video-filters-react-native'

// step 1: register your filters for once in your app's lifecycle
await registerBackgroundBlurVideoFilters();
const imageOneUri = await registerVirtualBackgroundFilter({ uri: 'https://example.com/path/to/remoteImage.png' })
const imageTwoUri = await registerVirtualBackgroundFilter(require('../path/to/localImage.jpg'))

// step 2: apply the filter to the local media stream
function setMediumBlurFilter() {
    // the names of background filters are 'BackgroundBlurLight', 'BackgroundBlurMedium' and 'BackgroundBlurHeavy'
    localMediaStream?.getVideoTracks()
        .forEach((track) => {
            track._setVideoEffect('BackgroundBlurMedium');
        });
}

function setImageBackgroundFilter(uri: string) {
    // the filter name is derived from the image uri
    const filterName = `VirtualBackground-${imageUri}`
    localMediaStream?.getVideoTracks()
        .forEach((track) => {
            track._setVideoEffect(filterName);
        });
}

// to remove all filters 
function clearVideoFilters() {
    // pass null as the filter name to clear the video filters
    localMediaStream?.getVideoTracks()
        .forEach((track) => {
            track._setVideoEffect(null);
        });
}
```

## Much easier to use with Stream Video React Native SDK

The Stream Video React Native SDK is a comprehensive toolkit designed to help you swiftly implement features such as video calling, audio calling, audio rooms, and live streaming within your app. It uses this library and exposes APIs to directly apply video filters to your media stream. For more details on video filter usage in the SDK, please visit https://getstream.io/video/docs/reactnative/advanced/apply-video-filters/. The website also explains how to add your custom video filters to your app.

## Preview

Preview of background blur filter  | Preview of background image replacement filter
:-------------------------:|:-------------------------:
![](../../packages/react-native-sdk/docusaurus/docs/reactnative/assets/06-advanced/10-apply-video-filters/preview-blur-filter.png)  |  ![](../../packages/react-native-sdk/docusaurus/docs/reactnative/assets/06-advanced/10-apply-video-filters/preview-image-filter.png) 

--- 

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
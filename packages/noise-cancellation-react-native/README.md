# @stream-io/noise-cancellation-react-native

Noise Cancellation for React Native WebRTC

## Installation

```sh
npm install @stream-io/noise-cancellation-react-native @stream-io/react-native-webrtc
```

## Usage

```ts
import {
  registerBackgroundBlurVideoFilters,
  registerVirtualBackgroundFilter,
} from '@stream-io/video-filters-react-native';

// step 1: register your filters for once in your app's lifecycle
await registerBackgroundBlurVideoFilters();
const imageOneUri = await registerVirtualBackgroundFilter({
  uri: 'https://example.com/path/to/remoteImage.png',
});
const imageTwoUri = await registerVirtualBackgroundFilter(
  require('../path/to/localImage.jpg'),
);

// step 2: apply the filter to the local media stream
function setMediumBlurFilter() {
  // the names of background filters are 'BackgroundBlurLight', 'BackgroundBlurMedium' and 'BackgroundBlurHeavy'
  localMediaStream?.getVideoTracks().forEach((track) => {
    track._setVideoEffect('BackgroundBlurMedium');
  });
}

function setImageBackgroundFilter(uri: string) {
  // the filter name is derived from the image uri
  const filterName = `VirtualBackground-${imageUri}`;
  localMediaStream?.getVideoTracks().forEach((track) => {
    track._setVideoEffect(filterName);
  });
}

// to remove all filters
function clearVideoFilters() {
  // pass null as the filter name to clear the video filters
  localMediaStream?.getVideoTracks().forEach((track) => {
    track._setVideoEffect(null);
  });
}
```

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)

# @stream-io/video-filters-web

A helper library that provides the core functionality for video filters in the [Stream Video SDK](https://getstream.io/video/sdk/react/).

This library borrows a lot of code and concepts from the amazing [virtual-background](https://github.com/vpalmisano/virtual-background) library.

## Installation

```bash
yarn add @stream-io/video-filters-web
```

## Usage

```typescript
import {
  isMediaPipePlatformSupported,
  loadMediaPipe,
  VirtualBackground,
} from '@stream-io/video-filters-web';

// 1. Check if the platform is supported
const isSupported = await isMediaPipePlatformSupported();
if (!isSupported) {
  throw new Error('Platform not supported');
}

// 2. Load the MediaPipe model
const mediaPipeModel = await loadMediaPipe();

// 3. Create the processor
const processor = new VirtualBackground(
  track,
  {
    modelPath: mediaPipeModel.modelPath,
    backgroundBlurLevel: blurLevel, // 'low' | 'medium' | 'high' | number
    backgroundImage: backgroundImage, // string (URL or data URI)
    backgroundFilter: 'image', // or 'blur'
  },
  { onError, onStats },
);

// 4. Start the processor and use the processed track
const processedTrack = await processor.start();

// 5. Stop the processor
processor.stop();
```

## Known limitations

- This library only works in a modern desktop browser that supports WebAssembly SIMD and WebGL.
- Support for mobile browsers is not guaranteed and may not work as expected

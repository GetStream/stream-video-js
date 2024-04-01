# @stream-io/video-filters-web

A helper library for that provides the core functionality for video filters in the [Stream Video SDK](https://getstream.io/video/sdk/react/).

This library borrows a lot of code and concepts from the amazing [virtual-background](https://github.com/Volcomix/virtual-background) library.

## Installation

```bash
yarn add @stream-io/video-filters-web
```

## Usage

```typescript
import {
  isPlatformSupported,
  loadTfLite,
  createRenderer,
} from '@stream-io/video-filters-web';

// 1. check if the platform is supported
const isSupported = await isPlatformSupported();
if (!isSupported) {
  throw new Error('Platform not supported');
}

// 2. get reference to the source video, background image and target canvas elements
const sourceVideo = document.getElementById('source-video');
const targetCanvas = document.getElementById('target-canvas');
const backgroundImage = document.getElementById('background-image');

// 3. load the TensorFlow Lite
const tfLite = await loadTfLite();

// 4. create the renderer
const renderer = createRenderer(tfLite, sourceVideo, targetCanvas, {
  backgroundFilter: 'image', // or 'blur'
  backgroundImage: backgroundImage,
  fps: 30,
});

// 5. Dispose the renderer when done
renderer.dispose();
```

## Known limitations

- This library only works in a modern desktop browser that supports WebAssembly SIMD and WebGL.
- Support for mobile browsers is not guaranteed and may not work as expected

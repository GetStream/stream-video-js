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
  createVirtualBackground,
  isMediaPipePlatformSupported,
  loadMediaPipe,
} from '@stream-io/video-filters-web';

// 1. Check if the platform is supported
const isSupported = await isMediaPipePlatformSupported();
if (!isSupported) {
  throw new Error('Platform not supported');
}

// 2. Load the MediaPipe model
const mediaPipeModel = await loadMediaPipe();

// 3. Create the processor for the current browser
const processor = createVirtualBackground(
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

// 5. Change the effect at any time, without restarting the track
await processor.updateOptions({
  backgroundFilter: 'blur',
  backgroundBlurLevel: 'high',
});

// 6. Stop the processor
processor.stop();
```

### Updating the effect

`updateOptions` changes the background effect of a running processor. The new
effect is applied on the next frame - the input track, renderer and segmenter
are preserved, so there is no interruption and the processed track doesn't
need to be re-published.

```typescript
// switch between blur levels
await processor.updateOptions({
  backgroundFilter: 'blur',
  backgroundBlurLevel: 3,
});

// switch to an image background
await processor.updateOptions({
  backgroundFilter: 'image',
  backgroundImage: 'https://example.com/background.jpg',
});
```

Notes:

- `updateOptions` replaces the effect options, so always pass the complete
  set you want applied.
- `basePath` and `modelPath` are fixed for the lifetime of the processor;
  changing the model requires a new instance.
- When several updates overlap, the last one wins.
- If the background image fails to load, the promise rejects and the current
  background keeps rendering.

## Safari

Safari is opted into with `isMediaPipePlatformSupported({ forceSafariSupport: true })`.
On Safari 18+ `createVirtualBackground` runs the whole pipeline in a Web Worker
(Safari exposes `MediaStreamTrackProcessor` only in workers), so the effect keeps
its frame rate when the tab is in the background.

## Content-Security-Policy

The worker is bundled into the library and started from a `blob:` URL, so pages
with a CSP need `worker-src blob:`. Without it `start()` rejects with an error
that says so. The MediaPipe WebAssembly and model files are fetched from
`basePath`, which `script-src` and `connect-src` have to allow as usual.

## Known limitations

- This library only works in a modern desktop browser that supports WebAssembly, WebGL2, OffscreenCanvas and the VideoFrame API.
- Support for mobile browsers is not guaranteed and may not work as expected

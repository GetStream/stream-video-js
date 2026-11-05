# @stream-io/audio-filters-web

Noise cancellation for Stream Video on the web. The package ships two
providers that share the same interface, so they can be swapped one for the other:

- `NoiseCancellation`: based on the Krisp.AI SDK.
- `FastEnhancerNoiseCancellation`: based on the FastEnhancer model
  (**experimental**, see [below](#fastenhancer-experimental)).

Both load their runtime lazily, on first use, so importing the package doesn't
add the SDK or the models to your initial bundle.

## Usage with React

Create the instance once and pass it to `NoiseCancellationProvider`:

```tsx
import { useMemo } from 'react';
import { NoiseCancellation } from '@stream-io/audio-filters-web';
import { NoiseCancellationProvider } from '@stream-io/video-react-sdk';

export const App = ({ children }: { children: React.ReactNode }) => {
  const noiseCancellation = useMemo(() => new NoiseCancellation(), []);
  return (
    <NoiseCancellationProvider noiseCancellation={noiseCancellation}>
      {children}
    </NoiseCancellationProvider>
  );
};
```

## Usage with the JavaScript client

```ts
import { NoiseCancellation } from '@stream-io/audio-filters-web';

const noiseCancellation = new NoiseCancellation();
if (await noiseCancellation.isSupported()) {
  await noiseCancellation.init();
  await call.microphone.enableNoiseCancellation(noiseCancellation);
}

// on cleanup
await call.microphone.disableNoiseCancellation();
await noiseCancellation.dispose();
```

Unlike `NoiseCancellationProvider`, the client doesn't call `init()` for you.
`enableNoiseCancellation` throws if the user lacks the noise cancellation
capability or the call type has noise cancellation disabled in its settings.

`NoiseCancellation.isSupported()` always returns a `Promise<boolean>`, so `await` it.
(`FastEnhancerNoiseCancellation.isSupported()` is synchronous; awaiting either is safe.)
Safari and other WebKit browsers are reported as unsupported by `NoiseCancellation`
unless you pass `withSafariSupport: true`.

## FastEnhancer (experimental)

`FastEnhancerNoiseCancellation` is an alternative provider that runs the
[FastEnhancer](https://github.com/aask1357/fastenhancer) speech enhancement model in an
`AudioWorklet`. It is **experimental**: it may change in any release, and its
pretrained weights are still under provenance review.

```tsx
import { useState } from 'react';
import { FastEnhancerNoiseCancellation } from '@stream-io/audio-filters-web';
import { NoiseCancellationProvider } from '@stream-io/video-react-sdk';

export const App = ({ children }: { children: React.ReactNode }) => {
  const [noiseCancellation] = useState(
    () => new FastEnhancerNoiseCancellation({ model: 'tiny' }),
  );
  return (
    <NoiseCancellationProvider noiseCancellation={noiseCancellation}>
      {children}
    </NoiseCancellationProvider>
  );
};
```

With the JavaScript client:

```ts
const noiseCancellation = new FastEnhancerNoiseCancellation({ model: 'tiny' });
if (await noiseCancellation.isSupported()) {
  await noiseCancellation.init();
  await call.microphone.enableNoiseCancellation(noiseCancellation);
}
```

### Options

| Option              | Default                        | Description                                                                        |
| ------------------- | ------------------------------ | ---------------------------------------------------------------------------------- |
| `model`             | `'tiny'`                       | `'tiny'`, `'base'` or `'small'`. See below.                                        |
| `basePath`          | unpkg, for the package version | Where the WASM and the weights are loaded from. See [Self-hosting](#self-hosting). |
| `hpf`               | `false`                        | High-pass filter for low-frequency rumble.                                         |
| `agc`               | `false`                        | Automatic gain control in the model's post-processing.                             |
| `withSafariSupport` | `true`                         | Set to `false` to report Safari and other WebKit browsers as unsupported.          |
| `restoreTimeoutMs`  | `15000`                        | How long the filter stays off after an overload.                                   |
| `restoreAttempts`   | `3`                            | Overloads after which the filter stays off.                                        |

### Models

`tiny` is the default and the cheapest on CPU. `base` and `small` suppress noise
better, at the cost of more CPU. Pick a larger one only if your users' devices can afford it.
If the device can't keep up, the filter turns itself off, and restores per
`restoreTimeoutMs` and `restoreAttempts`.

### Suppression level

`setSuppressionLevel(level)` takes a value from 0 to 100. It blends the filtered
audio with the original: 0 is no suppression, 100 (the default) is the filtered
audio only.

### Audio

The model runs at 48 kHz, so FastEnhancer creates its own 48 kHz `AudioContext`.
It adds about 19 ms of latency (896 samples) while the filter is on, and none
while it's off.

### Browser support

Unlike Krisp, FastEnhancer supports Safari and other WebKit browsers (including
every iOS browser) by default. To opt out, pass `withSafariSupport: false`;
`isSupported()` then returns `false` there.

### Self-hosting

The WASM and the weights are fetched at `init()` from `basePath`, which defaults to
`https://unpkg.com/@stream-io/audio-filters-web@<version>/src/fastenhancer/models`.
To host them yourself, copy `src/fastenhancer/models/*` from the package to
your server and pass the URL:

```ts
new FastEnhancerNoiseCancellation({
  basePath: 'https://cdn.example.com/fastenhancer/models',
});
```

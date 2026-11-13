# @stream-io/audio-filters-web

Noise cancellation for Stream Video on the web. The package ships two
engines that share the same interface, plus a router that picks one of them:

- `NoiseCancellation`: runs the engine selected in your call type settings,
  and Krisp when none is selected. Use this one unless you need a specific engine.
- `KrispNoiseCancellation`: based on the Krisp.AI SDK.
- `FastEnhancerNoiseCancellation`: based on the FastEnhancer model
  (**experimental**, see [below](#fastenhancer-experimental)).

All of them load their runtime lazily, on first use, so importing the package
doesn't add the SDKs or the models to your initial bundle.

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
import { getCallExtraOpts } from '@stream-io/video-client';

const noiseCancellation = new NoiseCancellation();
// apply the call type settings before `isSupported()` and `init()`
const options = getCallExtraOpts(call.state.settings).noise_cancellation;
noiseCancellation.configure({
  engine: options?.engine,
  withSafariSupport: options?.enabled_in_safari,
  modelPath: options?.model_path,
});
if (await noiseCancellation.isSupported()) {
  await noiseCancellation.init();
  await call.microphone.enableNoiseCancellation(noiseCancellation);
}

// on cleanup
await call.microphone.disableNoiseCancellation();
await noiseCancellation.dispose();
```

Unlike `NoiseCancellationProvider`, the client doesn't call `configure()` or
`init()` for you.
`enableNoiseCancellation` throws if the user lacks the noise cancellation
capability or the call type has noise cancellation disabled in its settings.

`isSupported()` returns a `Promise<boolean>` for Krisp and a `boolean` for
FastEnhancer, so `await` it. Safari and other WebKit browsers are reported as
unsupported by Krisp unless you pass `withSafariSupport: true`.

Options passed to the `NoiseCancellation` constructor configure Krisp; FastEnhancer
options go under `fastEnhancer`. Options you pass explicitly win over the call
type settings. `defaultEngine` (`krisp` or `stream`) picks the engine for calls
whose settings don't select one.

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
    () => new FastEnhancerNoiseCancellation({ model: 'small' }),
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
const noiseCancellation = new FastEnhancerNoiseCancellation({ model: 'small' });
if (await noiseCancellation.isSupported()) {
  await noiseCancellation.init();
  await call.microphone.enableNoiseCancellation(noiseCancellation);
}

// on cleanup
await call.microphone.disableNoiseCancellation();
await noiseCancellation.dispose();
```

### Options

| Option              | Default                        | Description                                                                        |
| ------------------- | ------------------------------ | ---------------------------------------------------------------------------------- |
| `model`             | `'small'`                      | `'tiny'`, `'base'` or `'small'`. See below.                                        |
| `basePath`          | unpkg, for the package version | Where the WASM and the weights are loaded from. See [Self-hosting](#self-hosting). |
| `hpf`               | `false`                        | High-pass filter for low-frequency rumble.                                         |
| `agc`               | `false`                        | Automatic gain control in the model's post-processing.                             |
| `withSafariSupport` | `true`                         | Set to `false` to report Safari and other WebKit browsers as unsupported.          |
| `restoreTimeoutMs`  | `15000`                        | How long the filter stays off after an overload.                                   |
| `restoreAttempts`   | `3`                            | Overloads after which the filter stays off.                                        |

### Models

`small` is the default and suppresses noise best. `base` and `tiny` use less CPU
and suit lower-end devices; `tiny` is the cheapest.
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

### Deployment notes

- **Content Security Policy.** The worklet module is loaded from a `blob:` URL.
  `AudioWorklet` modules fall under `script-src` (not `worker-src`), so allow
  `blob:` there (or in `script-src-elem`). The model is compiled from WASM in the
  worklet, so a restricted `script-src` also needs `'wasm-unsafe-eval'`.
- **`connect-src`.** The WASM and the weights are fetched from `basePath`: allow
  `https://unpkg.com`, or your own origin when self-hosting.
- **CORS.** When the models are served from a different origin than your app, that
  server must send `Access-Control-Allow-Origin` for your app's origin.

# Krisp Javascript SDK

Welcome to the Krisp JS SDK!

In this README file you can find JS SDK overview and installation options.
Find more details in the [documentaiton](https://sdk-docs.krisp.ai/docs/getting-started-js).

## Overview

Krisp provides a JS SDK with an out-of-the-box application architecture that allows developers and teams to integrate AI-powered speech clarity features in real-time communication applications. The SDK receives audio buffers in chunks then processes them in a dedicated worker thread on top of WebAssembly.

## Package Structure

```
├── dist                       # Main JS SDK files
│   ├── assets
│   │   └── bvc-allowed.txt
│   ├── krispsdk.d.ts
│   ├── krispsdk.js
│   ├── krispsdk.mjs
│   ├── usermedia.d.ts
│   ├── usermedia.js
│   ├── usermedia.mjs
│   ├── krispsdk.d.ts
│   ├── krispsdk.es5.js
│   ├── krispsdk.js
│   ├── krispsdk.mjs
│   └── models
│       ├── model_16.kef
│       ├── model_32.kef
│       ├── model_8.kef
│       ├── model_bvc.kef
│       └── model_inbound_8.kef
|       └── model_rt.kef
├── reference-apps             # Reference applications
│   ├── audioElement
│   │   ├── app.js
│   │   ├── index.html
│   │   └── style.css
│   ├── bvcAudioElement
│   │   ├── app.js
│   │   ├── index.html
│   │   ├── style.css
│   │   └── ui.mjs
│   └── callingApp
│   │   ├── app.js
│   │   ├── index.html
│   │   └── style.css
│   └── deviceChange
│   │   ├── app.js
│   │   ├── index.html
│   │   ├── style.css
│   │   └── ui.mjs
|   └── withPreloadState
|       ├── app.js
|       ├── index.html
|       └── style.css
├── package.json
├── LICENSE.md
└── README.md
```

## Installation

Once you've extracted the folder, the KrispSDK files that you can include in your project will be in the /dist directory.
You have to serve Krisp models from server and load them dynamically. The models are located in /dist/models directory.

## NPM dependency

You can pack KrispSDK files as a npm package and include in your project.

Using this method, you can import the KrispSDK SDK using ES Module or TypeScript syntax:

```
import KrispSDK from '@krispai/javascript-sdk';
```

### Installation Steps

1. Open your terminal or command prompt.
2. Navigate to the package directory.
3. pack the library

```
npm pack
```

4. move generated library archive to your project
5. install as a dependency

```
npm install ./krispai-javascript-sdk-${VERSION}.tgz
```

## Import as a module

In case you are not using npm you can directly import '/dist/krispsdk.mjs' in your project

```
import KrispSDK from '/dist/krispsdk.mjs';
```

## Include via script tag

You can copy /dist/krispsdk.es5.js file into your project and then provide a link to it in your html. For example:

```
<script type="text/javascript" src="/dist/krispsdk.es5.js"></script>
```

Using this method, you can access the SDK through the browser global:

```
const krispSDK = new KrispSDK({
   params: {
      useBVC: true,
      debugLogs: false,
      models: {
         model8: '/dist/models/model_8.kef',
         model16: '/dist/models/model_16.kef',
         model32: '/dist/models/model_32.kef',
         modelBVC: {
            url: '/dist/models/model_32.kef',
            preload: true
         }
      },
      inboundModels: {
         model8: '/dist/models/model_inbound_8.kef',
      },
      bvc: {
        allowedDevices: '/dist/assets/bvc-allowed.txt', // This is mandatory
      }
   }
});

await krispSDK.init();

const audioContext = new AudioContext();

const stream = await navigator.mediaDevices.getUserMedia({
   audio: true
});

const filterNode = await krispSDK.createNoiseFilter({
   audioContext,
   stream, // make sure to add stream here
   isInbound: false
});

const source = audioContext.createMediaStreamSource(stream);

source.connect(filterNode).connect(audioContext.destination);

filterNode.addEventListener('ready', () => {
   filterNode.enable()
});
```

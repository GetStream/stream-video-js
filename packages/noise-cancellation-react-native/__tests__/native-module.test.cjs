/**
 * Contract tests for the JS side of the turbo module. They exercise the built
 * CommonJS output against a stub of React Native's turbo module registry, so
 * they verify the JS contract only - never real native registration or
 * platform specific error codes.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const MODULE_NAME = 'NoiseCancellationReactNative';
const distDir = path.join(__dirname, '..', 'dist', 'commonjs');
const reactNativePath = require.resolve('react-native', { paths: [distDir] });
const libraryPaths = [
  path.join(distDir, 'index.js'),
  path.join(distDir, 'NativeNoiseCancellationReactNative.js'),
];

const createNativeModule = () => {
  const calls = [];
  return {
    calls,
    nativeModule: {
      isEnabled: () => {
        calls.push(['isEnabled']);
        return Promise.resolve(true);
      },
      setEnabled: (enabled) => {
        calls.push(['setEnabled', enabled]);
        return Promise.resolve(true);
      },
      deviceSupportsAdvancedAudioProcessing: () => {
        calls.push(['deviceSupportsAdvancedAudioProcessing']);
        return Promise.resolve(true);
      },
    },
  };
};

/**
 * Loads the built library with `react-native` replaced by a registry stub,
 * then restores the module cache.
 */
const withNativeModule = async (nativeModule, run) => {
  const lookups = [];
  const stub = new Module(reactNativePath, module);
  stub.filename = reactNativePath;
  stub.loaded = true;
  stub.exports = {
    TurboModuleRegistry: {
      getEnforcing: (name) => {
        lookups.push(name);
        if (!nativeModule) {
          throw new Error(
            `'${name}' could not be found. Verify that a module by this name is registered in the native binary.`,
          );
        }
        return nativeModule;
      },
    },
  };

  const previous = require.cache[reactNativePath];
  require.cache[reactNativePath] = stub;
  for (const libraryPath of libraryPaths) delete require.cache[libraryPath];

  try {
    return await run(() => require(libraryPaths[0]), lookups);
  } finally {
    for (const libraryPath of libraryPaths) delete require.cache[libraryPath];
    if (previous) {
      require.cache[reactNativePath] = previous;
    } else {
      delete require.cache[reactNativePath];
    }
  }
};

test('looks the native module up by its registered name on import', async () => {
  const { nativeModule } = createNativeModule();
  await withNativeModule(nativeModule, (load, lookups) => {
    load();
    assert.deepEqual(lookups, [MODULE_NAME]);
  });
});

test('propagates the error when the native module is missing', async () => {
  await withNativeModule(null, (load) => {
    assert.throws(load, {
      message: `'${MODULE_NAME}' could not be found. Verify that a module by this name is registered in the native binary.`,
    });
  });
});

test('dispatches change only after the native call resolves', async () => {
  const { calls, nativeModule } = createNativeModule();
  await withNativeModule(nativeModule, async (load) => {
    const { NoiseCancellation } = load();
    const noiseCancellation = new NoiseCancellation();
    const events = [];
    noiseCancellation.on('change', (enabled) => events.push(enabled));

    await noiseCancellation.enable();
    await noiseCancellation.disable();

    assert.deepEqual(calls, [
      ['setEnabled', true],
      ['setEnabled', false],
    ]);
    assert.deepEqual(events, [true, false]);
  });
});

test('propagates a native rejection without dispatching change', async () => {
  const { nativeModule } = createNativeModule();
  nativeModule.setEnabled = () =>
    Promise.reject(new Error('Noise cancellation filter not registered'));

  await withNativeModule(nativeModule, async (load) => {
    const { NoiseCancellation } = load();
    const noiseCancellation = new NoiseCancellation();
    const events = [];
    noiseCancellation.on('change', (enabled) => events.push(enabled));

    await assert.rejects(() => noiseCancellation.enable(), {
      message: 'Noise cancellation filter not registered',
    });
    assert.deepEqual(events, []);
  });
});

test('delegates the exported helpers to the native module', async () => {
  const { calls, nativeModule } = createNativeModule();
  await withNativeModule(nativeModule, async (load) => {
    const { isEnabled, setEnabled, deviceSupportsAdvancedAudioProcessing } =
      load();

    assert.equal(await isEnabled(), true);
    assert.equal(await setEnabled(false), true);
    assert.equal(await deviceSupportsAdvancedAudioProcessing(), true);
    assert.deepEqual(calls, [
      ['isEnabled'],
      ['setEnabled', false],
      ['deviceSupportsAdvancedAudioProcessing'],
    ]);
  });
});

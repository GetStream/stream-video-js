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
        return true;
      },
      setEnabled: (enabled) => {
        calls.push(['setEnabled', enabled]);
        return true;
      },
      deviceSupportsAdvancedAudioProcessing: () => {
        calls.push(['deviceSupportsAdvancedAudioProcessing']);
        return true;
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

test('adapts synchronous controls to Promises and dispatches change after success', async () => {
  const { calls, nativeModule } = createNativeModule();
  await withNativeModule(nativeModule, async (load) => {
    const { NoiseCancellation } = load();
    const noiseCancellation = new NoiseCancellation();
    noiseCancellation.on('change', (enabled) =>
      calls.push(['change', enabled]),
    );

    const enabled = noiseCancellation.enable();
    assert.ok(enabled instanceof Promise);
    assert.deepEqual(calls, [['setEnabled', true]]);
    assert.equal(await enabled, undefined);
    const disabled = noiseCancellation.disable();
    assert.ok(disabled instanceof Promise);
    assert.equal(await disabled, undefined);

    assert.deepEqual(calls, [
      ['setEnabled', true],
      ['change', true],
      ['setEnabled', false],
      ['change', false],
    ]);
  });
});

test('rejects adapter calls but throws from direct helpers without dispatching change', async () => {
  const { nativeModule } = createNativeModule();
  const error = new Error('Noise cancellation filter not registered');
  nativeModule.setEnabled = () => {
    throw error;
  };

  await withNativeModule(nativeModule, async (load) => {
    const { NoiseCancellation, setEnabled } = load();
    const noiseCancellation = new NoiseCancellation();
    const events = [];
    noiseCancellation.on('change', (enabled) => events.push(enabled));

    await assert.rejects(
      () => noiseCancellation.enable(),
      (thrown) => thrown === error,
    );
    await assert.rejects(
      () => noiseCancellation.disable(),
      (thrown) => thrown === error,
    );
    assert.throws(
      () => setEnabled(true),
      (thrown) => thrown === error,
    );
    assert.deepEqual(events, []);
  });
});

test('returns native boolean results directly from exported helpers', async () => {
  const { calls, nativeModule } = createNativeModule();
  await withNativeModule(nativeModule, (load) => {
    const { isEnabled, setEnabled, deviceSupportsAdvancedAudioProcessing } =
      load();

    assert.equal(isEnabled(), true);
    assert.equal(setEnabled(false), true);
    assert.equal(deviceSupportsAdvancedAudioProcessing(), true);
    assert.deepEqual(calls, [
      ['isEnabled'],
      ['setEnabled', false],
      ['deviceSupportsAdvancedAudioProcessing'],
    ]);
  });
});

test('keeps instance queries and lifecycle methods Promise-based while helpers return booleans', async () => {
  const { nativeModule } = createNativeModule();
  nativeModule.isEnabled = () => false;
  nativeModule.deviceSupportsAdvancedAudioProcessing = () => false;
  await withNativeModule(nativeModule, async (load) => {
    const {
      NoiseCancellation,
      isEnabled,
      deviceSupportsAdvancedAudioProcessing,
    } = load();
    const noiseCancellation = new NoiseCancellation();
    assert.equal(isEnabled(), false);
    assert.equal(deviceSupportsAdvancedAudioProcessing(), false);
    for (const query of [
      noiseCancellation.isEnabled,
      noiseCancellation.canAutoEnable,
    ]) {
      const result = query();
      assert.ok(result instanceof Promise);
      assert.equal(await result, false);
    }
    for (const lifecycle of [
      noiseCancellation.init,
      noiseCancellation.dispose,
    ]) {
      const result = lifecycle();
      assert.ok(result instanceof Promise);
      assert.equal(await result, undefined);
    }
  });
});

test('converts synchronous query errors to adapter rejections', async () => {
  const { nativeModule } = createNativeModule();
  const error = new Error('Native query failed');
  nativeModule.isEnabled = nativeModule.deviceSupportsAdvancedAudioProcessing =
    () => {
      throw error;
    };
  await withNativeModule(nativeModule, async (load) => {
    const {
      NoiseCancellation,
      isEnabled,
      deviceSupportsAdvancedAudioProcessing,
    } = load();
    const noiseCancellation = new NoiseCancellation();
    assert.throws(isEnabled, (thrown) => thrown === error);
    assert.throws(
      deviceSupportsAdvancedAudioProcessing,
      (thrown) => thrown === error,
    );
    await assert.rejects(
      noiseCancellation.isEnabled,
      (thrown) => thrown === error,
    );
    await assert.rejects(
      noiseCancellation.canAutoEnable,
      (thrown) => thrown === error,
    );
  });
});

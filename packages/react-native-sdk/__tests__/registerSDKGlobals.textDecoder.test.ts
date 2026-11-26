const globals = globalThis as { TextDecoder?: unknown };
const NativeTextDecoder = globals.TextDecoder;

const registerGlobals = () => {
  jest.isolateModules(() => {
    require('../src/utils/internal/registerSDKGlobals').registerSDKGlobals();
  });
  return globalThis.streamRNVideoSDK;
};

describe('registerSDKGlobals textDecoder', () => {
  afterEach(() => {
    globals.TextDecoder = NativeTextDecoder;
    globalThis.streamRNVideoSDK = undefined;
  });

  it('provides no decoder when the runtime has a TextDecoder', () => {
    expect(registerGlobals()?.textDecoder).toBeUndefined();
  });

  it('provides the UTF-8 decoder when the runtime has no TextDecoder', () => {
    // Hermes before React Native 0.88
    delete globals.TextDecoder;

    const textDecoder = registerGlobals()?.textDecoder;

    expect(textDecoder?.decode(new Uint8Array([104, 195, 169]))).toBe('hé');
    // strict, unlike a lenient decoder that would return U+FFFD
    expect(() => textDecoder?.decode(new Uint8Array([0xff]))).toThrow(
      TypeError,
    );
  });
});

// makes this file a module, its top-level names would be global otherwise
export {};

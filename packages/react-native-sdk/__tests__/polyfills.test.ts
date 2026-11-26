const setupURLPolyfill = jest.fn();

const globals = globalThis as Record<string, unknown>;
const originalURLSearchParams = URLSearchParams;

/** Mimics React Native 0.79: `set` is not implemented. */
class WithoutSetURLSearchParams extends originalURLSearchParams {
  set(): void {
    throw new Error('URLSearchParams.set is not implemented');
  }
}

/** An implementation that ignores the values passed to the constructor. */
class EmptyURLSearchParams extends originalURLSearchParams {
  constructor() {
    super();
  }
}

/**
 * Mimics React Native 0.80 - 0.88: enough for the SDK, but not spec-compliant
 * (no `Symbol.toStringTag`, a parsed value is cut at its first raw `=`).
 */
class ReactNativeURLSearchParams {
  private params = new Map<string, string>();

  constructor(init?: Record<string, string> | string) {
    if (typeof init === 'string') {
      init.split('&').forEach((pair) => {
        const [key = '', value = ''] = pair.split('=');
        this.params.set(key, value);
      });
    } else if (init) {
      Object.entries(init).forEach(([key, value]) => this.set(key, value));
    }
  }

  set = (name: string, value: string) => {
    this.params.set(name, value);
  };

  get = (name: string) => this.params.get(name) ?? null;

  toString = () =>
    [...this.params]
      .map((pair) =>
        pair.map((part) => encodeURIComponent(part).replace(/%20/g, '+')),
      )
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
}

const loadPolyfills = () => {
  jest.isolateModules(() => {
    jest.doMock('react-native-url-polyfill', () => ({ setupURLPolyfill }));
    require('../src/utils/internal/polyfills');
  });
};

describe('polyfills', () => {
  afterEach(() => {
    globals.URLSearchParams = originalURLSearchParams;
    jest.clearAllMocks();
  });

  it('sets up no polyfill when the runtime has what the SDK needs', () => {
    loadPolyfills();

    expect(setupURLPolyfill).not.toHaveBeenCalled();
  });

  describe('URLSearchParams', () => {
    it('sets up the polyfill when set is not implemented', () => {
      globals.URLSearchParams = WithoutSetURLSearchParams;

      loadPolyfills();

      expect(setupURLPolyfill).toHaveBeenCalledTimes(1);
    });

    it('sets up the polyfill when the constructor ignores its values', () => {
      globals.URLSearchParams = EmptyURLSearchParams;

      loadPolyfills();

      expect(setupURLPolyfill).toHaveBeenCalledTimes(1);
    });

    it('sets up the polyfill when URLSearchParams is missing', () => {
      delete globals.URLSearchParams;

      loadPolyfills();

      expect(setupURLPolyfill).toHaveBeenCalledTimes(1);
    });

    it('keeps an implementation that is not spec-compliant but covers the SDK usage', () => {
      globals.URLSearchParams = ReactNativeURLSearchParams;
      // the shortcomings that the SDK does not depend on
      expect(new ReactNativeURLSearchParams('sig=ab==').get('sig')).toBe('ab');
      expect(
        String(Object.prototype.toString.call(new URLSearchParams())),
      ).toBe('[object Object]');

      loadPolyfills();

      expect(setupURLPolyfill).not.toHaveBeenCalled();
    });
  });
});

// makes this file a module, its top-level names would be global otherwise
export {};

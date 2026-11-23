/**
 * These checks only cover what the SDK itself needs from the runtime,
 * not what a spec-compliant implementation would offer.
 */

/**
 * Needed to encode and decode the SFU protobuf messages.
 * Hermes ships `TextEncoder` on every supported React Native version,
 * but `TextDecoder` only from React Native 0.88 onwards.
 */
const hasTextEncoding = () => {
  const globals = globalThis as {
    TextEncoder?: unknown;
    TextDecoder?: unknown;
  };
  return (
    typeof globals.TextEncoder !== 'undefined' &&
    typeof globals.TextDecoder !== 'undefined'
  );
};

/**
 * Needed to build the query of the coordinator and SFU WebSocket urls,
 * the two ways the client uses it are exercised here.
 * React Native always defines `URLSearchParams`,
 * but before 0.80 `set` throws a "not implemented" error.
 */
const hasUsableURLSearchParams = () => {
  try {
    const coordinatorParams = new URLSearchParams();
    coordinatorParams.set('a', '1');
    coordinatorParams.set('b', 'x y=z');

    const sfuParams = new URLSearchParams({ a: '1', b: 'x y=z' });

    const expected = 'a=1&b=x+y%3Dz';
    return (
      coordinatorParams.toString() === expected &&
      sfuParams.toString() === expected
    );
  } catch {
    return false;
  }
};

if (!hasTextEncoding()) {
  // only fills in the globals that are missing
  require('text-encoding-polyfill');
}

if (!hasUsableURLSearchParams()) {
  // replaces both `URL` and `URLSearchParams`
  require('react-native-url-polyfill').setupURLPolyfill();
}

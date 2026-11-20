import type { INoiseCancellation } from '@stream-io/audio-filters-web';

export type Tracer = NonNullable<
  NonNullable<Parameters<INoiseCancellation['init']>[0]>['tracer']
>;

/**
 * Whether the current runtime runs on WebKit: Safari, every iOS browser,
 * and WKWebView hosts (whose user agent may omit the `Safari` token).
 */
export const isWebKit = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (!/AppleWebKit\//.test(ua)) return false;
  // Desktop Chromium reuses the AppleWebKit/ token
  return !/Chrome\/|Chromium\/|Android/.test(ua);
};

/**
 * Creates a new promise with its resolvers.
 */
export const promiseWithResolvers = <T = void>() => {
  let resolve: (value: T) => void;
  let reject: (reason: unknown) => void;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return { promise, resolve: resolve!, reject: reject! };
};

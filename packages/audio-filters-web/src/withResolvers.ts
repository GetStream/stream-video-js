/**
 * Creates a new promise with resolvers.
 *
 * Based on:
 * - https://github.com/tc39/proposal-promise-with-resolvers/blob/main/polyfills.js
 */
export const promiseWithResolvers = <T = void>() => {
  let resolve: (value: T) => void;
  let reject: (reason: any) => void;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return { promise, resolve: resolve!, reject: reject! };
};

export type PromiseWithResolvers<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason: any) => void;
  isResolved: boolean;
  isRejected: boolean;
};

/**
 * Creates a new promise with resolvers.
 *
 * Based on:
 * - https://github.com/tc39/proposal-promise-with-resolvers/blob/main/polyfills.js
 */
export const promiseWithResolvers = <T = void>(): PromiseWithResolvers<T> => {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason: any) => void;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  let isResolved = false;
  let isRejected = false;

  const resolver = (value: T | PromiseLike<T>) => {
    isResolved = true;
    resolve(value);
  };

  const rejecter = (reason: any) => {
    isRejected = true;
    reject(reason);
  };

  return {
    promise,
    resolve: resolver,
    reject: rejecter,
    isResolved,
    isRejected,
  };
};

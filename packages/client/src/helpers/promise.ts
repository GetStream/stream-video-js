export interface SafePromise<T> {
  (): Promise<T>;
  checkPending(): boolean;
}

type Fulfillment<T> =
  | {
      status: 'resolved';
      result: T;
    }
  | {
      status: 'rejected';
      error: unknown;
    };

/**
 * Saving a long-lived reference to a promise that can reject can be unsafe,
 * since rejecting the promise causes an unhandled rejection error (even if the
 * rejection is handled everywhere promise result is expected).
 *
 * To avoid that, we add both resolution and rejection handlers to the promise.
 * That way, the saved promise never rejects. A callback is provided as return
 * value to build a *new* promise, that resolves and rejects along with
 * the original promise.
 * @param promise Promise to wrap, which possibly rejects
 * @returns Callback to build a new promise, which resolves and rejects along
 * with the original promise
 */
export function makeSafePromise<T>(promise: Promise<T>): SafePromise<T> {
  let isPending = true;

  const safePromise: Promise<Fulfillment<T>> = promise
    .then(
      (result) => ({ status: 'resolved' as const, result }),
      (error) => ({ status: 'rejected' as const, error }),
    )
    .finally(() => (isPending = false));

  const unwrapPromise = () =>
    safePromise.then((fulfillment) => {
      if (fulfillment.status === 'rejected') throw fulfillment.error;
      return fulfillment.result;
    });

  unwrapPromise.checkPending = () => isPending;
  return unwrapPromise;
}

export type PromiseWithResolvers<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason: any) => void;
  isResolved: () => boolean;
  isRejected: () => boolean;
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
    isResolved: () => isResolved,
    isRejected: () => isRejected,
  };
};

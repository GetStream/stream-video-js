export type SafePromise<T> = () => Promise<T>;

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
  const safePromise: Promise<Fulfillment<T>> = promise.then(
    (result) => ({ status: 'resolved', result }),
    (error) => ({ status: 'rejected', error }),
  );

  return () =>
    safePromise.then((fulfillment) => {
      if (fulfillment.status === 'rejected') throw fulfillment.error;
      return fulfillment.result;
    });
}

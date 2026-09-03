import type { Subscribable } from './subscribable';
import { withoutConcurrency } from '../helpers/concurrency';
import { videoLoggerSystem } from '../logger';

/**
 * Subscribes to a source and returns a function that unsubscribes again.
 *
 * @param source the source to subscribe to.
 * @param handler called with every value.
 * @param onError an optional error handler.
 */
export const createSubscription = <T>(
  source: Subscribable<T>,
  handler: (value: T) => void,
  onError: (error: unknown) => void = (error) =>
    videoLoggerSystem
      .getLogger('subscription')
      .warn('A subscription emitted an error', error),
) => {
  const subscription = source.subscribe({ next: handler, error: onError });
  return () => {
    subscription.unsubscribe();
  };
};

/**
 * Subscribes to a source, running at most one async handler at a time. When
 * values arrive faster than the handler settles, the later ones wait rather
 * than running concurrently.
 *
 * @param source the source to subscribe to.
 * @param handler the async handler to call with every value.
 */
export const createSafeAsyncSubscription = <T>(
  source: Subscribable<T>,
  handler: (value: T) => Promise<void>,
) => createSubscription(source, serializeAsync(handler));

/**
 * Wraps an async handler so that at most one call is in flight at a time.
 * Values arriving while a call is settling wait their turn rather than running
 * alongside it.
 *
 * Useful with any callback-registration API, not only a `Subscribable` - see
 * `IceTrickleBuffer.onCandidate`.
 */
export const serializeAsync = <T>(
  handler: (value: T) => Promise<void>,
): ((value: T) => void) => {
  const tag = Symbol();
  return (value) => {
    withoutConcurrency(tag, () => handler(value)).catch((err) => {
      videoLoggerSystem
        .getLogger('subscription')
        .warn('An async subscription handler failed', err);
    });
  };
};

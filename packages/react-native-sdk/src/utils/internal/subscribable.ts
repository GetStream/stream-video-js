import type { Subscribable, Subscription } from '@stream-io/video-client';

/**
 * Subscribes to `source`, but waits until it has been quiet for `ms` before
 * passing a value on.
 *
 * This is a view-layer concern: participant state can change many times in a
 * burst (a reconnect re-announces every track), and re-rendering a grid for
 * each one is wasted work. The client deliberately does not ship timing
 * operators, so it lives here.
 */
export const subscribeDebounced = <T>(
  source: Subscribable<T>,
  ms: number,
  handler: (value: T) => void,
): Subscription => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const subscription = source.subscribe((value) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => handler(value), ms);
  });
  const unsubscribe = () => {
    clearTimeout(timeout);
    subscription.unsubscribe();
  };
  return Object.assign(unsubscribe, { unsubscribe });
};

/**
 * Calls `handler` with the first value matching `predicate`, then stops
 * listening.
 *
 * Returns a subscription so an effect can cancel before a match ever arrives;
 * unsubscribing after the handler has run is safe.
 */
export const subscribeOnce = <T>(
  source: Subscribable<T>,
  predicate: (value: T) => boolean,
  handler: (value: T) => void,
): Subscription => {
  let done = false;
  // eslint-disable-next-line prefer-const
  let subscription: Subscription | undefined;
  const stop = () => {
    done = true;
    subscription?.unsubscribe();
  };
  subscription = source.subscribe((value) => {
    if (done || !predicate(value)) return;
    stop();
    handler(value);
  });
  // the source replays synchronously, so the match may land before assignment
  if (done) subscription.unsubscribe();
  return Object.assign(stop, { unsubscribe: stop });
};

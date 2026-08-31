import { StateStore } from '@stream-io/state-store';

export type Observer<T> = {
  next?: (value: T) => void;
  error?: (error: unknown) => void;
  complete?: () => void;
};

/**
 * Callable so it can be used directly as a teardown function, and carries an
 * `unsubscribe()` method so existing RxJS-shaped call sites keep working.
 */
export interface Subscription {
  (): void;
  unsubscribe(): void;
}

/**
 * A value that always has a current value and notifies subscribers when it
 * changes. This is what `call.state.*$` exposes.
 */
export interface Subscribable<T> {
  subscribe(
    observerOrNext: ((value: T) => void) | Partial<Observer<T>>,
  ): Subscription;

  /**
   * The current value. Always available - there is no "has not emitted yet"
   * state to guard against.
   */
  getValue(): T;

  /**
   * Whether anything is currently subscribed.
   */
  readonly observed: boolean;
}

const toNext = <T>(
  observerOrNext: ((value: T) => void) | Partial<Observer<T>>,
): ((value: T) => void) | undefined =>
  typeof observerOrNext === 'function'
    ? observerOrNext
    : observerOrNext.next?.bind(observerOrNext);

const toSubscription = (unsubscribe: () => void): Subscription =>
  Object.assign(unsubscribe, { unsubscribe });

/**
 * The default equality used by derived sources.
 *
 * Identity first, then a shallow field comparison for plain objects and
 * arrays. Selectors routinely build a fresh object per call, and without this
 * every unrelated store write would produce a new reference - which would
 * both emit spuriously and send React's `useSyncExternalStore` into an
 * infinite render loop.
 */
const shallowEqual = <O>(a: O, b: O): boolean => {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== 'object' ||
    a === null ||
    typeof b !== 'object' ||
    b === null ||
    Array.isArray(a) !== Array.isArray(b)
  ) {
    return false;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) =>
    Object.is(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  );
};

/**
 * Creates a `Subscribable` from an arbitrary source.
 *
 * @param getValue reads the current value.
 * @param onSubscribe called when the first subscriber arrives; the returned
 * function is called when the last one leaves.
 */
export const createSubscribable = <T>(
  getValue: () => T,
  onSubscribe: (emit: (value: T) => void) => () => void,
): Subscribable<T> => {
  const handlers = new Set<(value: T) => void>();
  let teardown: (() => void) | undefined;
  // Sources commonly replay their current value the moment we attach (that is
  // what `StateStore.subscribe` does). We replay explicitly below instead, so
  // anything emitted while attaching is suppressed to avoid a duplicate.
  let attaching = false;
  const emit = (value: T) => {
    if (attaching) return;
    for (const handler of [...handlers]) handler(value);
  };

  return {
    getValue,
    get observed() {
      return handlers.size > 0;
    },
    subscribe(
      observerOrNext: ((value: T) => void) | Partial<Observer<T>>,
    ): Subscription {
      const next = toNext(observerOrNext);
      const handler = (value: T) => next?.(value);
      handlers.add(handler);
      if (handlers.size === 1) {
        attaching = true;
        try {
          teardown = onSubscribe(emit);
        } finally {
          attaching = false;
        }
      }
      // replay the current value, matching BehaviorSubject semantics
      handler(getValue());
      return toSubscription(() => {
        if (!handlers.delete(handler)) return;
        if (handlers.size === 0) {
          teardown?.();
          teardown = undefined;
        }
      });
    },
  };
};

/**
 * A `Subscribable` view over a single key of a `StateStore`.
 *
 * Deduplicates by identity - `StateStore.subscribeWithSelector` shallow-compares
 * selections, which gives us the `distinctUntilChanged()` behaviour the RxJS
 * implementation applied by hand.
 */
export const field = <T extends Record<string, unknown>, K extends keyof T>(
  store: StateStore<T>,
  key: K,
): Subscribable<T[K]> =>
  createSubscribable(
    () => store.getLatestValue()[key],
    (emit) => {
      // A plain `subscribe` with a direct identity check rather than
      // `subscribeWithSelector`: the latter allocates a selection tuple and
      // walks its keys on every notification, for every subscriber, which is
      // measurable once a call has many of them (see bench/measure-perf.mjs).
      let previous = store.getLatestValue()[key];
      return store.subscribe((state) => {
        const next = state[key];
        if (Object.is(previous, next)) return;
        previous = next;
        emit(next);
      });
    },
  );

/**
 * A `Subscribable` over a value derived from the store.
 *
 * @param store the store to read from.
 * @param selector derives the value. Must be cheap and free of side effects.
 * @param isEqual decides whether two derived values are the same. Defaults to
 * `Object.is`; pass a custom comparator when the selector allocates.
 */
export const select = <T extends Record<string, unknown>, O>(
  store: StateStore<T>,
  selector: (state: T) => O,
  isEqual: (a: O, b: O) => boolean = shallowEqual,
): Subscribable<O> => {
  // `getValue()` must return a stable reference while the inputs are
  // unchanged: React's `useSyncExternalStore` compares snapshots by identity
  // and re-renders forever if a selector allocates on every read.
  const compute = memoize(() => store.getLatestValue(), selector, isEqual);

  return createSubscribable(compute, (emit) => {
    let previous = compute();
    return store.subscribe(() => {
      const next = compute();
      if (isEqual(previous, next)) return;
      previous = next;
      emit(next);
    });
  });
};

/**
 * Wraps `project` so repeated calls return the same reference while the input
 * is unchanged, or while the projected values remain equal.
 */
const memoize = <I, O>(
  readInput: () => I,
  project: (input: I) => O,
  isEqual: (a: O, b: O) => boolean,
): (() => O) => {
  let cache: { input: I; output: O } | undefined;
  return () => {
    const input = readInput();
    if (cache && Object.is(cache.input, input)) return cache.output;
    const output = project(input);
    if (cache && isEqual(cache.output, output)) {
      cache = { input, output: cache.output };
      return cache.output;
    }
    cache = { input, output };
    return output;
  };
};

/**
 * Resolves with the first value matching the predicate, then unsubscribes.
 * Replaces `firstValueFrom`, `take(1)` and the `takeWhile(..., true)` idiom.
 *
 * @param source the source to read from.
 * @param predicate defaults to accepting any value that isn't `undefined`.
 */
export function firstValue<T>(source: Subscribable<T>): Promise<NonNullable<T>>;
export function firstValue<T>(
  source: Subscribable<T>,
  predicate: (value: T) => boolean,
): Promise<T>;
export function firstValue<T>(
  source: Subscribable<T>,
  predicate: (value: T) => boolean = (value) => value !== undefined,
): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    // eslint-disable-next-line prefer-const
    let subscription: Subscription | undefined;
    const accept = (value: T) => {
      if (settled || !predicate(value)) return;
      settled = true;
      // the source replays synchronously on subscribe, so the subscription may
      // not be assigned yet - unsubscribe after the fact in that case
      subscription?.unsubscribe();
      resolve(value);
    };
    subscription = source.subscribe(accept);
    if (settled) subscription.unsubscribe();
  });
}

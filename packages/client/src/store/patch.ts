/**
 * A new value, or a function which takes the current value and returns
 * the new one.
 */
export type Patch<T> = T | ((currentValue: T) => T);

/**
 * Resolves a {@link Patch} against the current value.
 *
 * Note that a `T` which is itself a function cannot be set directly - wrap it
 * in a function patch instead. No state we hold is function-typed.
 */
export const resolvePatch = <T>(patch: Patch<T>, currentValue: T): T =>
  typeof patch === 'function'
    ? (patch as (current: T) => T)(currentValue)
    : patch;

/**
 * Performs an order-insensitive shallow comparison of two arrays of primitives.
 * `[1, 2, 3]` is considered equal to `[2, 1, 3]`.
 */
export const isShallowArrayEqual = <T>(a: Array<T>, b: Array<T>): boolean => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (const item of a) {
    if (!b.includes(item)) return false;
  }
  for (const item of b) {
    if (!a.includes(item)) return false;
  }
  return true;
};

/**
 * Returns `previous` when it holds the same members as `next`, so that state
 * which has not meaningfully changed keeps its identity.
 *
 * This replaces the `distinctUntilChanged(isShallowArrayEqual)` operators the
 * RxJS implementation applied on read. Holding the identity stable at the
 * write site is strictly better: it also keeps React consumers from
 * re-rendering, which a read-side comparator could not do.
 */
export const preserveArrayIdentity = <T>(
  previous: Array<T>,
  next: Array<T> | undefined | null,
): Array<T> => {
  // the coordinator omits absent collections rather than sending an empty one,
  // so treat "not sent" as "unchanged"
  if (!next) return previous;
  return isShallowArrayEqual(previous, next) ? previous : next;
};

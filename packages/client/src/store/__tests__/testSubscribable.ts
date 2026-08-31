import { createSubscribable, type Subscribable } from '../subscribable';

/**
 * A `Subscribable` holding a value that never changes.
 *
 * Test-only: production code exposes state through a store, so a constant
 * source is only ever needed to stand in for one in a mock.
 */
export const constant = <T>(value: T): Subscribable<T> =>
  createSubscribable(
    () => value,
    () => () => {},
  );

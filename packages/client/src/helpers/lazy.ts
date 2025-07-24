const uninitialized = Symbol('uninitialized');

/**
 * Lazily creates a value using a provided factory
 */
export function lazy<T, A>(factory: (...args: A[]) => T): (...args: A[]) => T {
  let value: T | typeof uninitialized = uninitialized;
  return (...args: A[]) => {
    if (value === uninitialized) {
      value = factory(...args);
    }

    return value;
  };
}

const uninitialized = Symbol('uninitialized');

/**
 * Lazily creates a value using a provided factory
 */
export function lazy<T>(factory: () => T): () => T {
  let value: T | typeof uninitialized = uninitialized;
  return () => {
    if (value === uninitialized) {
      value = factory();
    }

    return value;
  };
}

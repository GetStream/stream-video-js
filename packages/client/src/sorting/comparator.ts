/**
 * Defines a comparator function which can be used for sorting items.
 */
export type Comparator<T> = (a: T, b: T) => -1 | 0 | 1;

/**
 * Creates a new combined {@link Comparator<T>} which sorts items by the given comparators.
 * The comparators are applied in the order they are given (left -> right).
 *
 * @param comparators the comparators to use for sorting.
 * @returns a combined {@link Comparator<T>}.
 */
export const combineComparators = <T>(
  ...comparators: Comparator<T>[]
): Comparator<T> => {
  return (a, b) => {
    for (const comparator of comparators) {
      const result = comparator(a, b);
      if (result !== 0) return result;
    }
    return 0;
  };
};

/**
 * Creates a new comparator which sorts items in descending order.
 *
 * @example
 * const byValue = (a, b) => a < b ? - 1 : a > b ? 1 : 0;
 * const byValueDesc = descending(byValue);
 *
 * @param comparator the comparator to wrap.
 */
export const descending = <T>(comparator: Comparator<T>): Comparator<T> => {
  return (a, b) => comparator(b, a);
};

/**
 * A no-op comparator which always returns 0.
 */
export const noopComparator = <T>(): Comparator<T> => {
  return () => 0;
};

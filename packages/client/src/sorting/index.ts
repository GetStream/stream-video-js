export * as ParticipantComparators from './participants';

/**
 * Defines a comparator function which can be used for sorting items.
 */
export type Comparator<T> = (a: T, b: T) => -1 | 0 | 1;

/**
 * Defines a sorting function.
 */
export type SortBy<T> = (items: T[]) => T[];

/**
 * Creates new function which sorts items by the given comparators.
 * The comparators are applied in the order they are given (left -> right).
 *
 * The "sort" function will return a new array with the sorted items.
 *
 * @param comparators the comparators to use for sorting.
 * @returns a sorting function.
 */
export const sortBy =
  <T>(...comparators: Comparator<T>[]): SortBy<T> =>
  (items: T[]) => {
    // make a shallow clone of the items array as
    // .sort() mutates the array in-place
    return [...items].sort((a, b) => {
      for (const comparator of comparators) {
        const result = comparator(a, b);
        if (result !== 0) return result;
      }
      return 0;
    });
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
export const descending =
  <T>(comparator: Comparator<T>): Comparator<T> =>
  (a, b) =>
    comparator(b, a);

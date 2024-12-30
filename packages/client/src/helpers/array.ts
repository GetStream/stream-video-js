/**
 * Adds unique values to an array.
 *
 * @param arr the array to add to.
 * @param values the values to add.
 */
export const pushToIfMissing = <T>(arr: T[], ...values: T[]): T[] => {
  for (const v of values) {
    if (!arr.includes(v)) {
      arr.push(v);
    }
  }
  return arr;
};

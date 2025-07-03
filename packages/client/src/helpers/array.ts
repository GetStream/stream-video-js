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

/**
 * Removes values from an array if they are present.
 *
 * @param arr the array to remove from.
 * @param values the values to remove.
 */
export const removeFromIfPresent = <T>(arr: T[], ...values: T[]): T[] => {
  for (const v of values) {
    const index = arr.indexOf(v);
    if (index !== -1) {
      arr.splice(index, 1);
    }
  }
  return arr;
};

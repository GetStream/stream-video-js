/**
 * Formats large numbers into a compact, human-friendly form: 1k, 1.5k, 2M, etc.
 */
export const humanize = (n: number): string => {
  if (n < 1000) return String(n);
  const units = [
    { value: 1_000_000_000, suffix: 'B' },
    { value: 1_000_000, suffix: 'M' },
    { value: 1_000, suffix: 'k' },
  ];
  for (const { value, suffix } of units) {
    if (n >= value) {
      const num = n / value;
      const precision = num < 100 ? 1 : 0; // show one decimal only for small leading numbers
      const formatted = num.toFixed(precision).replace(/\.0$/g, '');
      return `${formatted}${suffix}`;
    }
  }
  return String(n);
};

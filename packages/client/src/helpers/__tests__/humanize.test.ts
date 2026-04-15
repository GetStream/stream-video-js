import { describe, it, expect } from 'vitest';

import { humanize } from '../humanize';

describe('humanize', () => {
  it('returns the same string for numbers below 1000', () => {
    expect(humanize(0)).toBe('0');
    expect(humanize(1)).toBe('1');
    expect(humanize(12)).toBe('12');
    expect(humanize(999)).toBe('999');
  });

  it('formats thousands with k suffix', () => {
    expect(humanize(1000)).toBe('1k');
    expect(humanize(1500)).toBe('1.5k');
    expect(humanize(12_300)).toBe('12.3k');
    // >= 100 of the unit → no decimals
    expect(humanize(123_456)).toBe('123k');
  });

  it('formats millions with M suffix', () => {
    expect(humanize(1_000_000)).toBe('1M'); // trailing .0 removed
    expect(humanize(1_500_000)).toBe('1.5M');
    expect(humanize(12_000_000)).toBe('12M');
  });

  it('formats billions with B suffix', () => {
    expect(humanize(1_000_000_000)).toBe('1B');
    expect(humanize(1_250_000_000)).toBe('1.3B');
    expect(humanize(12_345_678_901)).toBe('12.3B');
  });

  it('rounds within the same unit and removes trailing .0', () => {
    // Rounds up within the same unit (k), does not carry over to the next unit
    expect(humanize(999_500)).toBe('1000k');
    // Rounds to a whole number for millions when first decimal rounds to .0
    expect(humanize(99_950_000)).toBe('100M');
    // No trailing .0
    expect(humanize(100_000)).toBe('100k');
  });
});

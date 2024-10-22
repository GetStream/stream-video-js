import { describe, expect, it } from 'vitest';
import { getOptimalBitrate } from '../bitrateLookup';

describe('bitrateLookup', () => {
  it('should return optimal bitrate', () => {
    expect(getOptimalBitrate('vp9', 720)).toBe(1_250_000);
  });

  it('should return nearest bitrate for exotic dimensions', () => {
    expect(getOptimalBitrate('vp9', 1000)).toBe(1_500_000);
  });
});

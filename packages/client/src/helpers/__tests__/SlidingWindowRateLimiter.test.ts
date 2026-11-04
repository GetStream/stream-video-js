import { describe, expect, it } from 'vitest';
import { SlidingWindowRateLimiter } from '../SlidingWindowRateLimiter';

describe('SlidingWindowRateLimiter', () => {
  it('allows up to the configured number of attempts inside the window', () => {
    const limiter = new SlidingWindowRateLimiter(3, 1000);
    expect(limiter.tryRegister(0)).toBe(true);
    expect(limiter.tryRegister(10)).toBe(true);
    expect(limiter.tryRegister(20)).toBe(true);
    // fourth attempt inside the same window is denied
    expect(limiter.tryRegister(30)).toBe(false);
  });

  it('prunes timestamps outside the rolling window so attempts after it pass', () => {
    const limiter = new SlidingWindowRateLimiter(2, 1000);
    expect(limiter.tryRegister(0)).toBe(true);
    expect(limiter.tryRegister(500)).toBe(true);
    expect(limiter.tryRegister(900)).toBe(false);
    // at t=1501 cutoff=501, so both 0 and 500 fall out of window
    expect(limiter.tryRegister(1501)).toBe(true);
  });

  it('canRegister() checks the budget without recording', () => {
    const limiter = new SlidingWindowRateLimiter(2, 1000);
    expect(limiter.canRegister(0)).toBe(true);
    expect(limiter.canRegister(0)).toBe(true);
    limiter.tryRegister(0);
    expect(limiter.canRegister(100)).toBe(true);
    // canRegister() recorded nothing: one slot was still free
    expect(limiter.tryRegister(100)).toBe(true);
    expect(limiter.canRegister(200)).toBe(false);
    // the attempt at t=0 leaves the window at t=1001
    expect(limiter.canRegister(1000)).toBe(false);
    expect(limiter.canRegister(1001)).toBe(true);
  });

  it('reset() clears the attempt history', () => {
    const limiter = new SlidingWindowRateLimiter(2, 1000);
    limiter.tryRegister(0);
    limiter.tryRegister(100);
    expect(limiter.tryRegister(200)).toBe(false);
    limiter.reset();
    expect(limiter.tryRegister(300)).toBe(true);
    expect(limiter.tryRegister(400)).toBe(true);
    expect(limiter.tryRegister(500)).toBe(false);
  });

  it('setLimits() updates the budget and window in place', () => {
    const limiter = new SlidingWindowRateLimiter(2, 1000);
    limiter.tryRegister(0);
    limiter.tryRegister(100);
    expect(limiter.tryRegister(200)).toBe(false);
    // raising the limit lets the next attempt through without reset
    limiter.setLimits(5, 1000);
    expect(limiter.tryRegister(300)).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { FAILURE_TOLERANCE } from '../e2ee-worker/constants';
import { FailureTracker } from '../e2ee-worker/failureTracker';

describe('FailureTracker', () => {
  it('flags the break only on the failure that crosses tolerance', () => {
    const tracker = new FailureTracker();
    // The first FAILURE_TOLERANCE failures stay under the bar.
    for (let i = 0; i < FAILURE_TOLERANCE; i++) {
      expect(tracker.recordFailure(1)).toBe(false);
    }
    // The next one crosses it - the break transition fires exactly once.
    expect(tracker.recordFailure(1)).toBe(true);
    expect(tracker.recordFailure(1)).toBe(false); // already stalled, no re-fire
  });

  it('recordSuccess clears the count and reports whether there were failures', () => {
    const tracker = new FailureTracker();
    expect(tracker.recordSuccess(1)).toBe(false); // nothing to resume
    tracker.recordFailure(1);
    expect(tracker.recordSuccess(1)).toBe(true); // had a failure -> recovered
    expect(tracker.recordSuccess(1)).toBe(false); // already clear
    // After a reset the tolerance bar can be crossed (and reported) again.
    for (let i = 0; i < FAILURE_TOLERANCE; i++) tracker.recordFailure(1);
    expect(tracker.recordFailure(1)).toBe(true);
  });

  it('counts each keyIndex independently within a track', () => {
    const tracker = new FailureTracker();
    for (let i = 0; i <= FAILURE_TOLERANCE; i++) tracker.recordFailure(1);
    // keyIndex 2 starts fresh: a key rotation does not inherit index 1's count.
    expect(tracker.recordFailure(2)).toBe(false);
  });

  it('scopes failures per tracker so one track cannot reset another', () => {
    const video = new FailureTracker();
    const audio = new FailureTracker();
    for (let i = 0; i <= FAILURE_TOLERANCE; i++) video.recordFailure(1);
    // The audio track shares neither the count nor the recovery edge.
    expect(audio.recordFailure(1)).toBe(false);
    expect(audio.recordSuccess(1)).toBe(true); // only its own single failure
    // ...and video's break state is untouched by audio's activity.
    expect(video.recordSuccess(1)).toBe(true);
  });
});

import { FAILURE_TOLERANCE } from './constants';

/**
 * Consecutive decryption failures on one track, keyed by keyIndex so a rotation
 * starts fresh.
 */
export class FailureTracker {
  private counts: Map<number, number> = new Map();

  /**
   * True only on the failure crossing {@link FAILURE_TOLERANCE}, so
   * `e2ee.broken` fires once per run.
   */
  recordFailure = (keyIndex: number): boolean => {
    const next = (this.counts.get(keyIndex) ?? 0) + 1;
    this.counts.set(keyIndex, next);
    return next === FAILURE_TOLERANCE + 1;
  };

  /**
   * True if there was a count to clear. Do NOT gate `e2ee.decryption_resumed`
   * on it: that event names a track, not a key epoch, so a track recovering on
   * a new keyIndex must still clear it.
   */
  recordSuccess = (keyIndex: number): boolean => this.counts.delete(keyIndex);
}

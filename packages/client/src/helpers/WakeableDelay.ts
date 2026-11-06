import { sleep } from '../coordinator/connection/utils';

/**
 * A delay that can be ended early, used for the retry backoffs that don't need
 * to wait out their interval once the page or the network is back.
 */
export class WakeableDelay {
  private wakers = new Set<() => void>();

  /**
   * Resolves after `ms`, or as soon as `wake` is called.
   */
  sleep = async (ms: number) => {
    let wake = () => {};
    const woken = new Promise<void>((resolve) => (wake = resolve));
    this.wakers.add(wake);
    try {
      await Promise.race([sleep(ms), woken]);
    } finally {
      this.wakers.delete(wake);
    }
  };

  /**
   * Ends the delays that are currently waiting.
   *
   * @returns whether any delay was waiting.
   */
  wake = () => {
    const waiting = [...this.wakers];
    waiting.forEach((wake) => wake());
    return waiting.length > 0;
  };
}

import type { WorkerTimer } from '@stream-io/worker-timer';

/**
 * In-memory replacement for WorkerTimer that delegates to the global
 * setTimeout / clearTimeout / setInterval / clearInterval. Designed for
 * Vitest's `vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })`
 * so a single advanceTimersByTimeAsync drives both production timers and any
 * test-side scheduling.
 */
export const createFakeWorkerTimer = (): WorkerTimer => {
  const timer = {
    setTimeout: (cb: () => void, ms: number): number =>
      setTimeout(cb, ms) as unknown as number,
    clearTimeout: (id?: number): void => {
      if (id != null) clearTimeout(id);
    },
    setInterval: (cb: () => void, ms: number): number =>
      setInterval(cb, ms) as unknown as number,
    clearInterval: (id?: number): void => {
      if (id != null) clearInterval(id);
    },
    destroy: () => {},
    get ready() {
      return true;
    },
  };
  return timer as unknown as WorkerTimer;
};

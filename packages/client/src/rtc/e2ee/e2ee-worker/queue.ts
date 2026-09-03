let tail: Promise<unknown> = Promise.resolve();

/**
 * Run tasks FIFO, one at a time, so a `setKey` cannot race transform setup.
 * `tail` swallows errors so one rejection cannot stall the queue; the returned
 * promise still carries that task's own outcome.
 */
export const enqueue = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = tail.then(fn);
  tail = run.catch(() => {});
  return run;
};

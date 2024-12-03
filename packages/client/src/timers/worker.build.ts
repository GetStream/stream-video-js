// Do not modify this file manually. You can edit worker.ts if necessary
// and the run ./generate-timer-worker.sh
export const timerWorker = {
  get src(): string {
    throw new Error(
      'Timer worker source missing. Did you forget to run generate-timer-worker.sh?',
    );
  },
};

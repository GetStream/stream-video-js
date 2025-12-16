import { WorkerTimer } from '@stream-io/worker-timer';
import { lazy } from '../helpers/lazy';

let timerWorkerEnabled = false;

export const enableTimerWorker = () => {
  timerWorkerEnabled = true;
};

export const getTimers = lazy(() => {
  return new WorkerTimer({ useWorker: timerWorkerEnabled });
});

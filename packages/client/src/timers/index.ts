import { lazy } from '../helpers/lazy';
import { getLogger } from '../logger';
import { TimerWorkerEvent, TimerWorkerRequest } from './types';
import { timerWorker } from './worker.build';

class TimerWorker {
  private currentTimerId = 1;
  private callbacks = new Map<number, () => void>();
  private worker: Worker | undefined;
  private fallback = false;

  setup({ useTimerWorker = true }: { useTimerWorker?: boolean } = {}): void {
    if (!useTimerWorker) {
      this.fallback = true;
      return;
    }

    try {
      const source = timerWorker.src;
      const blob = new Blob([source], {
        type: 'application/javascript; charset=utf-8',
      });
      const script = URL.createObjectURL(blob);
      this.worker = new Worker(script, { name: 'str-timer-worker' });
      this.worker.addEventListener('message', (event) => {
        const { type, id } = event.data as TimerWorkerEvent;
        if (type === 'tick') {
          this.callbacks.get(id)?.();
        }
      });
    } catch (err: any) {
      getLogger(['timer-worker'])('error', err);
      this.fallback = true;
    }
  }

  destroy(): void {
    this.callbacks.clear();
    this.worker?.terminate();
    this.worker = undefined;
    this.fallback = false;
  }

  get ready() {
    return this.fallback || Boolean(this.worker);
  }

  setInterval(callback: () => void, timeout: number): number {
    return this.setTimer('setInterval', callback, timeout);
  }

  clearInterval(id?: number): void {
    this.clearTimer('clearInterval', id);
  }

  setTimeout(callback: () => void, timeout: number): number {
    return this.setTimer('setTimeout', callback, timeout);
  }

  clearTimeout(id?: number): void {
    this.clearTimer('clearTimeout', id);
  }

  private setTimer(
    type: 'setTimeout' | 'setInterval',
    callback: () => void,
    timeout: number,
  ) {
    if (!this.ready) {
      this.setup();
    }

    if (this.fallback) {
      return (type === 'setTimeout' ? setTimeout : setInterval)(
        callback,
        timeout,
      ) as unknown as number;
    }

    const id = this.getTimerId();

    this.callbacks.set(id, () => {
      callback();

      // Timeouts are one-off operations, so no need to keep callback reference
      // after timer has fired
      if (type === 'setTimeout') {
        this.callbacks.delete(id);
      }
    });

    this.sendMessage({ type, id, timeout });
    return id;
  }

  private clearTimer(type: 'clearTimeout' | 'clearInterval', id?: number) {
    if (!id) {
      return;
    }

    if (!this.ready) {
      this.setup();
    }

    if (this.fallback) {
      (type === 'clearTimeout' ? clearTimeout : clearInterval)(id);
      return;
    }

    this.callbacks.delete(id);
    this.sendMessage({ type, id });
  }

  private getTimerId() {
    return this.currentTimerId++;
  }

  private sendMessage(message: TimerWorkerRequest) {
    if (!this.worker) {
      throw new Error("Cannot use timer worker before it's set up");
    }

    this.worker.postMessage(message);
  }
}

let timerWorkerEnabled = false;

export const enableTimerWorker = () => {
  timerWorkerEnabled = true;
};

export const getTimers = lazy(() => {
  const instance = new TimerWorker();
  instance.setup({ useTimerWorker: timerWorkerEnabled });
  return instance;
});

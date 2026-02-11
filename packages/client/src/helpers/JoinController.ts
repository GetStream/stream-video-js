import { JoinCanceledError } from '../errors';

export class JoinController {
  private controller?: AbortController;
  private joinTask?: Promise<void>;

  begin = () => {
    this.cancel();
    this.controller = new AbortController();
  };

  cancel = () => {
    this.controller?.abort();
  };

  finish = (): void => {
    this.joinTask = undefined;
    this.controller = undefined;
  };

  setJoinTask = (task: Promise<void>) => {
    this.joinTask = task;
  };

  waitForJoinTask = async (): Promise<void> => {
    return this.joinTask;
  };

  assertNotCanceled = (message?: string): void => {
    if (this.controller?.signal.aborted) throw new JoinCanceledError(message);
  };

  sleep = (ms: number): Promise<void> => {
    this.assertNotCanceled();
    const signal = this.controller?.signal;
    if (!signal) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);

      const onAbort = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
        reject(new JoinCanceledError());
      };

      signal.addEventListener('abort', onAbort, { once: true });
    });
  };
}

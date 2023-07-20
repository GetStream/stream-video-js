const sleep = (time: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, time);
  });

export class RetryError extends Error {
  public name = 'RetryError';

  private static errorMap = {
    abort: 'Value changed, retry handler aborted',
    finished: 'Reached maximum amount of retries',
  };

  constructor({ type }: { type: keyof typeof RetryError.errorMap }) {
    super(RetryError.errorMap[type]);
  }
}

/**
 * Function which wraps asynchronous functions with retry mechanism which'll keep executing said
 * function pre-defined number of times until it resolves, rejects or the retry mechanism runs out of available attempts.
 *
 * #### Available options:
 *  - `didValueChange` - check function with initial argument value to check against new values, return true to abort next attempt
 *
 *  - `isRetryable` - error evaluation function which determines whether to retry the execution
 *
 *  - `delayBetweenRetries` - accepts either fixed value or function which provides retry attempt as the argument, expects number as return value
 *
 *  - `retryAttempts` - number of attempts to try out before rejecting the promise
 */
export const runWithRetry =
  <T extends (...functionArguments: any[]) => Promise<any>>(
    f: T,
    {
      retryAttempts = 3,
      delayBetweenRetries,
      isRetryable,
      didValueChange,
    }: {
      retryAttempts?: number;
      delayBetweenRetries?: number | ((attempt: number) => number);
      isRetryable: (error: unknown) => boolean;
      didValueChange?: (...functionArguments: Parameters<T>) => boolean;
    },
  ) =>
  async (...functionArguments: Parameters<T>) => {
    // starting with -1 as first attempt is not considered a retry
    let retryAttempt = -1;

    do {
      let data: Awaited<ReturnType<T>> | null = null;
      let error: unknown = null;
      const isLastRun = retryAttempts === retryAttempt + 1;
      const isInitialRun = retryAttempt === -1;

      if (didValueChange?.(...functionArguments))
        throw new RetryError({ type: 'abort' });

      try {
        data = await f(...functionArguments);
      } catch (e) {
        error = e;
      }

      if (didValueChange?.(...functionArguments))
        throw new RetryError({ type: 'abort' });

      if (data) return data;

      const runRetry = isRetryable?.(error) ?? false;
      if (!runRetry) throw error;

      // TODO: maybe remove isInitialRun check?
      if (delayBetweenRetries && !isLastRun && !isInitialRun) {
        await sleep(
          typeof delayBetweenRetries === 'function'
            ? delayBetweenRetries(retryAttempt)
            : delayBetweenRetries,
        );
      }

      retryAttempt++;
    } while (retryAttempt < retryAttempts);

    throw new RetryError({ type: 'finished' });
  };

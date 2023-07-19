const promiseDelay = (time: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, time);
  });

export class RetryError extends Error {
  public name = 'RetryError';
}

/**
 * ## Solution #1
 * ### cons:
 * 	- in calls like updateSubscriptions there are two subscriptions to the same observable, one for the cancelation
 * 	- suffers from initial "next" run, needs check against latest value before aborting
 * 	- complexity
 * ### pros:
 * 	- isolated function context
 */
export const runWithRetry = <
  T extends (...functionArguments: any[]) => Promise<any>,
>(
  f: T,
  {
    retryAttempts = 3,
    delayBetweenRetries,
    evaluateError,
    cancelOnUpdate,
  }: {
    retryAttempts?: number;
    delayBetweenRetries?: number | ((attempt: number) => number);
    evaluateError: (error: unknown) => boolean;
    cancelOnUpdate?: (ac: AbortController) => (() => void) | void;
  },
) => {
  const abortController = new AbortController();

  // TODO: consider removing cleanup functionality altogether, GC take care of that for us once the promise is no longer being referenced anywhere (maybe test with FinalizationRegistry?)
  let cleanup: ReturnType<NonNullable<typeof cancelOnUpdate>>;

  abortController.signal.addEventListener(
    'abort',
    () => {
      cleanup?.();
    },
    { once: true },
  );

  cleanup = cancelOnUpdate?.(abortController);

  return async (...functionArguments: Parameters<T>) => {
    // starting with -1 as first attempt is not considered a retry
    let retryAttempt = -1;

    do {
      let data: Awaited<ReturnType<T>> | null = null;
      let error: unknown = null;
      const isLastRun = retryAttempts === retryAttempt + 1;
      const isInitialRun = retryAttempt === -1;

      // TODO: add cleanup here
      if (abortController.signal.aborted)
        throw new RetryError('Retry handler aborted');

      try {
        data = await f(...functionArguments);
      } catch (e) {
        error = e;
      }

      // TODO: add cleanup here
      if (data) return data;

      const runRetry = evaluateError?.(error) ?? false;
      // TODO: add cleanup here
      if (!runRetry) throw error;

      if (
        delayBetweenRetries &&
        !abortController.signal.aborted &&
        !isLastRun &&
        !isInitialRun
      )
        await promiseDelay(
          typeof delayBetweenRetries === 'function'
            ? delayBetweenRetries(retryAttempt)
            : delayBetweenRetries,
        );

      retryAttempt++;
    } while (retryAttempt < retryAttempts);

    throw new RetryError('Reached maximum amount of retries');
  };
};

/**
 * ## Solution #2
 *
 * ### pros:
 * 	- true "check value", runs pre-defined check function with initial arguments to
 * 	check against new values, return true to abort next attempt
 * ### cons:
 * 	- so far none?
 */
export const runWithRetry_checkValue =
  <T extends (...functionArguments: any[]) => Promise<any>>(
    f: T,
    {
      retryAttempts = 3,
      delayBetweenRetries,
      evaluateError,
      abortOnValueChange,
    }: {
      retryAttempts?: number;
      delayBetweenRetries?: number | ((attempt: number) => number);
      evaluateError: (error: unknown) => boolean;
      abortOnValueChange?: (...functionArguments: Parameters<T>) => boolean;
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

      // TODO: keep double value change check? (before and after running server request)
      if (abortOnValueChange?.(...functionArguments))
        throw new RetryError('Retry handler aborted');

      try {
        data = await f(...functionArguments);
      } catch (e) {
        error = e;
      }

      if (abortOnValueChange?.(...functionArguments))
        throw new RetryError('Retry handler aborted');

      if (data) return data;

      const runRetry = evaluateError?.(error) ?? false;
      if (!runRetry) throw error;

      // TODO: maybe remove isInitialRun check?
      if (delayBetweenRetries && !isLastRun && !isInitialRun) {
        await promiseDelay(
          typeof delayBetweenRetries === 'function'
            ? delayBetweenRetries(retryAttempt)
            : delayBetweenRetries,
        );
      }

      retryAttempt++;
    } while (retryAttempt < retryAttempts);

    throw new RetryError('Reached maximum amount of retries');
  };

/**
 * ## Solution #3
 *
 * ### pros:
 * 	- no need to create extra "cancelation hooks" as shared state ensures cleaning previous running instance
 * ### cons:
 * 	- shared state, requires instance (singleton possibly?)
 * 	- complexity?
 * 	- untested
 */
export class RetryManager {
  private runMap = new Map<Symbol, AbortController>();

  runWithRetry =
    <T extends (...functionArguments: any[]) => Promise<any>>(
      f: T,
      {
        runs = 3,
        delayBetweenRetries,
        evaluateError,
        symbol,
      }: {
        symbol: Symbol;
        runs?: number;
        delayBetweenRetries?: number | ((attempt: number) => number);
        evaluateError: (error: unknown) => boolean;
      },
    ) =>
    async (...functionArguments: Parameters<T>) => {
      this.runMap.get(symbol)?.abort();
      const abortController = new AbortController();
      this.runMap.set(symbol, abortController);

      for (let r = runs, attempt = 0; runs >= r && r > 0; --r, ++attempt) {
        let data: Awaited<ReturnType<T>> | null = null;
        let error: unknown = null;
        const isLastRun = r === 1;

        if (abortController.signal.aborted)
          throw new RetryError('Retry handler aborted');

        try {
          data = await f(...functionArguments);
        } catch (e) {
          error = e;
        }

        if (data) return data;

        const runRetry = evaluateError?.(error) ?? false;
        if (!runRetry) throw error;

        if (
          delayBetweenRetries &&
          !abortController.signal.aborted &&
          !isLastRun
        )
          await promiseDelay(
            typeof delayBetweenRetries === 'function'
              ? delayBetweenRetries(attempt)
              : delayBetweenRetries,
          );
      }

      throw new RetryError('No more runs left');
    };
}

// class C {
//   f = (t: number) =>
//     new Promise<number>((resolve, reject) => {
//       setTimeout(resolve, t, 123);
//     });
// }
// const instance = new C();

// runWithRetry_checkValue(instance.f, {
//   retryAttempts: 2,
//   evaluateError: (error) => {
//     return [500, 400, 401].includes(error.code);
//   },
//   abortOnValueChange: (t) => {
//     return observable$.getValue() === t;
//   },
// })(123)
//   .then((v) => {
//     console.log(v);
//   })
//   .catch((error) => {
//     if (error instanceof RetryError) console.log('whatever');
//     // other error
//   });

// const instance = new C();

// runWithRetry(instance.f, {
//   retryAttempts: 2,
//   evaluateError: (error) => {
//     return [500, 400, 401].includes(error.code);
//   },
//   cancelOnUpdate: (abortController) => {
//     const sub = observable$.subscribe({next: () => });
//     return () => sub.unsubscribe();
//   },
// })(123).catch((error) => {
//   if (error instanceof RetryError) console.log('whatever');
//   // other error
// });

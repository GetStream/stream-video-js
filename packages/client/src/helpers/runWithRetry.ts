import { FinishedUnaryCall, RpcError } from '@protobuf-ts/runtime-rpc';
import { TwirpErrorCode } from '@protobuf-ts/twirp-transport';

import { retryInterval, sleep } from '../coordinator/connection/utils';
import { Error as SfuError } from '../gen/video/sfu/models/models';

type FunctionToRetry<T = any> = (...functionArguments: any[]) => PromiseLike<T>;

/**
 * An internal interface which asserts that "retryable" SFU responses
 * contain a field called "error".
 * Ideally, this should be coming from the Protobuf definitions.
 */
export interface SfuResponseWithError {
  /**
   * An optional error field which should be present in all SFU responses.
   */
  error?: SfuError;
}

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
 * Function which wraps asynchronous RPC methods with error handler which checks whether response with code `200`
 * holds error data, if it does, it throws `RpcError` to prevent false positives for `runWithRetry` retry handler.
 */
export const handleFalsePositiveResponse = <
  I extends object,
  O extends SfuResponseWithError,
  T extends FunctionToRetry<FinishedUnaryCall<I, O>>,
>(
  f: T,
) =>
  async function falsePositiveHandler(...functionArguments: Parameters<T>) {
    // await or throw if "f" fails
    const data = (await f(...functionArguments)) as Awaited<ReturnType<T>>;
    // check for error data, throw if exist
    if (data.response.error) {
      throw new RpcError(
        data.response.error.message,
        TwirpErrorCode.unknown.toString(),
        // @ts-ignore - RpcError only allows for values to be string (it parses these metadata for logging)
        // though boolean parses to string so it's fine to ignore
        { shouldRetry: data.response.error.shouldRetry },
      );
    }

    return data;
  };

export type RunWithRetryOptions<T extends FunctionToRetry> = {
  retryAttempts?: number;
  delayBetweenRetries?: number | ((attempt: number) => number);
  isRetryable?: (error: unknown) => boolean;
  didValueChange?: (
    ...functionArguments: Parameters<T>
  ) => Promise<boolean> | boolean;
};

/**
 * Function which wraps asynchronous functions with retry mechanism which'll keep executing said
 * function pre-defined number of times until it resolves, rejects or the retry mechanism runs out of available attempts.
 *
 * #### Available options:
 *  - `didValueChange` - check function with initial argument value to check against new values, return `true` to abort next attempt
 *
 *  - `isRetryable` - error evaluation function which determines whether to retry the execution
 *
 *  - `delayBetweenRetries` - accepts either fixed numeric value or function which provides retry attempt as the argument, expects number as return value
 *
 *  - `retryAttempts` - number of attempts to try out before rejecting the promise
 */
export const runWithRetry = <T extends FunctionToRetry>(
  f: T,
  {
    retryAttempts = 3,
    delayBetweenRetries,
    isRetryable,
    didValueChange,
  }: RunWithRetryOptions<T> = {},
) =>
  async function retryable(...functionArguments: Parameters<T>) {
    // starting with -1 as first attempt is not considered a retry
    let retryAttempt = -1;

    do {
      let data: Awaited<ReturnType<T>> | null = null;
      let error: unknown = null;
      const isLastRun = retryAttempts === retryAttempt + 1;
      const isInitialRun = retryAttempt === -1;

      if (await didValueChange?.(...functionArguments)) {
        throw new RetryError({ type: 'abort' });
      }

      try {
        data = await f(...functionArguments);
      } catch (e) {
        error = e;
      }

      if (await didValueChange?.(...functionArguments)) {
        throw new RetryError({ type: 'abort' });
      }

      if (data) return data;

      const runRetry = isRetryable?.(error) ?? true;
      if (!runRetry) throw error;

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

export const shouldRetryErrorHandler = (error: unknown) => {
  return (
    error instanceof RpcError && (error.meta.shouldRetry as unknown as boolean)
  );
};

export const RetryPreset = {
  FastAndSimple: { retryAttempts: 3, isRetryable: shouldRetryErrorHandler },
  FastCheckValue: <T extends FunctionToRetry>(
    didValueChange: RunWithRetryOptions<T>['didValueChange'],
  ) => ({
    retryAttempts: 3,
    didValueChange,
    isRetryable: shouldRetryErrorHandler,
  }),
  NeverGonnaGiveYouUp: <T extends FunctionToRetry>(
    didValueChange: RunWithRetryOptions<T>['didValueChange'],
  ) => ({
    retryAttempts: 30,
    delayBetweenRetries: retryInterval,
    didValueChange,
    isRetryable: shouldRetryErrorHandler,
  }),
} as const;

/**
 * `runWithRetry` wrapper with pre-defined strategies (`RetryPreset`) and built in `handleFalsePositiveResponse` for RPC methods.
 */
export const retryable = <
  T extends FunctionToRetry,
  E extends keyof typeof RetryPreset,
>(
  f: T,
  strategy: E,
  didValueChange?: E extends 'FastAndSimple'
    ? never
    : RunWithRetryOptions<T>['didValueChange'],
) => {
  const preset = RetryPreset[strategy];

  return runWithRetry(
    // @ts-expect-error
    handleFalsePositiveResponse(f),
    typeof preset === 'function' ? preset(didValueChange) : preset,
  );
};

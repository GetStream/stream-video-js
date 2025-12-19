import {
  FinishedUnaryCall,
  RpcError,
  UnaryCall,
} from '@protobuf-ts/runtime-rpc';
import { TwirpErrorCode } from '@protobuf-ts/twirp-transport';
import { retryInterval, sleep } from '../coordinator/connection/utils';
import { Error as SfuError } from '../gen/video/sfu/models/models';
import { videoLoggerSystem } from '../logger';
import { TIMEOUT_SYMBOL } from './createClient';
import type { RpcInvocationMeta } from './types';

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

/**
 * Creates a closure which wraps the given RPC call and retries invoking
 * the RPC until it succeeds or the maximum number of retries is reached.
 *
 * For each retry, there would be a delay to avoid request bursts toward the SFU.
 *
 * @param rpc the closure around the RPC call to execute.
 * @param signal the signal to abort the RPC call and retries loop.
 * @param maxRetries the maximum number of retries to perform. Defaults to `Number.POSITIVE_INFINITY`.
 */
export const retryable = async <
  I extends object,
  O extends SfuResponseWithError,
>(
  rpc: (invocationMeta: RpcInvocationMeta) => UnaryCall<I, O>,
  signal?: AbortSignal,
  maxRetries = Number.POSITIVE_INFINITY,
): Promise<FinishedUnaryCall<I, O>> => {
  let attempt = 0;
  let result: FinishedUnaryCall<I, O> | undefined = undefined;
  do {
    if (attempt > 0) await sleep(retryInterval(attempt));
    try {
      result = await rpc({ attempt });
    } catch (err) {
      const isRequestCancelled =
        err instanceof RpcError &&
        err.message !== TIMEOUT_SYMBOL &&
        err.code === TwirpErrorCode[TwirpErrorCode.cancelled];
      const isAborted = signal?.aborted ?? false;
      if (isRequestCancelled || isAborted) throw err;
      if (attempt + 1 >= maxRetries) throw err;
      videoLoggerSystem
        .getLogger('sfu-client', { tags: ['rpc'] })
        .debug(`rpc failed (${attempt})`, err);
      attempt++;
    }
  } while (!result || result.response.error?.shouldRetry);

  return result;
};

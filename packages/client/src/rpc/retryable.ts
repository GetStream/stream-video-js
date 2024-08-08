import {
  FinishedUnaryCall,
  RpcError,
  UnaryCall,
} from '@protobuf-ts/runtime-rpc';
import { TwirpErrorCode } from '@protobuf-ts/twirp-transport';
import { retryInterval, sleep } from '../coordinator/connection/utils';
import { Error as SfuError } from '../gen/video/sfu/models/models';
import { getLogger } from '../logger';

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
 */
export const retryable = async <
  I extends object,
  O extends SfuResponseWithError,
>(
  rpc: () => UnaryCall<I, O>,
  signal?: AbortSignal,
): Promise<FinishedUnaryCall<I, O>> => {
  let attempt = 0;
  let result: FinishedUnaryCall<I, O> | undefined = undefined;
  do {
    if (attempt > 0) await sleep(retryInterval(attempt));
    try {
      result = await rpc();
    } catch (err) {
      const isRequestCancelled =
        err instanceof RpcError &&
        err.code === TwirpErrorCode[TwirpErrorCode.cancelled];
      const isAborted = signal?.aborted ?? false;
      if (isRequestCancelled || isAborted) throw err;
      getLogger(['sfu-client', 'rpc'])('debug', `rpc failed (${attempt})`, err);
      attempt++;
    }
  } while (!result || result.response.error?.shouldRetry);

  return result;
};

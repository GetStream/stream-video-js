import { describe, expect, it, vi } from 'vitest';
import { RpcError, UnaryCall } from '@protobuf-ts/runtime-rpc';
import { TwirpErrorCode } from '@protobuf-ts/twirp-transport';
import { retryable, SfuResponseWithError } from '../retryable';

interface TestResponseWithError extends SfuResponseWithError {
  value: number;
}

describe('retryable', () => {
  it('retries the RPC when the SFU instructs to do so', async () => {
    // @ts-expect-error incomplete unary call
    const rpc = vi.fn<any[], UnaryCall<{}, TestResponseWithError>>(() => {
      if (rpc.mock.calls.length <= 2) {
        return { response: { error: { shouldRetry: true } } };
      }
      return { response: { value: 10 } };
    });

    const result = await retryable(rpc);
    expect(result).toBeDefined();
    expect(result.response.value).toBe(10);
    expect(rpc).toHaveBeenCalledTimes(3);
  });

  it('retries when the RPC fails', async () => {
    // @ts-expect-error incomplete unary call
    const rpc = vi.fn<any[], UnaryCall<{}, TestResponseWithError>>(() => {
      if (rpc.mock.calls.length === 1) throw new Error('failed');
      return { response: { value: 10 } };
    });

    const result = await retryable(rpc);
    expect(result).toBeDefined();
    expect(result.response.value).toBe(10);
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it('stops retrying when the RPC is rejected with cancellation error', async () => {
    // @ts-expect-error incomplete unary call
    const rpc = vi.fn<any[], UnaryCall<{}, TestResponseWithError>>(() => {
      if (rpc.mock.calls.length <= 1) {
        throw new Error('Generic error, should retry');
      }
      if (rpc.mock.calls.length === 2) {
        throw new RpcError(
          'Request aborted, should not retry',
          TwirpErrorCode[TwirpErrorCode.cancelled],
        );
      }
    });

    const result = retryable(rpc);
    await expect(result).rejects.toThrow('Request aborted, should not retry');
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it('stops retrying when the aborted via signal', async () => {
    const controller = new AbortController();
    const rpc = vi.fn<any[], UnaryCall<{}, TestResponseWithError>>(() => {
      if (rpc.mock.calls.length <= 1) {
        throw new Error('Generic error, should retry');
      }
      controller.abort();
      throw new Error('Request aborted, should not retry');
    });

    const result = retryable(rpc, controller.signal);
    await expect(result).rejects.toThrow('Request aborted, should not retry');
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});

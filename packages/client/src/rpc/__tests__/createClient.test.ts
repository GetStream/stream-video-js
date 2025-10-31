import { describe, expect, it, vi } from 'vitest';
import {
  createSignalClient,
  withHeaders,
  withRequestLogger,
  withRequestTracer,
} from '../createClient';
import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport';
import { NextUnaryFn, UnaryCall } from '@protobuf-ts/runtime-rpc';
import { promiseWithResolvers } from '../../helpers/promise';
import { ScopedLogger } from '../../logger';

describe('createClient', () => {
  it('should create a client with TwirpFetchTransport', () => {
    const client = createSignalClient();
    expect(client).toBeDefined();
    // @ts-expect-error - private field
    expect(client._transport).toBeDefined();
    // @ts-expect-error - private field
    expect(client._transport).toBeInstanceOf(TwirpFetchTransport);
  });

  it('withHeaders should add headers to the request', () => {
    const headers = { Authorization: 'Bearer token' };
    const interceptor = withHeaders(headers);
    const next = vi.fn();
    interceptor.interceptUnary(next, null, null, { meta: {} });
    expect(next).toHaveBeenCalled();
    expect(next.mock.lastCall.at(-1).meta).toEqual(headers);
  });

  it('withRequestLogger should log the request', () => {
    const logger = vi.fn();
    const interceptor = withRequestLogger(
      { debug: logger } as unknown as ScopedLogger,
      'debug',
    );
    const next = vi.fn().mockReturnValue({});
    // @ts-expect-error - private field
    interceptor.interceptUnary(next, { name: 'test' }, null, null);
    expect(next).toHaveBeenCalled();
    expect(logger).toHaveBeenCalled();
  });

  it('withRequestTracer should add trace to the request', () => {
    const trace = vi.fn();
    const interceptor = withRequestTracer(trace);
    // @ts-expect-error - partial implementation
    const next: NextUnaryFn = vi.fn(() => ({ then: () => Promise.resolve() }));
    interceptor.interceptUnary(
      next,
      // @ts-expect-error - invalid name
      { name: 'TestMethod' },
      { param: 'value' },
      { meta: {} },
    );
    expect(next).toHaveBeenCalled();
    expect(trace).toHaveBeenCalledWith('TestMethod', { param: 'value' });
  });

  it('withRequestTracer should add a failure trace when the SFU returns an error', async () => {
    const trace = vi.fn();
    const interceptor = withRequestTracer(trace);
    const { promise, resolve } = promiseWithResolvers<UnaryCall['then']>();
    // @ts-expect-error - partial implementation
    const next = vi.fn<NextUnaryFn>(() => ({
      // @ts-expect-error - incompatible type
      then: (...args) => promise.then(...args),
    }));
    interceptor.interceptUnary(
      next,
      // @ts-expect-error - invalid name
      { name: 'TestMethod' },
      { param: 'value' },
      { meta: {} },
    );
    expect(next).toHaveBeenCalled();

    // @ts-expect-error - partial data
    resolve({ response: { error: { msg: 'err' } } });
    await promise;

    expect(trace).toHaveBeenCalledWith('TestMethod', { param: 'value' });
    expect(trace).toHaveBeenCalledWith('TestMethodOnFailure', [
      { msg: 'err' },
      { param: 'value' },
    ]);
  });
});

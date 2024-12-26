import { describe, expect, it, vi } from 'vitest';
import {
  createSignalClient,
  withHeaders,
  withRequestLogger,
} from '../createClient';
import { TwirpFetchTransport } from '@protobuf-ts/twirp-transport';

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
    const level = 'debug';
    const interceptor = withRequestLogger(logger, level);
    const next = vi.fn();
    // @ts-expect-error - private field
    interceptor.interceptUnary(next, { name: 'test' }, null, null);
    expect(next).toHaveBeenCalled();
    expect(logger).toHaveBeenCalled();
  });
});

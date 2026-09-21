import { describe, expect, it, vi } from 'vitest';
import type { AxiosResponse } from 'axios';
import { ApiClient } from '../api-client';
import { StreamClient } from '../client';
import { fromPartial } from '@total-typescript/shoehorn';

const axiosResponse = (
  overrides: Partial<AxiosResponse> = {},
): AxiosResponse => ({
  data: { duration: '1ms' },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: { headers: {} } as AxiosResponse['config'],
  ...overrides,
});

const setup = (response: AxiosResponse = axiosResponse()) => {
  const doAxiosRequest = vi.fn().mockResolvedValue(response);
  const streamClient = {
    baseURL: 'https://video.example.com',
    doAxiosRequest,
  } as unknown as StreamClient;
  return { apiClient: new ApiClient(streamClient), doAxiosRequest };
};

// The generated classes call sendRequest positionally, so the argument order
// asserted here is part of the generator contract.
describe('ApiClient.sendRequest', () => {
  it('lowercases the method and resolves the path against baseURL', async () => {
    const { apiClient, doAxiosRequest } = setup();
    await apiClient.sendRequest('GET', '/api/v2/video/edges');

    const [method, url] = doAxiosRequest.mock.calls[0];
    expect(method).toBe('get');
    expect(url).toBe('https://video.example.com/api/v2/video/edges');
  });

  it('fills and URL-encodes path parameters', async () => {
    const { apiClient, doAxiosRequest } = setup();
    await apiClient.sendRequest('POST', '/api/v2/video/call/{type}/{id}/join', {
      type: 'default',
      id: 'a b/c',
    });

    expect(doAxiosRequest.mock.calls[0][1]).toBe(
      'https://video.example.com/api/v2/video/call/default/a%20b%2Fc/join',
    );
  });

  it('passes body and content type through, and omits headers without one', async () => {
    const { apiClient, doAxiosRequest } = setup();
    await apiClient.sendRequest(
      'POST',
      '/api/v2/devices',
      undefined,
      undefined,
      { id: 'd1' },
      'application/json',
    );
    await apiClient.sendRequest('GET', '/api/v2/devices');

    expect(doAxiosRequest.mock.calls[0][2]).toEqual({ id: 'd1' });
    expect(doAxiosRequest.mock.calls[0][3].headers).toEqual({
      'Content-Type': 'application/json',
    });
    expect(doAxiosRequest.mock.calls[1][2]).toBeUndefined();
    expect(doAxiosRequest.mock.calls[1][3].headers).toBeUndefined();
  });

  it('flattens the body and attaches metadata built from headers', async () => {
    const { apiClient } = setup(
      axiosResponse({
        data: { duration: '2ms', call: { id: 'c1' } },
        status: 201,
        headers: {
          'x-ratelimit-limit': '300',
          'x-ratelimit-remaining': '299',
          'x-ratelimit-reset': '1700000000',
          'content-type': 'application/json',
        },
        config: fromPartial<AxiosResponse['config']>({
          headers: { 'x-client-request-id': 'req-1' },
        }),
      }),
    );

    const result = await apiClient.sendRequest<{
      duration: string;
      call: { id: string };
    }>('GET', '/api/v2/video/call/{type}/{id}', { type: 't', id: 'c1' });

    expect(result.call).toEqual({ id: 'c1' });
    expect(result.duration).toBe('2ms');
    expect(result.metadata).toEqual({
      response_code: 201,
      client_request_id: 'req-1',
      response_headers: {
        'x-ratelimit-limit': '300',
        'x-ratelimit-remaining': '299',
        'x-ratelimit-reset': '1700000000',
        'content-type': 'application/json',
      },
      rate_limit: {
        rate_limit: 300,
        rate_limit_remaining: 299,
        rate_limit_reset: new Date(1700000000 * 1000),
      },
    });
  });

  it('leaves rate-limit fields unset when the headers are missing or malformed', async () => {
    const { apiClient } = setup(
      axiosResponse({ headers: { 'x-ratelimit-limit': 'nope' } }),
    );
    const result = await apiClient.sendRequest('GET', '/api/v2/video/edges');

    expect(result.metadata.rate_limit).toEqual({});
    expect(result.metadata.client_request_id).toBe('');
  });
});

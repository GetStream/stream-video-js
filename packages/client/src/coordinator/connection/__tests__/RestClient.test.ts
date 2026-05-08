import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';
import { RestClient } from '../internal/RestClient';
import { ConnectionIdGate } from '../internal/ConnectionIdGate';
import { TokenManager } from '../token_manager';
import {
  ErrorFromResponse,
  WebSocketConnectionError,
  type StreamClientOptions,
  type UserWithId,
} from '../types';
import { createFakeLogger } from './helpers/fakeLogger';
import type { CoordinatorSocket } from '../internal/CoordinatorSocket';

const encodeBase64Url = (input: string): string => {
  const b64 =
    typeof btoa === 'function'
      ? btoa(input)
      : Buffer.from(input, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const jwtFor = (userId: string): string => {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify({ user_id: userId }));
  return `${header}.${body}.signature`;
};

type AxiosFn = Mock;

const createAxiosMock = () => {
  const get: AxiosFn = vi.fn();
  const post: AxiosFn = vi.fn();
  const put: AxiosFn = vi.fn();
  const patch: AxiosFn = vi.fn();
  const del: AxiosFn = vi.fn();
  const options: AxiosFn = vi.fn();
  return {
    instance: {
      get,
      post,
      put,
      patch,
      delete: del,
      options,
    } as unknown as Parameters<typeof RestClient>[0]['axiosInstance'],
    fns: { get, post, put, patch, delete: del, options },
  };
};

const setupClient = (overrides?: {
  user?: UserWithId;
  staticToken?: boolean;
  socket?: CoordinatorSocket;
  guestUserCreatePromise?: Promise<unknown>;
  options?: StreamClientOptions;
  tokenExpiryRetryLimit?: number;
  restConnectionIdTimeoutMs?: number;
}) => {
  const axios = createAxiosMock();
  const gate = new ConnectionIdGate();
  const tokenManager = new TokenManager(
    overrides?.staticToken ? 'server-secret' : undefined,
  );
  const userId = overrides?.user?.id ?? 'jane';
  const validToken = jwtFor(userId);
  if (overrides?.staticToken) {
    (tokenManager as unknown as { token: string }).token = 'static-token';
    (tokenManager as unknown as { type: string }).type = 'static';
  } else {
    (tokenManager as unknown as { token: string }).token = validToken;
    (tokenManager as unknown as { type: string }).type = 'provider';
    (tokenManager as unknown as { user: UserWithId | undefined }).user =
      overrides?.user;
    (
      tokenManager as unknown as { tokenProvider: () => Promise<string> }
    ).tokenProvider = async () => validToken;
  }
  const user = overrides?.user;
  const socket = overrides?.socket;
  const client = new RestClient({
    axiosInstance: axios.instance,
    tokenManager,
    options: overrides?.options ?? {},
    getApiKey: () => 'api-key',
    getUserId: () => user?.id,
    getUser: () => user,
    getAuthType: () => (user?.id === '!anon' ? 'anonymous' : 'jwt'),
    getUserAgent: () => 'stream-video-js-vTEST|client_bundle=node',
    gate,
    getSocket: () => socket,
    getGuestUserCreatePromise: () => overrides?.guestUserCreatePromise,
    logger: createFakeLogger(),
    tokenExpiryRetryLimit: overrides?.tokenExpiryRetryLimit,
    restConnectionIdTimeoutMs: overrides?.restConnectionIdTimeoutMs,
    defaultWsTimeoutMs: 1000,
  });
  return { client, axios: axios.fns, gate, tokenManager };
};

const tokenExpiredResponse = {
  data: {
    code: 40,
    message: 'token expired',
    StatusCode: 401,
  },
  status: 401,
};

describe('RestClient', () => {
  it('enriches public requests without Authorization and with anonymous auth-type when no user', async () => {
    const { client, axios } = setupClient();
    axios.get.mockResolvedValueOnce({ data: { ok: true } });
    await client.request<{ ok: boolean }>('get', '/foo', undefined, {
      publicEndpoint: true,
    });
    const config = axios.get.mock.calls[0][1];
    expect(config.headers.Authorization).toBeUndefined();
    expect(config.headers['stream-auth-type']).toBe('anonymous');
    expect(config.params.api_key).toBe('api-key');
    expect(config.params.connection_id).toBeUndefined();
  });

  it('enriches private requests with Authorization and connection_id from the socket', async () => {
    const fakeSocket = {
      getConnectionId: () => 'conn-A',
      waitForHealthy: vi.fn(),
    } as unknown as CoordinatorSocket;
    const { client, axios, gate, tokenManager } = setupClient({
      user: { id: 'jane' },
      socket: fakeSocket,
    });
    gate.arm();
    gate.resolve('conn-A');
    axios.get.mockResolvedValueOnce({ data: { ok: true } });
    await client.request('get', '/foo');
    const config = axios.get.mock.calls[0][1];
    expect(config.headers.Authorization).toBe(tokenManager.getToken());
    expect(config.headers['stream-auth-type']).toBe('jwt');
    expect(config.params.connection_id).toBe('conn-A');
    expect(config.params.user_id).toBe('jane');
  });

  it('attaches a generated x-client-request-id when none is supplied', async () => {
    const { client, axios, gate } = setupClient({ user: { id: 'jane' } });
    gate.arm();
    gate.resolve('conn-A');
    axios.get.mockResolvedValueOnce({ data: { ok: true } });
    await client.request('get', '/foo');
    const config = axios.get.mock.calls[0][1];
    expect(config.headers['x-client-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('blocks on gate.await for non-public requests', async () => {
    const { client, axios, gate } = setupClient({ user: { id: 'jane' } });
    gate.arm();
    axios.get.mockResolvedValueOnce({ data: { ok: true } });
    const inflight = client.request('get', '/foo');
    let settled = false;
    inflight.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(axios.get).not.toHaveBeenCalled();
    gate.resolve('conn-A');
    await inflight;
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('skips the gate for public requests', async () => {
    const { client, axios } = setupClient();
    axios.post.mockResolvedValueOnce({ data: { ok: true } });
    await client.request(
      'post',
      '/guest',
      { user: { id: 'jane' } },
      {
        publicEndpoint: true,
      },
    );
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it('retries once on token-expired then succeeds (refreshes the token)', async () => {
    const { client, axios, gate, tokenManager } = setupClient({
      user: { id: 'jane' },
    });
    gate.arm();
    gate.resolve('conn-A');
    const loadTokenSpy = vi.spyOn(tokenManager, 'loadToken');
    axios.get
      .mockRejectedValueOnce({ response: tokenExpiredResponse })
      .mockResolvedValueOnce({ data: { ok: true } });
    const result = await client.request<{ ok: boolean }>('get', '/foo');
    expect(result).toEqual({ ok: true });
    expect(loadTokenSpy).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it('caps token-expired retry depth via tokenExpiryRetryLimit (F4)', async () => {
    const { client, axios, gate } = setupClient({
      user: { id: 'jane' },
      tokenExpiryRetryLimit: 2,
    });
    gate.arm();
    gate.resolve('conn-A');
    axios.get.mockRejectedValue({ response: tokenExpiredResponse });
    await expect(client.request('get', '/foo')).rejects.toBeInstanceOf(
      ErrorFromResponse,
    );
    // initial attempt + 2 retries = 3 axios calls
    expect(axios.get).toHaveBeenCalledTimes(3);
  });

  it('does NOT retry on token-expired when tokenManager.isStatic()', async () => {
    const { client, axios, gate } = setupClient({
      user: { id: 'jane' },
      staticToken: true,
    });
    gate.arm();
    gate.resolve('conn-A');
    axios.get.mockRejectedValueOnce({ response: tokenExpiredResponse });
    await expect(client.request('get', '/foo')).rejects.toBeInstanceOf(
      ErrorFromResponse,
    );
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('attaches client_request_id when the network rejects without a response', async () => {
    const { client, axios, gate } = setupClient({ user: { id: 'jane' } });
    gate.arm();
    gate.resolve('conn-A');
    const error: { response?: unknown; client_request_id?: string } = {};
    axios.get.mockRejectedValueOnce(error);
    await expect(client.request('get', '/foo')).rejects.toBe(error);
    expect(error.client_request_id).toBeTypeOf('string');
  });

  it('uses fallback waitForHealthy when the gate rejects, then re-awaits the gate (F1 fallback)', async () => {
    const waitForHealthy = vi.fn(async () => undefined);
    const fakeSocket = {
      getConnectionId: () => 'conn-B',
      waitForHealthy,
    } as unknown as CoordinatorSocket;
    const { client, axios, gate } = setupClient({
      user: { id: 'jane' },
      socket: fakeSocket,
    });
    gate.arm();
    // Reject the gate to simulate broken close.
    gate.reject(
      new WebSocketConnectionError({
        code: 1006,
        StatusCode: 0,
        message: 'closed',
        isWSFailure: true,
      }),
    );
    axios.get.mockResolvedValueOnce({ data: { ok: true } });
    // The fallback runs waitForHealthy(remaining). Inside it, simulate that
    // a fresh gate.arm() ran (mimicking the next handshake), then resolve.
    waitForHealthy.mockImplementationOnce(async () => {
      gate.arm();
      gate.resolve('conn-B');
      return undefined;
    });
    const result = await client.request<{ ok: boolean }>('get', '/foo');
    expect(result).toEqual({ ok: true });
    expect(waitForHealthy).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  describe('connection-id timeout (F14)', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('rejects with CONNECTION_ID_TIMEOUT when the gate never resolves', async () => {
      const { client, gate } = setupClient({
        user: { id: 'jane' },
        restConnectionIdTimeoutMs: 100,
      });
      gate.arm();
      const promise = client.request('get', '/foo').catch((e) => e);
      await vi.advanceTimersByTimeAsync(99);
      const pending = await Promise.race([
        promise,
        Promise.resolve('still-pending'),
      ]);
      expect(pending).toBe('still-pending');
      await vi.advanceTimersByTimeAsync(2);
      const result = await promise;
      expect(result).toBeInstanceOf(WebSocketConnectionError);
      expect((result as WebSocketConnectionError).code).toBe(
        'CONNECTION_ID_TIMEOUT',
      );
    });

    it('public-endpoint requests are NOT subject to the connection-id timeout', async () => {
      const { client, axios } = setupClient({
        user: { id: 'jane' },
        restConnectionIdTimeoutMs: 100,
      });
      axios.get.mockResolvedValueOnce({ data: { ok: true } });
      const promise = client.request('get', '/health', undefined, {
        publicEndpoint: true,
      });
      await vi.advanceTimersByTimeAsync(200);
      await expect(promise).resolves.toEqual({ ok: true });
    });
  });

  it('is constructable with getSocket() returning undefined and only connects to a socket later (Arch#1)', async () => {
    let socket: CoordinatorSocket | undefined;
    const axios = createAxiosMock();
    const tokenManager = new TokenManager('server-secret');
    (tokenManager as unknown as { token: string }).token = 'static-token';
    (tokenManager as unknown as { type: string }).type = 'static';
    const gate = new ConnectionIdGate();
    const client = new RestClient({
      axiosInstance: axios.instance,
      tokenManager,
      options: {},
      getApiKey: () => 'api-key',
      getUserId: () => 'jane',
      getUser: () => ({ id: 'jane' }),
      getAuthType: () => 'jwt',
      getUserAgent: () => 'ua',
      gate,
      getSocket: () => socket,
      getGuestUserCreatePromise: () => undefined,
      logger: createFakeLogger(),
      defaultWsTimeoutMs: 1000,
    });
    socket = {
      getConnectionId: () => 'conn-Z',
      waitForHealthy: vi.fn(),
    } as unknown as CoordinatorSocket;
    gate.arm();
    gate.resolve('conn-Z');
    axios.fns.get.mockResolvedValueOnce({ data: { ok: true } });
    await client.request('get', '/foo');
    const config = axios.fns.get.mock.calls[0][1];
    expect(config.params.connection_id).toBe('conn-Z');
  });
});

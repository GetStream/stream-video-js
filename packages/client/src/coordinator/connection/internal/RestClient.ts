import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ScopedLogger } from '../../../logger';
import {
  APIErrorResponse,
  ErrorFromResponse,
  StreamClientOptions,
  UserWithId,
  WebSocketConnectionError,
} from '../types';
import {
  generateUUIDv4,
  isErrorResponse,
  KnownCodes,
  retryInterval,
  sleep,
} from '../utils';
import type { TokenManager } from '../token_manager';
import type { ConnectionIdGate } from './ConnectionIdGate';
import type { CoordinatorSocket } from './CoordinatorSocket';

type AuthType = 'jwt' | 'anonymous';

export type RestClientDependencies = {
  axiosInstance: AxiosInstance;
  tokenManager: TokenManager;
  options: StreamClientOptions;
  getApiKey: () => string;
  getUserId: () => string | undefined;
  getUser: () => UserWithId | undefined;
  getAuthType: () => AuthType;
  getUserAgent: () => string;
  gate: ConnectionIdGate;
  /** Re-read each request so the socket can be created lazily in openConnection. */
  getSocket: () => CoordinatorSocket | undefined;
  getGuestUserCreatePromise: () => Promise<unknown> | undefined;
  logger: ScopedLogger;
  /** F4: cap the per-request token-expired retry depth. Defaults to 2. */
  tokenExpiryRetryLimit?: number;
  /** Default 15000. Used as the initial budget when no per-call timeout is set. */
  defaultWsTimeoutMs?: number;
  /**
   * F14: end-to-end deadline (ms) for the auth-gating phase of a non-public
   * REST request. Defaults to defaultWsTimeoutMs.
   */
  restConnectionIdTimeoutMs?: number;
};

type RequestType = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options';

type RequestOptions = AxiosRequestConfig & {
  config?: AxiosRequestConfig;
  publicEndpoint?: boolean;
};

const newConnectionIdTimeoutError = (): WebSocketConnectionError =>
  new WebSocketConnectionError({
    code: 'CONNECTION_ID_TIMEOUT',
    StatusCode: 0,
    message: 'connection id not available within timeout',
    isWSFailure: true,
  });

/**
 * Race a promise against a timeout. If `ms <= 0`, throws `errFactory()`
 * immediately. If the timeout wins, throws `errFactory()` and clears the
 * scheduled timer.
 */
async function raceWithTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errFactory: () => Error,
): Promise<T> {
  if (ms <= 0) throw errFactory();
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutP = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(errFactory()), ms);
  });
  try {
    return await Promise.race([promise, timeoutP]);
  } finally {
    if (timeoutHandle != null) clearTimeout(timeoutHandle);
  }
}

/**
 * REST adapter around axios. Owns header/param enrichment, the auth-gating
 * phase deadline (F14), and the per-request token-expired retry cap (F4).
 * Does NOT depend on CoordinatorSocket at construction time: receives a
 * `getSocket()` callback that's re-read at request time.
 */
export class RestClient {
  private deps: RestClientDependencies;
  private retryLimit: number;
  private defaultWsTimeoutMs: number;
  private connectionIdTimeoutMs: number;
  consecutiveFailures = 0;

  constructor(deps: RestClientDependencies) {
    this.deps = deps;
    this.retryLimit = deps.tokenExpiryRetryLimit ?? 2;
    this.defaultWsTimeoutMs = deps.defaultWsTimeoutMs ?? 15000;
    this.connectionIdTimeoutMs =
      deps.restConnectionIdTimeoutMs ?? this.defaultWsTimeoutMs;
  }

  request = async <T, D = unknown>(
    type: RequestType,
    url: string,
    data?: D,
    options: RequestOptions = {},
    tokenExpiryAttempt = 0,
  ): Promise<T> => {
    if (!options.publicEndpoint) {
      await Promise.all([
        this.deps.tokenManager.tokenReady(),
        this.deps.getGuestUserCreatePromise(),
      ]);
      const deadline = Date.now() + this.connectionIdTimeoutMs;
      const remaining = () => Math.max(0, deadline - Date.now());
      try {
        await raceWithTimeout(
          this.deps.gate.await(),
          remaining(),
          newConnectionIdTimeoutError,
        );
      } catch (err) {
        if (
          err instanceof WebSocketConnectionError &&
          err.code === 'CONNECTION_ID_TIMEOUT'
        ) {
          throw err;
        }
        if (remaining() <= 0) throw newConnectionIdTimeoutError();
        const socket = this.deps.getSocket();
        if (socket) {
          try {
            await raceWithTimeout(
              socket.waitForHealthy(remaining()),
              remaining(),
              newConnectionIdTimeoutError,
            );
          } catch (e) {
            if (
              e instanceof WebSocketConnectionError &&
              e.code === 'CONNECTION_ID_TIMEOUT'
            ) {
              throw e;
            }
            // any other waitForHealthy error: swallow and try the gate again
          }
        }
        if (remaining() <= 0) throw newConnectionIdTimeoutError();
        await raceWithTimeout(
          this.deps.gate.await(),
          remaining(),
          newConnectionIdTimeoutError,
        );
      }
    }

    const requestConfig = this.enrichOptions(options);
    try {
      this.logRequest(type, url, data, requestConfig);
      const response = await this.dispatch<T, D>(
        type,
        url,
        data,
        requestConfig,
      );
      this.logResponse(type, url, response);
      this.consecutiveFailures = 0;
      return response.data;
    } catch (e: unknown) {
      const err = e as {
        client_request_id?: string;
        response?: AxiosResponse<APIErrorResponse>;
      };
      err.client_request_id = (
        requestConfig.headers as Record<string, string> | undefined
      )?.['x-client-request-id'];
      this.consecutiveFailures += 1;
      const { response } = err;
      if (!response || !isErrorResponse(response)) {
        this.deps.logger.error(`client:${type} url: ${url}`, e);
        throw e;
      }
      const { data: responseData, status } = response;
      const isTokenExpired = responseData.code === KnownCodes.TOKEN_EXPIRED;
      if (
        isTokenExpired &&
        !this.deps.tokenManager.isStatic() &&
        tokenExpiryAttempt < this.retryLimit
      ) {
        this.deps.logger.warn(`client:${type} url: ${url}`, response);
        if (this.consecutiveFailures > 1) {
          await sleep(retryInterval(this.consecutiveFailures));
        }
        await this.deps.tokenManager.loadToken();
        return await this.request<T, D>(
          type,
          url,
          data,
          options,
          tokenExpiryAttempt + 1,
        );
      }
      this.deps.logger.error(`client:${type} url: ${url}`, response);
      throw new ErrorFromResponse<APIErrorResponse>({
        message: `Stream error code ${responseData.code}: ${responseData.message}`,
        code: responseData.code ?? null,
        unrecoverable: responseData.unrecoverable ?? null,
        response,
        status,
      });
    }
  };

  get = <T>(url: string, params?: AxiosRequestConfig['params']) =>
    this.request<T>('get', url, undefined, { params });
  post = <T, D = unknown>(
    url: string,
    data?: D,
    params?: AxiosRequestConfig['params'],
  ) => this.request<T, D>('post', url, data, { params });
  put = <T, D = unknown>(
    url: string,
    data?: D,
    params?: AxiosRequestConfig['params'],
  ) => this.request<T, D>('put', url, data, { params });
  patch = <T, D = unknown>(
    url: string,
    data?: D,
    params?: AxiosRequestConfig['params'],
  ) => this.request<T, D>('patch', url, data, { params });
  delete = <T>(url: string, params?: AxiosRequestConfig['params']) =>
    this.request<T>('delete', url, undefined, { params });

  /** Header / param enrichment. Preserves the legacy _enrichAxiosOptions byte-for-byte. */
  private enrichOptions = (options: RequestOptions): AxiosRequestConfig => {
    const user = this.deps.getUser();
    const token =
      options.publicEndpoint && !user
        ? undefined
        : this.deps.tokenManager.getToken();
    const authorization = token ? { Authorization: token } : undefined;
    const headers = { ...(options.headers ?? {}) } as Record<string, string>;
    if (!headers['x-client-request-id']) {
      headers['x-client-request-id'] = generateUUIDv4();
    }

    const axiosOptions = this.deps.options.axiosRequestConfig ?? {};
    const {
      params: axiosConfigParams,
      headers: axiosConfigHeaders,
      ...axiosRequestConfig
    } = axiosOptions;

    const connectionId = this.deps.getSocket()?.getConnectionId();

    return {
      params: {
        user_id: this.deps.getUserId(),
        connection_id: connectionId,
        api_key: this.deps.getApiKey(),
        ...options.params,
        ...axiosConfigParams,
      },
      headers: {
        ...authorization,
        'stream-auth-type':
          options.publicEndpoint && !user
            ? 'anonymous'
            : this.deps.getAuthType(),
        'X-Stream-Client': this.deps.getUserAgent(),
        ...headers,
        ...axiosConfigHeaders,
      },
      ...options.config,
      ...axiosRequestConfig,
    };
  };

  private dispatch = async <T, D>(
    type: RequestType,
    url: string,
    data: D | undefined,
    requestConfig: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> => {
    const { axiosInstance } = this.deps;
    switch (type) {
      case 'get':
        return await axiosInstance.get(url, requestConfig);
      case 'delete':
        return await axiosInstance.delete(url, requestConfig);
      case 'post':
        return await axiosInstance.post(url, data, requestConfig);
      case 'put':
        return await axiosInstance.put(url, data, requestConfig);
      case 'patch':
        return await axiosInstance.patch(url, data, requestConfig);
      case 'options':
        return await axiosInstance.options(url, requestConfig);
      default:
        throw new Error(`Invalid request type: ${type}`);
    }
  };

  private logRequest = (
    type: RequestType,
    url: string,
    data: unknown,
    config: AxiosRequestConfig,
  ): void => {
    if (this.deps.logger.getLogLevel() !== 'trace') return;
    this.deps.logger.trace(`client: ${type} - Request - ${url}`, {
      payload: data,
      config,
    });
  };

  private logResponse = <T>(
    type: RequestType,
    url: string,
    response: AxiosResponse<T>,
  ): void => {
    if (this.deps.logger.getLogLevel() !== 'trace') return;
    this.deps.logger.trace(
      `client:${type} - Response - url: ${url} > status ${response.status}`,
      { response },
    );
  };
}

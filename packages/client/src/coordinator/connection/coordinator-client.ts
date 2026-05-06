import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import https from 'https';
import { ScopedLogger, videoLoggerSystem } from '../../logger';
import {
  ConnectedEvent,
  CreateGuestRequest,
  CreateGuestResponse,
} from '../../gen/coordinator';
import { makeSafePromise, type SafePromise } from '../../helpers/promise';
import { getTimers } from '../../timers';
import { ConnectionIdGate } from './internal/ConnectionIdGate';
import { CoordinatorSocket } from './internal/CoordinatorSocket';
import { EventDispatcher } from './internal/EventDispatcher';
import { NetworkStatusBridge } from './internal/NetworkStatusBridge';
import { RestClient } from './internal/RestClient';
import { WebSocketTransport } from './internal/WebSocketTransport';
import { TokenManager } from './token_manager';
import { getLocationHint } from './location';
import {
  AllClientEvents,
  ClientEventListener,
  ConnectAPIResponse,
  StreamClientOptions,
  StreamVideoEvent,
  TokenOrProvider,
  User,
  UserWithId,
} from './types';
import { generateUUIDv4 } from './utils';

/**
 * Coordinator client (rewrite). Composes the modules under `internal/` and
 * exposes the same public surface as the legacy StreamClient. Both classes
 * are named `StreamClient`; the factory in `helpers/clientUtils.ts` decides
 * which one to construct via the `useLegacyCoordinator` flag during the A/B
 * validation window.
 */
export class StreamClient {
  // public ----------------------------------------------------------------
  key: string;
  secret?: string;
  options: StreamClientOptions;
  browser: boolean;
  node: boolean;
  baseURL?: string;
  wsBaseURL?: string;
  axiosInstance: AxiosInstance;
  user?: UserWithId;
  userID?: string;
  anonymous = false;
  persistUserOnConnectionFailure?: boolean;
  defaultWSTimeout: number;
  clientID?: string;
  connectUserTask: ConnectAPIResponse | null = null;
  guestUserCreatePromise?: Promise<CreateGuestResponse>;
  logger: ScopedLogger;
  tokenManager: TokenManager;

  /** Mirrors the legacy `consecutiveFailures` (REST counter) for back-compat readers. */
  get consecutiveFailures(): number {
    return this.restClient.consecutiveFailures;
  }

  // private composition ---------------------------------------------------
  private eventDispatcher: EventDispatcher;
  private gate: ConnectionIdGate;
  private restClient: RestClient;
  private networkBridge: NetworkStatusBridge;
  private socket?: CoordinatorSocket;
  private locationHint?: Promise<string>;
  private cachedUserAgent?: string;
  private wsPromiseSafe: SafePromise<ConnectedEvent | undefined> | null = null;
  // ts-ignore-style alias preserved by the legacy class: request-time copy of
  // the user (for parity with the legacy `_user` field).
  private _user?: UserWithId;

  constructor(key: string, options?: StreamClientOptions) {
    this.key = key;
    this.secret = options?.secret;
    const inputOptions =
      options ??
      ({
        browser: typeof window !== 'undefined',
      } as Partial<StreamClientOptions>);
    this.browser = inputOptions.browser || typeof window !== 'undefined';
    this.node = !this.browser;
    if (this.browser) {
      this.locationHint = getLocationHint(
        options?.locationHintUrl,
        options?.locationHintTimeout,
        options?.locationHintMaxAttempts,
      );
    }
    this.options = {
      timeout: 5000,
      withCredentials: false,
      ...inputOptions,
    };
    if (this.node && !this.options.httpsAgent) {
      this.options.httpsAgent = new https.Agent({
        keepAlive: true,
        keepAliveMsecs: 3000,
      });
    }
    this.setBaseURL(
      this.options.baseURL ?? 'https://video.stream-io-api.com/video',
    );
    this.axiosInstance = axios.create({
      ...this.options,
      baseURL: this.baseURL,
    });
    this.persistUserOnConnectionFailure =
      this.options?.persistUserOnConnectionFailure;
    this.tokenManager = new TokenManager(this.secret);
    this.defaultWSTimeout = this.options.defaultWsTimeout ?? 15000;
    this.logger = videoLoggerSystem.getLogger('coordinator');

    this.eventDispatcher = new EventDispatcher({ logger: this.logger });
    this.gate = new ConnectionIdGate();
    this.restClient = new RestClient({
      axiosInstance: this.axiosInstance,
      tokenManager: this.tokenManager,
      options: this.options,
      getApiKey: () => this.key,
      getUserId: () => this.userID,
      getUser: () => this.user,
      getAuthType: this.getAuthType,
      getUserAgent: this.getUserAgent,
      gate: this.gate,
      getSocket: () => this.socket,
      getGuestUserCreatePromise: () => this.guestUserCreatePromise,
      logger: this.logger,
      tokenExpiryRetryLimit: this.options.tokenExpiryRetryLimit ?? 2,
      defaultWsTimeoutMs: this.defaultWSTimeout,
      restConnectionIdTimeoutMs:
        this.options.restConnectionIdTimeoutMs ?? this.defaultWSTimeout,
    });

    this.networkBridge = new NetworkStatusBridge({
      onOnline: () => {
        this.eventDispatcher.dispatch({
          type: 'network.changed',
          online: true,
        });
        this.socket?.handleOnline();
      },
      onOffline: () => {
        this.eventDispatcher.dispatch({
          type: 'network.changed',
          online: false,
        });
        this.socket?.handleOffline();
      },
    });
  }

  setBaseURL = (baseURL: string): void => {
    this.baseURL = baseURL;
    this.wsBaseURL = baseURL.replace('http', 'ws').replace(':3030', ':8800');
  };

  getAuthType = (): 'jwt' | 'anonymous' =>
    this.anonymous ? 'anonymous' : 'jwt';

  getUserAgent = (): string => {
    if (!this.cachedUserAgent) {
      const { clientAppIdentifier = {} } = this.options;
      const {
        sdkName = 'js',
        sdkVersion = process.env.PKG_VERSION || '0.0.0',
        ...extras
      } = clientAppIdentifier;
      this.cachedUserAgent = [
        `stream-video-${sdkName}-v${sdkVersion}`,
        ...Object.entries(extras).map(([key, value]) => `${key}=${value}`),
        `client_bundle=${process.env.CLIENT_BUNDLE || (this.node ? 'node' : 'browser')}`,
      ].join('|');
    }
    return this.cachedUserAgent;
  };

  getLocationHint = async (
    hintUrl?: string,
    timeout?: number,
  ): Promise<string> => {
    const hint = await this.locationHint;
    if (!hint || hint === 'ERR') {
      this.locationHint = getLocationHint(
        hintUrl ?? this.options.locationHintUrl,
        timeout ?? this.options.locationHintTimeout,
      );
      return this.locationHint;
    }
    return hint;
  };

  connectUser = async (
    user: UserWithId,
    tokenOrProvider: TokenOrProvider,
  ): ConnectAPIResponse => {
    if (!user.id) {
      throw new Error('The "id" field on the user is missing');
    }
    if (this.userID === user.id && this.connectUserTask) {
      this.logger.warn(
        'Consecutive calls to connectUser is detected, ideally you should only call this function once in your app.',
      );
      return this.connectUserTask;
    }
    if (this.userID) {
      throw new Error(
        'Use client.disconnect() before trying to connect as a different user. connectUser was called twice.',
      );
    }
    if ((this.secret || this.node) && !this.options.allowServerSideConnect) {
      this.logger.warn(
        'Please do not use connectUser server side. Use our @stream-io/node-sdk instead: https://getstream.io/video/docs/api/',
      );
    }

    this.userID = user.id;
    this.anonymous = false;
    await this.tokenManager.setTokenOrProvider(tokenOrProvider, user, false);
    this._setUser(user);

    this.connectUserTask = this.openConnection();
    this.networkBridge.attach();

    try {
      return await this.connectUserTask;
    } catch (err) {
      if (this.persistUserOnConnectionFailure) {
        await this.closeConnection();
      } else {
        await this.disconnectUser();
      }
      throw err;
    }
  };

  connectAnonymousUser = async (
    user: UserWithId,
    tokenOrProvider: TokenOrProvider,
  ): Promise<void> => {
    this.networkBridge.attach();
    this.gate.arm();
    this.anonymous = true;
    await this.tokenManager.setTokenOrProvider(tokenOrProvider, user, true);
    this._setUser(user);
    // Anonymous users do not open a WS connection; resolve the gate so REST
    // calls can proceed without a connection_id.
    this.gate.resolve(undefined);
  };

  connectGuestUser = async (
    user: User & { type: 'guest' },
  ): ConnectAPIResponse => {
    this.guestUserCreatePromise = this.restClient.request<
      CreateGuestResponse,
      CreateGuestRequest
    >('post', '/guest', { user }, { publicEndpoint: true });

    const response = await this.guestUserCreatePromise;
    this.guestUserCreatePromise.finally(
      () => (this.guestUserCreatePromise = undefined),
    );
    return this.connectUser(response.user, response.access_token);
  };

  closeConnection = async (timeout?: number): Promise<void> => {
    await this.socket?.disconnect(timeout);
    this.connectUserTask = null;
  };

  disconnectUser = async (timeout?: number): Promise<void> => {
    this.logger.info('client:disconnect() Disconnecting the client');
    delete this.user;
    delete this._user;
    delete this.userID;
    this.anonymous = false;
    await this.closeConnection(timeout);
    this.networkBridge.detach();
    this.tokenManager.reset();
    this.gate.reset();
  };

  openConnection = async (): Promise<ConnectedEvent | undefined> => {
    if (!this.userID) {
      throw new Error(
        'UserWithId is not set on client, use client.connectUser or client.connectAnonymousUser instead',
      );
    }

    if (this.socket?.isConnecting() && this.wsPromiseSafe?.checkPending()) {
      this.logger.info(
        'client:openConnection() connection already in progress',
      );
      return await this.wsPromiseSafe();
    }

    if (this.socket?.isHealthy() && this.hasConnectionId()) {
      this.logger.info(
        'client:openConnection() openConnection called twice, healthy connection already exists',
      );
      return undefined;
    }

    this.gate.arm();
    this.clientID = `${this.userID}--${generateUUIDv4()}`;

    this.socket = new CoordinatorSocket({
      urlBuilder: () => this.buildWsUrl(),
      authMessageBuilder: () => this.buildAuthMessage(),
      tokenManager: this.tokenManager,
      eventDispatcher: this.eventDispatcher,
      gate: this.gate,
      transportFactory: (url) =>
        new WebSocketTransport({
          url,
          WebSocketImpl: this.options.WebSocketImpl ?? WebSocket,
        }),
      timers: getTimers(),
      getClientId: () => this.clientID,
      logger: videoLoggerSystem.getLogger('coordinator-socket'),
      options: {
        defaultWsTimeoutMs: this.defaultWSTimeout,
        authHandshakeTimeoutMs:
          this.options.authHandshakeTimeoutMs ?? this.defaultWSTimeout,
      },
    });

    const newWsPromise = this.socket.connect(this.defaultWSTimeout);
    this.wsPromiseSafe = makeSafePromise(newWsPromise);
    return await newWsPromise;
  };

  // event bus -------------------------------------------------------------

  on = <E extends keyof AllClientEvents>(name: E, cb: ClientEventListener<E>) =>
    this.eventDispatcher.on(name, cb);

  off = <E extends keyof AllClientEvents>(
    name: E,
    cb: ClientEventListener<E>,
  ) => this.eventDispatcher.off(name, cb);

  dispatchEvent = (event: StreamVideoEvent): void =>
    this.eventDispatcher.dispatch(event);

  // REST passthrough ------------------------------------------------------

  doAxiosRequest = <T, D = unknown>(
    type: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options',
    url: string,
    data?: D,
    options: AxiosRequestConfig & {
      config?: AxiosRequestConfig;
      publicEndpoint?: boolean;
    } = {},
  ) => this.restClient.request<T, D>(type, url, data, options);

  get = <T>(url: string, params?: AxiosRequestConfig['params']) =>
    this.restClient.get<T>(url, params);
  post = <T, D = unknown>(
    url: string,
    data?: D,
    params?: AxiosRequestConfig['params'],
  ) => this.restClient.post<T, D>(url, data, params);
  put = <T, D = unknown>(
    url: string,
    data?: D,
    params?: AxiosRequestConfig['params'],
  ) => this.restClient.put<T, D>(url, data, params);
  patch = <T, D = unknown>(
    url: string,
    data?: D,
    params?: AxiosRequestConfig['params'],
  ) => this.restClient.patch<T, D>(url, data, params);
  delete = <T>(url: string, params?: AxiosRequestConfig['params']) =>
    this.restClient.delete<T>(url, params);

  // connection-id accessors ----------------------------------------------

  hasConnectionId = (): boolean => Boolean(this.socket?.getConnectionId());
  getConnectionId = (): string | undefined => this.socket?.getConnectionId();

  /**
   * @deprecated Use {@link hasConnectionId}. Alias kept for the validation
   * window; remove after the legacy implementation is deleted.
   */
  _hasConnectionID = (): boolean => this.hasConnectionId();

  /**
   * @deprecated Use {@link getConnectionId}. Alias kept for the validation
   * window; remove after the legacy implementation is deleted.
   */
  _getConnectionID = (): string | undefined => this.getConnectionId();

  // private ---------------------------------------------------------------

  private _setUser = (user: UserWithId): void => {
    this.user = user;
    this.userID = user.id;
    this._user = { ...user };
  };

  private buildWsUrl = (): string => {
    const params = new URLSearchParams();
    params.set('api_key', this.key);
    params.set('stream-auth-type', this.getAuthType());
    params.set('X-Stream-Client', this.getUserAgent());
    return `${this.wsBaseURL}/connect?${params.toString()}`;
  };

  private buildAuthMessage = (): string => {
    const token = this.tokenManager.getToken();
    if (!this.user || !token) {
      throw new Error('user or token missing');
    }
    return JSON.stringify({
      token,
      user_details: {
        id: this.user.id,
        name: this.user.name,
        image: this.user.image,
        custom: this.user.custom,
      },
    });
  };
}

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import https from 'https';
import { StableWSConnection } from './connection';
import { TokenManager } from './token_manager';
import {
  addConnectionEventListeners,
  isErrorResponse,
  isFunction,
  KnownCodes,
  randomId,
  removeConnectionEventListeners,
  retryInterval,
  sleep,
} from './utils';
import {
  AllClientEvents,
  AllClientEventTypes,
  APIErrorResponse,
  ClientEventListener,
  ConnectAPIResponse,
  ErrorFromResponse,
  Logger,
  StreamClientOptions,
  StreamVideoEvent,
  TokenOrProvider,
  User,
  UserWithId,
} from './types';
import { getLocationHint } from './location';
import {
  ConnectedEvent,
  CreateGuestRequest,
  CreateGuestResponse,
} from '../../gen/coordinator';
import { makeSafePromise, type SafePromise } from '../../helpers/promise';

export class StreamClient {
  _user?: UserWithId;
  anonymous: boolean;
  persistUserOnConnectionFailure?: boolean;
  axiosInstance: AxiosInstance;
  baseURL?: string;
  browser: boolean;
  clientID?: string;
  key: string;
  listeners: Partial<
    Record<AllClientEventTypes, ClientEventListener<any>[] | undefined>
  > = {};
  logger: Logger;

  private locationHint: Promise<string> | undefined;

  node: boolean;
  options: StreamClientOptions;
  secret?: string;
  setUserPromise: ConnectAPIResponse | null;
  tokenManager: TokenManager;
  user?: UserWithId;
  userAgent?: string;
  userID?: string;
  wsBaseURL?: string;
  wsConnection: StableWSConnection | null;
  private wsPromiseSafe: SafePromise<ConnectedEvent | undefined> | null;
  consecutiveFailures: number;
  defaultWSTimeout: number;
  resolveConnectionId?: Function;
  rejectConnectionId?: Function;
  private connectionIdPromiseSafe?: SafePromise<string | undefined>;
  guestUserCreatePromise?: Promise<CreateGuestResponse>;

  /**
   * Initialize a client.
   *
   * @param {string} key - the api key
   * @param {StreamClientOptions} [options] - additional options, here you can pass custom options to axios instance
   * @param {string} [options.secret] - the api secret
   * @param {boolean} [options.browser] - enforce the client to be in browser mode
   * @param {boolean} [options.warmUp] - default to false, if true, client will open a connection as soon as possible to speed up following requests
   * @param {Logger} [options.Logger] - custom logger
   * @param {number} [options.timeout] - default to 3000
   * @param {httpsAgent} [options.httpsAgent] - custom httpsAgent, in node it's default to https.agent()
   */
  constructor(key: string, options?: StreamClientOptions) {
    // set the key
    this.key = key;

    // set the secret
    this.secret = options?.secret;

    // set the options... and figure out defaults...
    const inputOptions = options
      ? options
      : ({
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
      withCredentials: false, // making sure cookies are not sent
      ...inputOptions,
    };

    if (this.node && !this.options.httpsAgent) {
      this.options.httpsAgent = new https.Agent({
        keepAlive: true,
        keepAliveMsecs: 3000,
      });
    }

    this.setBaseURL(
      this.options.baseURL || 'https://video.stream-io-api.com/video',
    );

    this.axiosInstance = axios.create({
      ...this.options,
      baseURL: this.baseURL,
    });

    // WS connection is initialized when setUser is called
    this.wsConnection = null;
    this.wsPromiseSafe = null;
    this.setUserPromise = null;

    // mapping between channel groups and configs
    this.anonymous = false;
    this.persistUserOnConnectionFailure =
      this.options?.persistUserOnConnectionFailure;

    // If it is a server-side client, then lets initialize the tokenManager, since token will be
    // generated from secret.
    this.tokenManager = new TokenManager(this.secret);
    this.consecutiveFailures = 0;

    this.defaultWSTimeout = 15000;

    this.logger = isFunction(inputOptions.logger)
      ? inputOptions.logger
      : () => null;
  }

  getAuthType = () => {
    return this.anonymous ? 'anonymous' : 'jwt';
  };

  setBaseURL = (baseURL: string) => {
    this.baseURL = baseURL;
    this.wsBaseURL = this.baseURL
      .replace('http', 'ws')
      .replace(':3030', ':8800');
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

  _getConnectionID = () => this.wsConnection?.connectionID;

  _hasConnectionID = () => Boolean(this._getConnectionID());

  /**
   * connectUser - Set the current user and open a WebSocket connection
   *
   * @param user Data about this user. IE {name: "john"}
   * @param {TokenOrProvider} userTokenOrProvider Token or provider
   *
   * @return {ConnectAPIResponse} Returns a promise that resolves when the connection is setup
   */
  connectUser = async (
    user: UserWithId,
    userTokenOrProvider: TokenOrProvider,
  ) => {
    if (!user.id) {
      throw new Error('The "id" field on the user is missing');
    }

    /**
     * Calling connectUser multiple times is potentially the result of a  bad integration, however,
     * If the user id remains the same we don't throw error
     */
    if (this.userID === user.id && this.setUserPromise) {
      this.logger(
        'warn',
        'Consecutive calls to connectUser is detected, ideally you should only call this function once in your app.',
      );
      return this.setUserPromise;
    }

    if (this.userID) {
      throw new Error(
        'Use client.disconnect() before trying to connect as a different user. connectUser was called twice.',
      );
    }

    if (
      (this._isUsingServerAuth() || this.node) &&
      !this.options.allowServerSideConnect
    ) {
      this.logger(
        'warn',
        'Please do not use connectUser server side. Use our @stream-io/node-sdk instead: https://getstream.io/video/docs/api/',
      );
    }

    // we generate the client id client side
    this.userID = user.id;
    this.anonymous = false;

    const setTokenPromise = this._setToken(
      user,
      userTokenOrProvider,
      this.anonymous,
    );
    this._setUser(user);

    const wsPromise = this.openConnection();

    this.setUserPromise = Promise.all([setTokenPromise, wsPromise]).then(
      (result) => result[1], // We only return connection promise;
    );

    try {
      addConnectionEventListeners(this.updateNetworkConnectionStatus);
      return await this.setUserPromise;
    } catch (err) {
      if (this.persistUserOnConnectionFailure) {
        // cleanup client to allow the user to retry connectUser again
        this.closeConnection();
      } else {
        this.disconnectUser();
      }
      throw err;
    }
  };

  _setToken = (
    user: UserWithId,
    userTokenOrProvider: TokenOrProvider,
    isAnonymous: boolean,
  ) =>
    this.tokenManager.setTokenOrProvider(
      userTokenOrProvider,
      user,
      isAnonymous,
    );

  _setUser = (user: UserWithId) => {
    /**
     * This one is used by the frontend. This is a copy of the current user object stored on backend.
     * It contains reserved properties and own user properties which are not present in `this._user`.
     */
    this.user = user;
    this.userID = user.id;
    // this one is actually used for requests. This is a copy of current user provided to `connectUser` function.
    this._user = { ...user };
  };

  /**
   * Disconnects the websocket connection, without removing the user set on client.
   * client.closeConnection will not trigger default auto-retry mechanism for reconnection. You need
   * to call client.openConnection to reconnect to websocket.
   *
   * This is mainly useful on mobile side. You can only receive push notifications
   * if you don't have active websocket connection.
   * So when your app goes to background, you can call `client.closeConnection`.
   * And when app comes back to foreground, call `client.openConnection`.
   *
   * @param timeout Max number of ms, to wait for close event of websocket, before forcefully assuming succesful disconnection.
   *                https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
   */
  closeConnection = async (timeout?: number) => {
    await this.wsConnection?.disconnect(timeout);
  };

  /**
   * Creates a new WebSocket connection with the current user. Returns empty promise, if there is an active connection
   */
  openConnection = async () => {
    if (!this.userID) {
      throw Error(
        'UserWithId is not set on client, use client.connectUser or client.connectAnonymousUser instead',
      );
    }

    const wsPromise = this.wsPromiseSafe?.();
    if (this.wsConnection?.isConnecting && wsPromise) {
      this.logger(
        'info',
        'client:openConnection() - connection already in progress',
      );
      return await wsPromise;
    }

    if (this.wsConnection?.isHealthy && this._hasConnectionID()) {
      this.logger(
        'info',
        'client:openConnection() - openConnection called twice, healthy connection already exists',
      );

      return;
    }

    await this._setupConnectionIdPromise();

    this.clientID = `${this.userID}--${randomId()}`;
    const newWsPromise = this.connect();
    this.wsPromiseSafe = makeSafePromise(newWsPromise);
    return await newWsPromise;
  };

  /**
   * Disconnects the websocket and removes the user from client.
   *
   * @param timeout Max number of ms, to wait for close event of websocket, before forcefully assuming successful disconnection.
   *                https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
   */
  disconnectUser = async (timeout?: number) => {
    this.logger('info', 'client:disconnect() - Disconnecting the client');

    // remove the user specific fields
    delete this.user;
    delete this._user;
    delete this.userID;

    this.anonymous = false;

    await this.closeConnection(timeout);
    removeConnectionEventListeners(this.updateNetworkConnectionStatus);

    this.tokenManager.reset();

    this.connectionIdPromiseSafe = undefined;
    this.rejectConnectionId = undefined;
    this.resolveConnectionId = undefined;
  };

  connectGuestUser = async (user: User & { type: 'guest' }) => {
    this.guestUserCreatePromise = this.doAxiosRequest<
      CreateGuestResponse,
      CreateGuestRequest
    >('post', '/guest', { user }, { publicEndpoint: true });

    const response = await this.guestUserCreatePromise;
    this.guestUserCreatePromise.finally(
      () => (this.guestUserCreatePromise = undefined),
    );

    return this.connectUser(response.user, response.access_token);
  };

  /**
   * connectAnonymousUser - Set an anonymous user and open a WebSocket connection
   */
  connectAnonymousUser = async (
    user: UserWithId,
    tokenOrProvider: TokenOrProvider,
  ) => {
    addConnectionEventListeners(this.updateNetworkConnectionStatus);
    await this._setupConnectionIdPromise();

    this.anonymous = true;
    await this._setToken(user, tokenOrProvider, this.anonymous);

    this._setUser(user);
    // some endpoints require a connection_id to be resolved.
    // as anonymous users aren't allowed to open WS connections, we just
    // resolve the connection_id here.
    this.resolveConnectionId?.();
  };

  /**
   * on - Listen to events on all channels and users your watching
   *
   * client.on('message.new', event => {console.log("my new message", event, channel.state.messages)})
   *
   * @param eventName The event type to listen for (optional)
   * @param callback The callback to call
   *
   * @return  Returns a function which, when called, unsubscribes the event handler.
   */
  on = <E extends keyof AllClientEvents>(
    eventName: E,
    callback: ClientEventListener<E>,
  ) => {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }

    this.logger('debug', `Adding listener for ${eventName} event`);
    this.listeners[eventName]?.push(callback as ClientEventListener<any>);
    return () => {
      this.off(eventName, callback);
    };
  };

  /**
   * off - Remove the event handler
   */
  off = <E extends keyof AllClientEvents>(
    eventName: E,
    callback: ClientEventListener<E>,
  ) => {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }

    this.logger('debug', `Removing listener for ${eventName} event`);
    this.listeners[eventName] = this.listeners[eventName]?.filter(
      (value) => value !== callback,
    );
  };

  /**
   * sets up the this.connectionIdPromise
   */
  _setupConnectionIdPromise = () => {
    /** a promise that is resolved once connection id is set */
    this.connectionIdPromiseSafe = makeSafePromise(
      new Promise<string | undefined>((resolve, reject) => {
        this.resolveConnectionId = resolve;
        this.rejectConnectionId = reject;
      }),
    );
  };

  get connectionIdPromise() {
    return this.connectionIdPromiseSafe?.();
  }

  get isConnectionIsPromisePending() {
    return this.connectionIdPromiseSafe?.checkPending() ?? false;
  }

  get wsPromise() {
    return this.wsPromiseSafe?.();
  }

  _logApiRequest = (
    type: string,
    url: string,
    data: unknown,
    config: AxiosRequestConfig & {
      config?: AxiosRequestConfig & { maxBodyLength?: number };
    },
  ) => {
    this.logger('trace', `client: ${type} - Request - ${url}`, {
      payload: data,
      config,
    });
  };

  _logApiResponse = <T>(
    type: string,
    url: string,
    response: AxiosResponse<T>,
  ) => {
    this.logger(
      'trace',
      `client:${type} - Response - url: ${url} > status ${response.status}`,
      {
        response,
      },
    );
  };

  _logApiError = (type: string, url: string, error: unknown) => {
    this.logger('error', `client:${type} - Error - url: ${url}`, {
      url,
      error,
    });
  };

  doAxiosRequest = async <T, D = unknown>(
    type: string,
    url: string,
    data?: D,
    options: AxiosRequestConfig & {
      config?: AxiosRequestConfig & { maxBodyLength?: number };
    } & { publicEndpoint?: boolean } = {},
  ): Promise<T> => {
    if (!options.publicEndpoint) {
      await Promise.all([
        this.tokenManager.tokenReady(),
        this.guestUserCreatePromise,
      ]);
      // we need to wait for presence of connection id before making requests
      try {
        await this.connectionIdPromise;
      } catch (e) {
        // in case connection id was rejected
        // reconnection maybe in progress
        // we can wait for healthy connection to resolve, which rejects when 15s timeout is reached
        await this.wsConnection?._waitForHealthy();
        await this.connectionIdPromise;
      }
    }
    const requestConfig = this._enrichAxiosOptions(options);
    try {
      let response: AxiosResponse<T>;
      this._logApiRequest(type, url, data, requestConfig);
      switch (type) {
        case 'get':
          response = await this.axiosInstance.get(url, requestConfig);
          break;
        case 'delete':
          response = await this.axiosInstance.delete(url, requestConfig);
          break;
        case 'post':
          response = await this.axiosInstance.post(url, data, requestConfig);
          break;
        case 'put':
          response = await this.axiosInstance.put(url, data, requestConfig);
          break;
        case 'patch':
          response = await this.axiosInstance.patch(url, data, requestConfig);
          break;
        case 'options':
          response = await this.axiosInstance.options(url, requestConfig);
          break;
        default:
          throw new Error('Invalid request type');
      }
      this._logApiResponse<T>(type, url, response);
      this.consecutiveFailures = 0;
      return this.handleResponse(response);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any /**TODO: generalize error types  */) {
      e.client_request_id = requestConfig.headers?.['x-client-request-id'];
      this.consecutiveFailures += 1;
      if (e.response) {
        this._logApiError(type, url, e.response);
        /** connection_fallback depends on this token expiration logic */
        if (
          e.response.data.code === KnownCodes.TOKEN_EXPIRED &&
          !this.tokenManager.isStatic()
        ) {
          if (this.consecutiveFailures > 1) {
            await sleep(retryInterval(this.consecutiveFailures));
          }
          await this.tokenManager.loadToken();
          return await this.doAxiosRequest<T, D>(type, url, data, options);
        }
        return this.handleResponse(e.response);
      } else {
        this._logApiError(type, url, e);
        // eslint-disable-next-line no-throw-literal
        throw e as AxiosError<APIErrorResponse>;
      }
    }
  };

  get = <T>(url: string, params?: AxiosRequestConfig['params']) => {
    return this.doAxiosRequest<T, unknown>('get', url, null, {
      params,
    });
  };

  put = <T, D = unknown>(
    url: string,
    data?: D,
    params?: AxiosRequestConfig['params'],
  ) => {
    return this.doAxiosRequest<T, D>('put', url, data, { params });
  };

  post = <T, D = unknown>(
    url: string,
    data?: D,
    params?: AxiosRequestConfig['params'],
  ) => {
    return this.doAxiosRequest<T, D>('post', url, data, { params });
  };

  patch = <T, D = unknown>(
    url: string,
    data?: D,
    params?: AxiosRequestConfig['params'],
  ) => {
    return this.doAxiosRequest<T, D>('patch', url, data, { params });
  };

  delete = <T>(url: string, params?: AxiosRequestConfig['params']) => {
    return this.doAxiosRequest<T, unknown>('delete', url, null, {
      params,
    });
  };

  errorFromResponse = (
    response: AxiosResponse<APIErrorResponse>,
  ): ErrorFromResponse<APIErrorResponse> => {
    const { data, status } = response;
    const err = new ErrorFromResponse<APIErrorResponse>();
    err.message = `Stream error code ${data.code}: ${data.message}`;
    err.code = data.code;
    err.unrecoverable = data.unrecoverable;
    err.response = response;
    err.status = status;
    return err;
  };

  handleResponse = <T>(response: AxiosResponse<T>) => {
    const data = response.data;
    if (isErrorResponse(response)) {
      throw this.errorFromResponse(response);
    }
    return data;
  };

  dispatchEvent = (event: StreamVideoEvent) => {
    this.logger('debug', `Dispatching event: ${event.type}`, event);
    if (!this.listeners) return;

    // call generic listeners
    for (const listener of this.listeners.all || []) {
      listener(event);
    }

    // call type specific listeners
    for (const listener of this.listeners[event.type] || []) {
      listener(event);
    }
  };

  /**
   * @private
   */
  connect = async () => {
    if (!this.userID || !this._user) {
      throw Error(
        'Call connectUser or connectAnonymousUser before starting the connection',
      );
    }
    if (!this.wsBaseURL) throw Error('Websocket base url not set');
    if (!this.clientID) throw Error('clientID is not set');

    // The StableWSConnection handles all the reconnection logic.
    this.wsConnection = new StableWSConnection(this);

    this.logger('info', 'StreamClient.connect: this.wsConnection.connect()');
    return await this.wsConnection.connect(this.defaultWSTimeout);
  };

  getUserAgent = () => {
    const version = process.env.PKG_VERSION || '0.0.0-development';
    return (
      this.userAgent ||
      `stream-video-javascript-client-${
        this.node ? 'node' : 'browser'
      }-${version}`
    );
  };

  setUserAgent = (userAgent: string) => {
    this.userAgent = userAgent;
  };

  /**
   * _isUsingServerAuth - Returns true if we're using server side auth
   */
  _isUsingServerAuth = () => !!this.secret;

  _enrichAxiosOptions = (
    options: AxiosRequestConfig & { config?: AxiosRequestConfig } & {
      publicEndpoint?: boolean;
    } = {
      params: {},
      headers: {},
      config: {},
    },
  ): AxiosRequestConfig => {
    const token =
      options.publicEndpoint && !this.user ? undefined : this._getToken();
    const authorization = token ? { Authorization: token } : undefined;

    if (!options.headers?.['x-client-request-id']) {
      options.headers = {
        ...options.headers,
        'x-client-request-id': randomId(),
      };
    }

    return {
      params: {
        user_id: this.userID,
        connection_id: this._getConnectionID(),
        api_key: this.key,
        ...options.params,
      },
      headers: {
        ...authorization,
        'stream-auth-type':
          options.publicEndpoint && !this.user
            ? 'anonymous'
            : this.getAuthType(),
        'X-Stream-Client': this.getUserAgent(),
        ...options.headers,
      },
      ...options.config,
      ...this.options.axiosRequestConfig,
    };
  };

  _getToken = () => {
    if (!this.tokenManager) return null;

    return this.tokenManager.getToken();
  };

  updateNetworkConnectionStatus = (
    event: { type: 'online' | 'offline' } | Event,
  ) => {
    if (event.type === 'offline') {
      this.logger('debug', 'device went offline');
      this.dispatchEvent({ type: 'network.changed', online: false });
    } else if (event.type === 'online') {
      this.logger('debug', 'device went online');
      this.dispatchEvent({ type: 'network.changed', online: true });
    }
  };
}

import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import https from 'https';
import WebSocket from 'isomorphic-ws';
import { StableWSConnection } from './connection';
import { DevToken } from './signing';
import { TokenManager } from './token_manager';
import { WSConnectionFallback } from './connection_fallback';
import { isErrorResponse, isWSFailure } from './errors';
import {
  chatCodes,
  isFunction,
  isOnline,
  randomId,
  retryInterval,
  sleep,
} from './utils';

import {
  APIErrorResponse,
  ConnectAPIResponse,
  ErrorFromResponse,
  Event,
  EventHandler,
  Logger,
  OwnUserResponse,
  StreamClientOptions,
  TokenOrProvider,
  UserResponse,
} from './types';
import { InsightMetrics, postInsights } from './insights';

function isString(x: unknown): x is string {
  return typeof x === 'string' || x instanceof String;
}

export class StreamClient {
  _user?: OwnUserResponse | UserResponse;
  anonymous: boolean;
  persistUserOnConnectionFailure?: boolean;
  axiosInstance: AxiosInstance;
  baseURL?: string;
  browser: boolean;
  cleaningIntervalRef?: NodeJS.Timeout;
  clientID?: string;
  key: string;
  listeners: Record<string, Array<(event: Event) => void>>;
  logger: Logger;

  node: boolean;
  options: StreamClientOptions;
  secret?: string;
  setUserPromise: ConnectAPIResponse | null;
  tokenManager: TokenManager;
  user?: OwnUserResponse | UserResponse;
  userAgent?: string;
  userID?: string;
  wsBaseURL?: string;
  wsConnection: StableWSConnection | null;
  wsFallback?: WSConnectionFallback;
  wsPromise: ConnectAPIResponse | null;
  consecutiveFailures: number;
  insightMetrics: InsightMetrics;
  defaultWSTimeoutWithFallback: number;
  defaultWSTimeout: number;
  private nextRequestAbortController: AbortController | null = null;

  /**
   * Initialize a client.
   *
   * @param {string} key - the api key
   * @param {string} [secret] - the api secret
   * @param {StreamClientOptions} [options] - additional options, here you can pass custom options to axios instance
   * @param {boolean} [options.browser] - enforce the client to be in browser mode
   * @param {boolean} [options.warmUp] - default to false, if true, client will open a connection as soon as possible to speed up following requests
   * @param {Logger} [options.Logger] - custom logger
   * @param {number} [options.timeout] - default to 3000
   * @param {httpsAgent} [options.httpsAgent] - custom httpsAgent, in node it's default to https.agent()
   * @example <caption>initialize the client in user mode</caption>
   * new StreamChat('api_key')
   * @example <caption>initialize the client in user mode with options</caption>
   * new StreamChat('api_key', { warmUp:true, timeout:5000 })
   * @example <caption>secret is optional and only used in server side mode</caption>
   * new StreamChat('api_key', "secret", { httpsAgent: customAgent })
   */
  constructor(key: string, options?: StreamClientOptions);
  constructor(key: string, secret?: string, options?: StreamClientOptions);
  constructor(
    key: string,
    secretOrOptions?: StreamClientOptions | string,
    options?: StreamClientOptions,
  ) {
    // set the key
    this.key = key;
    this.listeners = {};

    // set the secret
    if (secretOrOptions && isString(secretOrOptions)) {
      this.secret = secretOrOptions;
    }

    // set the options... and figure out defaults...
    const inputOptions = options
      ? options
      : secretOrOptions && !isString(secretOrOptions)
      ? secretOrOptions
      : ({
          browser: typeof window !== 'undefined',
        } as Partial<StreamClientOptions>);

    this.browser = inputOptions.browser || typeof window !== 'undefined';
    this.node = !this.browser;

    this.options = {
      timeout: 3000,
      withCredentials: false, // making sure cookies are not sent
      warmUp: false,
      ...inputOptions,
    };

    if (this.node && !this.options.httpsAgent) {
      this.options.httpsAgent = new https.Agent({
        keepAlive: true,
        keepAliveMsecs: 3000,
      });
    }

    this.axiosInstance = axios.create(this.options);

    this.setBaseURL(this.options.baseURL || 'https://chat.stream-io-api.com');

    if (typeof process !== 'undefined' && process.env.STREAM_LOCAL_TEST_RUN) {
      this.setBaseURL('http://localhost:3030');
    }

    if (typeof process !== 'undefined' && process.env.STREAM_LOCAL_TEST_HOST) {
      this.setBaseURL('http://' + process.env.STREAM_LOCAL_TEST_HOST);
    }

    // WS connection is initialized when setUser is called
    this.wsConnection = null;
    this.wsPromise = null;
    this.setUserPromise = null;

    // mapping between channel groups and configs
    this.anonymous = false;
    this.persistUserOnConnectionFailure =
      this.options?.persistUserOnConnectionFailure;

    // If its a server-side client, then lets initialize the tokenManager, since token will be
    // generated from secret.
    this.tokenManager = new TokenManager(this.secret);
    this.consecutiveFailures = 0;
    this.insightMetrics = new InsightMetrics();

    this.defaultWSTimeoutWithFallback = 6000;
    this.defaultWSTimeout = 15000;

    this.logger = isFunction(inputOptions.logger)
      ? inputOptions.logger
      : () => null;
  }

  devToken(userID: string) {
    return DevToken(userID);
  }

  getAuthType() {
    return this.anonymous ? 'anonymous' : 'jwt';
  }

  setBaseURL(baseURL: string) {
    this.baseURL = baseURL;
    this.wsBaseURL = this.baseURL
      .replace('http', 'ws')
      .replace(':3030', ':8800');
  }

  _getConnectionID = () =>
    this.wsConnection?.connectionID || this.wsFallback?.connectionID;

  _hasConnectionID = () => Boolean(this._getConnectionID());

  /**
   * connectUser - Set the current user and open a WebSocket connection
   *
   * @param {OwnUserResponse | UserResponse} user Data about this user. IE {name: "john"}
   * @param {TokenOrProvider} userTokenOrProvider Token or provider
   *
   * @return {ConnectAPIResponse} Returns a promise that resolves when the connection is setup
   */
  connectUser = async (
    user: OwnUserResponse | UserResponse,
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
      console.warn(
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
      console.warn(
        'Please do not use connectUser server side. connectUser impacts MAU and concurrent connection usage and thus your bill. If you have a valid use-case, add "allowServerSideConnect: true" to the client options to disable this warning.',
      );
    }

    // we generate the client id client side
    this.userID = user.id;
    this.anonymous = false;

    const setTokenPromise = this._setToken(user, userTokenOrProvider);
    this._setUser(user);

    const wsPromise = this.openConnection();

    this.setUserPromise = Promise.all([setTokenPromise, wsPromise]).then(
      (result) => result[1], // We only return connection promise;
    );

    try {
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

  _setToken = (user: UserResponse, userTokenOrProvider: TokenOrProvider) =>
    this.tokenManager.setTokenOrProvider(userTokenOrProvider, user);

  _setUser(user: OwnUserResponse | UserResponse) {
    /**
     * This one is used by the frontend. This is a copy of the current user object stored on backend.
     * It contains reserved properties and own user properties which are not present in `this._user`.
     */
    this.user = user;
    this.userID = user.id;
    // this one is actually used for requests. This is a copy of current user provided to `connectUser` function.
    this._user = { ...user };
  }

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
    if (this.cleaningIntervalRef != null) {
      clearInterval(this.cleaningIntervalRef);
      this.cleaningIntervalRef = undefined;
    }

    await Promise.all([
      this.wsConnection?.disconnect(timeout),
      this.wsFallback?.disconnect(timeout),
    ]);
    return Promise.resolve();
  };

  /**
   * Creates a new WebSocket connection with the current user. Returns empty promise, if there is an active connection
   */
  openConnection = async () => {
    if (!this.userID) {
      throw Error(
        'User is not set on client, use client.connectUser or client.connectAnonymousUser instead',
      );
    }

    if (this.wsConnection?.isConnecting && this.wsPromise) {
      this.logger(
        'info',
        'client:openConnection() - connection already in progress',
        {
          tags: ['connection', 'client'],
        },
      );
      return this.wsPromise;
    }

    if (
      (this.wsConnection?.isHealthy || this.wsFallback?.isHealthy()) &&
      this._hasConnectionID()
    ) {
      this.logger(
        'info',
        'client:openConnection() - openConnection called twice, healthy connection already exists',
        {
          tags: ['connection', 'client'],
        },
      );

      return Promise.resolve();
    }

    this.clientID = `${this.userID}--${randomId()}`;
    this.wsPromise = this.connect();
    return this.wsPromise;
  };

  _normalizeDate = (before: Date | string | null): string | null => {
    if (before instanceof Date) {
      before = before.toISOString();
    }

    if (before === '') {
      throw new Error(
        "Don't pass blank string for since, use null instead if resetting the token revoke",
      );
    }

    return before;
  };

  /**
   * Disconnects the websocket and removes the user from client.
   *
   * @param timeout Max number of ms, to wait for close event of websocket, before forcefully assuming successful disconnection.
   *                https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
   */
  disconnectUser = async (timeout?: number) => {
    this.logger('info', 'client:disconnect() - Disconnecting the client', {
      tags: ['connection', 'client'],
    });

    // remove the user specific fields
    delete this.user;
    delete this._user;
    delete this.userID;

    this.anonymous = false;

    const closePromise = this.closeConnection(timeout);
    // reset token manager
    setTimeout(this.tokenManager.reset); // delay reseting to use token for disconnect calls

    // close the WS connection
    return closePromise;
  };

  /**
   * connectAnonymousUser - Set an anonymous user and open a WebSocket connection
   */
  connectAnonymousUser = () => {
    if (
      (this._isUsingServerAuth() || this.node) &&
      !this.options.allowServerSideConnect
    ) {
      console.warn(
        'Please do not use connectUser server side. connectUser impacts MAU and concurrent connection usage and thus your bill. If you have a valid use-case, add "allowServerSideConnect: true" to the client options to disable this warning.',
      );
    }

    this.anonymous = true;
    this.userID = randomId();
    const anonymousUser = {
      id: this.userID,
      anon: true,
    } as UserResponse;

    this._setToken(anonymousUser, '');
    this._setUser(anonymousUser);

    return this.openConnection();
  };

  /**
   * on - Listen to events on all channels and users your watching
   *
   * client.on('message.new', event => {console.log("my new message", event, channel.state.messages)})
   * or
   * client.on(event => {console.log(event.type)})
   *
   * @param {EventHandler | string} callbackOrString  The event type to listen for (optional)
   * @param {EventHandler} [callbackOrNothing] The callback to call
   *
   * @return {{ unsubscribe: () => void }} Description
   */
  on(callback: EventHandler): { unsubscribe: () => void };
  on(eventType: string, callback: EventHandler): { unsubscribe: () => void };
  on(
    callbackOrString: EventHandler | string,
    callbackOrNothing?: EventHandler,
  ): { unsubscribe: () => void } {
    const key = callbackOrNothing ? (callbackOrString as string) : 'all';
    const callback = callbackOrNothing
      ? callbackOrNothing
      : (callbackOrString as EventHandler);
    if (!(key in this.listeners)) {
      this.listeners[key] = [];
    }
    this.logger('info', `Attaching listener for ${key} event`, {
      tags: ['event', 'client'],
    });
    this.listeners[key].push(callback);
    return {
      unsubscribe: () => {
        this.logger('info', `Removing listener for ${key} event`, {
          tags: ['event', 'client'],
        });
        this.listeners[key] = this.listeners[key].filter(
          (el) => el !== callback,
        );
      },
    };
  }

  /**
   * off - Remove the event handler
   *
   */
  off(callback: EventHandler): void;
  off(eventType: string, callback: EventHandler): void;
  off(
    callbackOrString: EventHandler | string,
    callbackOrNothing?: EventHandler,
  ) {
    const key = callbackOrNothing ? (callbackOrString as string) : 'all';
    const callback = callbackOrNothing
      ? callbackOrNothing
      : (callbackOrString as EventHandler);
    if (!(key in this.listeners)) {
      this.listeners[key] = [];
    }

    this.logger('info', `Removing listener for ${key} event`, {
      tags: ['event', 'client'],
    });
    this.listeners[key] = this.listeners[key].filter(
      (value) => value !== callback,
    );
  }

  _logApiRequest(
    type: string,
    url: string,
    data: unknown,
    config: AxiosRequestConfig & {
      config?: AxiosRequestConfig & { maxBodyLength?: number };
    },
  ) {
    this.logger('info', `client: ${type} - Request - ${url}`, {
      tags: ['api', 'api_request', 'client'],
      url,
      payload: data,
      config,
    });
  }

  _logApiResponse<T>(type: string, url: string, response: AxiosResponse<T>) {
    this.logger(
      'info',
      `client:${type} - Response - url: ${url} > status ${response.status}`,
      {
        tags: ['api', 'api_response', 'client'],
        url,
        response,
      },
    );
  }

  _logApiError(type: string, url: string, error: unknown) {
    this.logger('error', `client:${type} - Error - url: ${url}`, {
      tags: ['api', 'api_response', 'client'],
      url,
      error,
    });
  }

  doAxiosRequest = async <T>(
    type: string,
    url: string,
    data?: unknown,
    options: AxiosRequestConfig & {
      config?: AxiosRequestConfig & { maxBodyLength?: number };
    } = {},
  ): Promise<T> => {
    await this.tokenManager.tokenReady();
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
      this._logApiError(type, url, e);
      this.consecutiveFailures += 1;
      if (e.response) {
        /** connection_fallback depends on this token expiration logic */
        if (
          e.response.data.code === chatCodes.TOKEN_EXPIRED &&
          !this.tokenManager.isStatic()
        ) {
          if (this.consecutiveFailures > 1) {
            await sleep(retryInterval(this.consecutiveFailures));
          }
          await this.tokenManager.loadToken();
          return await this.doAxiosRequest<T>(type, url, data, options);
        }
        return this.handleResponse(e.response);
      } else {
        throw e as AxiosError<APIErrorResponse>;
      }
    }
  };

  get<T>(url: string, params?: AxiosRequestConfig['params']) {
    return this.doAxiosRequest<T>('get', url, null, {
      params,
    });
  }

  put<T>(url: string, data?: unknown) {
    return this.doAxiosRequest<T>('put', url, data);
  }

  post<T>(url: string, data?: unknown) {
    return this.doAxiosRequest<T>('post', url, data);
  }

  patch<T>(url: string, data?: unknown) {
    return this.doAxiosRequest<T>('patch', url, data);
  }

  delete<T>(url: string, params?: AxiosRequestConfig['params']) {
    return this.doAxiosRequest<T>('delete', url, null, {
      params,
    });
  }

  errorFromResponse(
    response: AxiosResponse<APIErrorResponse>,
  ): ErrorFromResponse<APIErrorResponse> {
    let err: ErrorFromResponse<APIErrorResponse>;
    err = new ErrorFromResponse(
      `StreamChat error HTTP code: ${response.status}`,
    );
    if (response.data && response.data.code) {
      err = new Error(
        `StreamChat error code ${response.data.code}: ${response.data.message}`,
      );
      err.code = response.data.code;
    }
    err.response = response;
    err.status = response.status;
    return err;
  }

  handleResponse<T>(response: AxiosResponse<T>) {
    const data = response.data;
    if (isErrorResponse(response)) {
      throw this.errorFromResponse(response);
    }
    return data;
  }

  dispatchEvent = (event: Event) => {
    if (!event.received_at) event.received_at = new Date();

    this._callClientListeners(event);
  };

  handleEvent = (messageEvent: WebSocket.MessageEvent) => {
    // dispatch the event to the channel listeners
    const jsonString = messageEvent.data as string;
    const event = JSON.parse(jsonString) as Event;
    this.dispatchEvent(event);
  };

  /**
   * @private
   *
   * Handle following user related events:
   * - user.presence.changed
   * - user.updated
   * - user.deleted
   *
   * @param {Event} event
   */
  // _handleUserEvent = (event: Event) => {
  //   if (!event.user) {
  //     return;
  //   }
  //
  //   /** update the client.state with any changes to users */
  //   if (
  //     event.type === 'user.presence.changed' ||
  //     event.type === 'user.updated'
  //   ) {
  //     if (event.user.id === this.userID) {
  //       const user = { ...(this.user || {}) };
  //       const _user = { ...(this._user || {}) };
  //
  //       // Remove deleted properties from user objects.
  //       for (const key in this.user) {
  //         if (key in event.user || isOwnUserBaseProperty(key)) {
  //           continue;
  //         }
  //
  //         delete user[key];
  //         delete _user[key];
  //       }
  //
  //       /** Updating only available properties in _user object. */
  //       for (const key in event.user) {
  //         if (_user && key in _user) {
  //           _user[key] = event.user[key];
  //         }
  //       }
  //
  //       // @ts-expect-error
  //       this._user = { ..._user };
  //       this.user = { ...user, ...event.user };
  //     }
  //   }
  // };

  // _handleClientEvent(event: Event) {
  //   const client = this;
  //   const postListenerCallbacks = [];
  //   this.logger(
  //     'info',
  //     `client:_handleClientEvent - Received event of type { ${event.type} }`,
  //     {
  //       tags: ['event', 'client'],
  //       event,
  //     },
  //   );
  //
  //   if (
  //     event.type === 'user.presence.changed' ||
  //     event.type === 'user.updated' ||
  //     event.type === 'user.deleted'
  //   ) {
  //     this._handleUserEvent(event);
  //   }
  //
  //   if (event.type === 'health.check' && event.me) {
  //     client.user = event.me;
  //     client.state.updateUser(event.me);
  //     client.mutedChannels = event.me.channel_mutes;
  //     client.mutedUsers = event.me.mutes;
  //   }
  //
  //   if (event.channel && event.type === 'notification.message_new') {
  //     this._addChannelConfig(event.channel);
  //   }
  //
  //   if (
  //     event.type === 'notification.channel_mutes_updated' &&
  //     event.me?.channel_mutes
  //   ) {
  //     const currentMutedChannelIds: string[] = [];
  //     const nextMutedChannelIds: string[] = [];
  //
  //     this.mutedChannels.forEach(
  //       (mute) => mute.channel && currentMutedChannelIds.push(mute.channel.cid),
  //     );
  //     event.me.channel_mutes.forEach(
  //       (mute) => mute.channel && nextMutedChannelIds.push(mute.channel.cid),
  //     );
  //
  //     /** Set the unread count of un-muted channels to 0, which is the behaviour of backend */
  //     currentMutedChannelIds.forEach((cid) => {
  //       if (!nextMutedChannelIds.includes(cid) && this.activeChannels[cid]) {
  //         this.activeChannels[cid].state.unreadCount = 0;
  //       }
  //     });
  //
  //     this.mutedChannels = event.me.channel_mutes;
  //   }
  //
  //   if (event.type === 'notification.mutes_updated' && event.me?.mutes) {
  //     this.mutedUsers = event.me.mutes;
  //   }
  //
  //   if (
  //     event.type === 'notification.mark_read' &&
  //     event.unread_channels === 0
  //   ) {
  //     const activeChannelKeys = Object.keys(this.activeChannels);
  //     activeChannelKeys.forEach(
  //       (activeChannelKey) =>
  //         (this.activeChannels[activeChannelKey].state.unreadCount = 0),
  //     );
  //   }
  //
  //   if (
  //     (event.type === 'channel.deleted' ||
  //       event.type === 'notification.channel_deleted') &&
  //     event.cid
  //   ) {
  //     client.state.deleteAllChannelReference(event.cid);
  //     this.activeChannels[event.cid]?._disconnect();
  //
  //     postListenerCallbacks.push(() => {
  //       if (!event.cid) return;
  //
  //       delete this.activeChannels[event.cid];
  //     });
  //   }
  //
  //   return postListenerCallbacks;
  // }

  _callClientListeners = (event: Event) => {
    const client = this;
    // gather and call the listeners
    const listeners: Array<(event: Event) => void> = [];
    if (client.listeners.all) {
      listeners.push(...client.listeners.all);
    }
    if (client.listeners[event.type]) {
      listeners.push(...client.listeners[event.type]);
    }

    // call the event and send it to the listeners
    for (const listener of listeners) {
      listener(event);
    }
  };

  /**
   * @private
   */
  async connect() {
    if (!this.userID || !this._user) {
      throw Error(
        'Call connectUser or connectAnonymousUser before starting the connection',
      );
    }
    if (!this.wsBaseURL) {
      throw Error('Websocket base url not set');
    }
    if (!this.clientID) {
      throw Error('clientID is not set');
    }

    if (
      !this.wsConnection &&
      (this.options.warmUp || this.options.enableInsights)
    ) {
      this._sayHi();
    }
    // The StableWSConnection handles all the reconnection logic.
    if (this.options.wsConnection && this.node) {
      // Intentionally avoiding adding ts generics on wsConnection in options since its only useful for unit test purpose.
      (this.options.wsConnection as unknown as StableWSConnection).setClient(
        this,
      );
      this.wsConnection = this.options
        .wsConnection as unknown as StableWSConnection;
    } else {
      this.wsConnection = new StableWSConnection(this);
    }

    try {
      // if fallback is used before, continue using it instead of waiting for WS to fail
      if (this.wsFallback) {
        return await this.wsFallback.connect();
      }

      // if WSFallback is enabled, ws connect should timeout faster so fallback can try
      return await this.wsConnection.connect(
        this.options.enableWSFallback
          ? this.defaultWSTimeoutWithFallback
          : this.defaultWSTimeout,
      );
    } catch (err) {
      // run fallback only if it's WS/Network error and not a normal API error
      // make sure browser is online before even trying the longpoll
      // @ts-ignore
      if (this.options.enableWSFallback && isWSFailure(err) && isOnline()) {
        this.logger(
          'info',
          'client:connect() - WS failed, fallback to longpoll',
          { tags: ['connection', 'client'] },
        );
        this.dispatchEvent({ type: 'transport.changed', mode: 'longpoll' });

        this.wsConnection._destroyCurrentWSConnection();
        this.wsConnection.disconnect().then(); // close WS so no retry
        this.wsFallback = new WSConnectionFallback(this);
        return await this.wsFallback.connect();
      }

      throw err;
    }
  }

  /**
   * Check the connectivity with server for warmup purpose.
   *
   * @private
   */
  _sayHi() {
    const client_request_id = randomId();
    const opts = {
      headers: AxiosHeaders.from({
        'x-client-request-id': client_request_id,
      }),
    };
    this.doAxiosRequest('get', this.baseURL + '/hi', null, opts).catch((e) => {
      if (this.options.enableInsights) {
        postInsights('http_hi_failed', {
          api_key: this.key,
          err: e,
          client_request_id,
        });
      }
    });
  }

  getUserAgent() {
    return (
      this.userAgent ||
      `stream-video-javascript-client-${this.node ? 'node' : 'browser'}-${
        process.env.PKG_VERSION
      }`
    );
  }

  setUserAgent(userAgent: string) {
    this.userAgent = userAgent;
  }

  /**
   * _isUsingServerAuth - Returns true if we're using server side auth
   */
  _isUsingServerAuth = () => !!this.secret;

  _enrichAxiosOptions(
    options: AxiosRequestConfig & { config?: AxiosRequestConfig } = {
      params: {},
      headers: {},
      config: {},
    },
  ): AxiosRequestConfig {
    const token = this._getToken();
    const authorization = token ? { Authorization: token } : undefined;
    let signal: AbortSignal | null = null;
    if (this.nextRequestAbortController !== null) {
      signal = this.nextRequestAbortController.signal;
      this.nextRequestAbortController = null;
    }

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
        'stream-auth-type': this.getAuthType(),
        'X-Stream-Client': this.getUserAgent(),
        ...options.headers,
      },
      ...(signal ? { signal } : {}),
      ...options.config,
      ...this.options.axiosRequestConfig,
    };
  }

  _getToken() {
    if (!this.tokenManager || this.anonymous) return null;

    return this.tokenManager.getToken();
  }

  /**
   * encode ws url payload
   * @private
   * @returns json string
   */
  _buildWSPayload = (client_request_id?: string) => {
    return JSON.stringify({
      user_id: this.userID,
      user_details: this._user,
      // device: this.options.device,
      client_request_id,
    });
  };

  /**
   * creates an abort controller that will be used by the next HTTP Request.
   */
  createAbortControllerForNextRequest() {
    return (this.nextRequestAbortController = new AbortController());
  }
}

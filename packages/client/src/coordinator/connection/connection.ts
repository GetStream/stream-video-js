import { StreamClient } from './client';
import {
  addConnectionEventListeners,
  isCloseEvent,
  KnownCodes,
  removeConnectionEventListeners,
  retryInterval,
  sleep,
} from './utils';
import type { StreamVideoEvent, UR, WSConnectionError } from './types';
import type { LogLevel } from '@stream-io/logger';
import type {
  ConnectedEvent,
  ConnectionErrorEvent,
  WSAuthMessage,
} from '../../gen/coordinator';
import { makeSafePromise, type SafePromise } from '../../helpers/promise';
import { getTimers } from '../../timers';
import { APIErrorCodes } from './errors';

/**
 * StableWSConnection - A WS connection that reconnects upon failure.
 * - the browser will sometimes report that you're online or offline
 * - the WS connection can break and fail (there is a 30s health check)
 * - sometimes your WS connection will seem to work while the user is in fact offline
 * - to speed up online/offline detection you can use the window.addEventListener('offline');
 *
 * There are 4 ways in which a connection can become unhealthy:
 * - websocket.onerror is called
 * - websocket.onclose is called
 * - the health check fails and no event is received for ~40 seconds
 * - the browser indicates the connection is now offline
 *
 * There are 2 assumptions we make about the server:
 * - state can be recovered by querying the channel again
 * - if the servers fails to publish a message to the client, the WS connection is destroyed
 */
export class StableWSConnection {
  // Parent client reference.
  client: StreamClient;

  // Underlying WebSocket. wsID is bumped on each new connection so stale
  // event handlers from previous sockets can be ignored.
  ws?: WebSocket;
  /** Incremented when a new WS connection is made */
  wsID = 1;

  // Connection lifecycle flags.
  /** We only make 1 attempt to reconnect at the same time.. */
  isConnecting = false;
  /** To avoid reconnect if client is disconnected */
  isDisconnected = false;
  /** Boolean that indicates if we have a working connection to the server */
  isHealthy = false;

  // Open-connection promise: resolves on `connection.ok`, rejects on close/error.
  connectionID?: string;
  private connectionOpenSafe?: SafePromise<ConnectedEvent>;
  resolveConnectionOpen?: (value: ConnectedEvent) => void;
  rejectConnectionOpen?: (reason?: WSConnectionError) => void;
  /** Boolean that indicates if the connection promise is resolved */
  isConnectionOpenResolved?: boolean = false;

  // Failure counters (drive retry/backoff scheduling).
  /** consecutive failures influence the duration of the timeout */
  consecutiveFailures = 0;
  /** keep track of the total number of failures */
  totalFailures = 0;

  // Health-check pings + connection-staleness check.
  /** Send a health check message every 25 seconds */
  pingInterval = 25 * 1000;
  healthCheckTimeoutRef?: number;
  connectionCheckTimeout = this.pingInterval + 10 * 1000;
  connectionCheckTimeoutRef?: NodeJS.Timeout;
  /** Store the last event time for health checks */
  lastEvent: Date | null = null;

  constructor(client: StreamClient) {
    this.client = client;
    addConnectionEventListeners(this.onlineStatusChanged);
  }

  _log = (msg: string, extra: UR | Error = {}, level: LogLevel = 'info') => {
    this.client.logger[level](`connection:${msg}`, extra);
  };

  setClient = (client: StreamClient) => {
    this.client = client;
  };

  /**
   * connect - Connect to the WS URL
   * the default 15s timeout allows between 2~3 tries
   * @return Promise that completes once the first health check message is received
   */
  connect = async (timeout = 15000): Promise<ConnectedEvent | undefined> => {
    if (this.isConnecting) {
      throw Error(
        `You've called connect twice, can only attempt 1 connection at the time`,
      );
    }

    this.isDisconnected = false;

    try {
      const healthCheck = await this._connect(timeout);
      this.consecutiveFailures = 0;

      this._log(
        `connect() - Established ws connection with healthcheck: ${healthCheck}`,
      );
    } catch (caught) {
      const error = caught as WSConnectionError;
      this.isHealthy = false;
      this.consecutiveFailures += 1;

      if (
        error.code === KnownCodes.TOKEN_EXPIRED &&
        !this.client.tokenManager.isStatic()
      ) {
        this._log(
          'connect() - WS failure due to expired token, so going to try to reload token and reconnect',
        );
        this._reconnect({ refreshToken: true });
      } else if (!error.isWSFailure) {
        // API rejected the connection and we should not retry
        throw new Error(
          JSON.stringify({
            code: error.code,
            StatusCode: error.StatusCode,
            message: error.message,
            isWSFailure: error.isWSFailure,
          }),
        );
      } else {
        // Transient WS failure (e.g., handshake watchdog). Kick off a
        // reconnect chain so _waitForHealthy(timeout) below has something
        // to poll for. Owning the trigger here (rather than inside
        // _connect()'s catch) keeps a single failure from spawning two
        // parallel chains - one from this catch and one from _reconnect's
        // own catch when _connect was called from there.
        this._reconnect();
      }
    }

    return await this._waitForHealthy(timeout);
  };

  /**
   * _waitForHealthy polls the promise connection to see if its resolved until it times out
   * the default 15s timeout allows between 2~3 tries
   * @param timeout duration(ms)
   */
  _waitForHealthy = async (timeout = 15000) => {
    return Promise.race([
      (async () => {
        const interval = 50; // ms
        for (let i = 0; i <= timeout; i += interval) {
          try {
            return await this.connectionOpen;
          } catch (caught) {
            const error = caught as WSConnectionError;
            if (i === timeout) {
              throw new Error(
                JSON.stringify({
                  code: error.code,
                  StatusCode: error.StatusCode,
                  message: error.message,
                  isWSFailure: error.isWSFailure,
                }),
              );
            }
            await sleep(interval);
          }
        }
        return undefined;
      })(),
      (async () => {
        await sleep(timeout);
        this.isConnecting = false;
        throw new Error(
          JSON.stringify({
            code: '',
            StatusCode: '',
            message: 'initial WS connection could not be established',
            isWSFailure: true,
          }),
        );
      })(),
    ]);
  };

  /**
   * Builds and returns the url for websocket.
   * @private
   * @returns url string
   */
  _buildUrl = () => {
    const params = new URLSearchParams();
    params.set('api_key', this.client.key);
    params.set('stream-auth-type', this.client.getAuthType());
    params.set('X-Stream-Client', this.client.getUserAgent());

    return `${this.client.wsBaseURL}/connect?${params.toString()}`;
  };

  /**
   * disconnect - Disconnect the connection and doesn't recover...
   */
  disconnect = (timeout?: number) => {
    this._log(
      `disconnect() - Closing the websocket connection for wsID ${this.wsID}`,
    );

    this.wsID += 1;
    this.isConnecting = false;
    this.isDisconnected = true;

    // start by removing all the listeners
    if (this.healthCheckTimeoutRef) {
      getTimers().clearInterval(this.healthCheckTimeoutRef);
    }
    if (this.connectionCheckTimeoutRef) {
      clearInterval(this.connectionCheckTimeoutRef);
    }

    removeConnectionEventListeners(this.onlineStatusChanged);

    this.isHealthy = false;

    let isClosedPromise: Promise<void>;
    // and finally close...
    // Assigning to local here because we will remove it from this before the
    // promise resolves.
    const { ws } = this;
    if (ws && ws.close && ws.readyState === ws.OPEN) {
      isClosedPromise = new Promise((resolve) => {
        const onclose = (event: CloseEvent) => {
          this._log(
            `disconnect() - resolving isClosedPromise ${
              event ? 'with' : 'without'
            } close frame`,
            { event },
          );
          resolve();
        };

        ws.onclose = onclose;
        // In case we don't receive close frame websocket server in time,
        // lets not wait for more than 1 second.
        setTimeout(onclose, timeout != null ? timeout : 1000);
      });

      this._log(
        `disconnect() - Manually closed connection by calling client.disconnect()`,
      );

      ws.close(
        KnownCodes.WS_CLOSED_SUCCESS,
        'Manually closed connection by calling client.disconnect()',
      );
    } else {
      this._log(
        `disconnect() - ws connection doesn't exist or it is already closed.`,
      );
      isClosedPromise = Promise.resolve();
    }

    delete this.ws;

    return isClosedPromise;
  };

  /**
   * _connect - Connect to the WS endpoint
   *
   * @param timeoutMs handshake watchdog deadline in ms. Defaults to
   *   `client.defaultWSTimeout` when not provided. Top-level `connect(timeout)`
   *   passes its own timeout through so caller-supplied deadlines are honored.
   * @return Promise that completes once the first health check message is received
   */
  _connect = async (
    timeoutMs?: number,
  ): Promise<ConnectedEvent | undefined> => {
    if (this.isConnecting) return; // ignore _connect if it's currently trying to connect
    this.isConnecting = true;
    // Snapshot of the connection-id reject closure owned by THIS attempt.
    // Captured at function entry so that even early failures (e.g.,
    // tokenManager.loadToken throwing before we reach the WS phase) can
    // settle the promise the caller is awaiting. Re-captured below if
    // _connect itself sets up a fresh promise. If a concurrent
    // openConnection() rotates `client.rejectConnectionId` later, our
    // captured closure still settles only the original promise (P1) and
    // never poisons the newer one (P2).
    let ownRejectConnectionId = this.client.rejectConnectionId;
    let isTokenReady = false;
    try {
      this._log(`_connect() - waiting for token`);
      await this.client.tokenManager.tokenReady();
      isTokenReady = true;
    } catch {
      // token provider has failed before, so try again
    }

    try {
      if (!isTokenReady) {
        this._log(
          `_connect() - tokenProvider failed before, so going to retry`,
        );
        await this.client.tokenManager.loadToken();
      }

      if (!this.client.isConnectionIdPromisePending) {
        this.client._setupConnectionIdPromise();
        // recapture: we just rotated the resolver ourselves, the new
        // closure is the one bound to the promise this attempt owns.
        ownRejectConnectionId = this.client.rejectConnectionId;
      }
      this._setupConnectionPromise();
      const wsURL = this._buildUrl();
      this._log(`_connect() - Connecting to ${wsURL}`);
      const WS = this.client.options.WebSocketImpl ?? WebSocket;
      this.ws = new WS(wsURL);
      this.ws.onopen = this.onopen.bind(this, this.wsID);
      this.ws.onclose = this.onclose.bind(this, this.wsID);
      this.ws.onerror = this.onerror.bind(this, this.wsID);
      this.ws.onmessage = this.onmessage.bind(this, this.wsID);

      // race the WS handshake against an explicit deadline so a silent
      // network drop (e.g., carrier NAT or firewall) cannot wedge _connect()
      const handshakeTimeout = timeoutMs ?? this.client.defaultWSTimeout;
      const timers = getTimers();
      let handshakeTimeoutId: number | undefined;
      let response: ConnectedEvent | undefined;
      try {
        response = await Promise.race<ConnectedEvent | undefined>([
          this.connectionOpen as Promise<ConnectedEvent>,
          new Promise<never>((_, reject) => {
            handshakeTimeoutId = timers.setTimeout(() => {
              const err: WSConnectionError = new Error(
                `WS handshake timed out after ${handshakeTimeout}ms`,
              );
              err.isWSFailure = true;
              reject(err);
            }, handshakeTimeout);
          }),
        ]);
      } finally {
        timers.clearTimeout(handshakeTimeoutId);
      }
      this.isConnecting = false;

      // If we were disconnected during the handshake (e.g. closeConnection()
      // ran while a background _reconnect's _connect was in flight), tear
      // down the new WS and throw so the caller of connect() does not get
      // a misleading "success" for a connection that has already been
      // aborted. We must NOT skip the throw and just return undefined: the
      // outer connect() would otherwise fall through to _waitForHealthy(),
      // which would observe the already-resolved connectionOpen promise
      // and resolve with a ConnectedEvent for a torn-down connection.
      if (this.isDisconnected) {
        if (this.ws && this.ws.readyState !== this.ws.CLOSED) {
          this._destroyCurrentWSConnection();
        }
        throw new Error(
          'WS handshake aborted: disconnect() ran while connecting',
        );
      }

      if (response) {
        this.connectionID = response.connection_id;
        this.client.resolveConnectionId?.(this.connectionID);
        return response;
      }
      return undefined;
    } catch (caught) {
      const err = caught as WSConnectionError;
      this.isConnecting = false;
      this._log(`_connect() - Error - `, err);
      // Reject THIS attempt's connection-id promise (P1) directly via the
      // captured closure. Whether or not a concurrent openConnection() has
      // since rotated client.rejectConnectionId to a newer promise (P2),
      // calling ownRejectConnectionId only settles P1 - P2 is untouched.
      // P1's awaiters (e.g., doAxiosRequest awaiting connectionIdPromise)
      // therefore fail fast instead of being orphaned.
      ownRejectConnectionId?.(err);
      // connectionOpen is per-instance and not subject to rotation, so
      // calling it unconditionally is safe (and a no-op if already settled).
      this.rejectConnectionOpen?.(err);
      // tear down a half-open WS so it does not linger and fire a stale wsID later
      if (this.ws && this.ws.readyState !== this.ws.CLOSED) {
        this._destroyCurrentWSConnection();
      }
      throw err;
    }
  };

  /**
   * _reconnect - Retry the connection to WS endpoint
   *
   * @param {{ interval?: number; refreshToken?: boolean }} options Following options are available
   *
   * - `interval`	{int}			number of ms that function should wait before reconnecting
   * - `refreshToken` {boolean}	reload/refresh user token be refreshed before attempting reconnection.
   */
  async _reconnect(
    options: { interval?: number; refreshToken?: boolean } = {},
  ): Promise<void> {
    this._log('_reconnect() - Initiating the reconnect');

    // only allow 1 connection at the time
    if (this.isConnecting || this.isHealthy) {
      this._log('_reconnect() - Abort (1) since already connecting or healthy');
      return;
    }

    // reconnect in case of on error or on close
    // also reconnect if the health check cycle fails
    let interval = options.interval;
    if (!interval) {
      interval = retryInterval(this.consecutiveFailures);
    }
    // reconnect, or try again after a little while...
    await sleep(interval);

    // Check once again if by some other call to _reconnect is active or connection is
    // already restored, then no need to proceed.
    if (this.isConnecting || this.isHealthy) {
      this._log('_reconnect() - Abort (2) since already connecting or healthy');
      return;
    }

    if (this.isDisconnected) {
      this._log('_reconnect() - Abort (3) since disconnect() is called');
      return;
    }

    this._log('_reconnect() - Destroying current WS connection');

    // cleanup the old connection
    this._destroyCurrentWSConnection();

    if (options.refreshToken) {
      await this.client.tokenManager.loadToken();
    }

    try {
      await this._connect();
      this._log('_reconnect() - Waiting for recoverCallBack');
      // await this.client.recoverState();
      this._log('_reconnect() - Finished recoverCallBack');

      this.consecutiveFailures = 0;
    } catch (caught) {
      const error = caught as WSConnectionError;
      this.isHealthy = false;
      this.consecutiveFailures += 1;
      if (
        error.code === KnownCodes.TOKEN_EXPIRED &&
        !this.client.tokenManager.isStatic()
      ) {
        this._log(
          '_reconnect() - WS failure due to expired token, so going to try to reload token and reconnect',
        );

        return this._reconnect({ refreshToken: true });
      }

      // reconnect on WS failures, don't reconnect if there is a code bug
      if (error.isWSFailure) {
        this._log('_reconnect() - WS failure, so going to try to reconnect');

        this._reconnect();
      }
    }
    this._log('_reconnect() - == END ==');
  }

  /**
   * onlineStatusChanged - this function is called when the browser connects or disconnects from the internet.
   *
   * @param {Event} event Event with type online or offline
   */
  onlineStatusChanged = (event: Event) => {
    if (event.type === 'offline') {
      // mark the connection as down
      this._log('onlineStatusChanged() - Status changing to offline');
      // we know that the app is offline so dispatch the unhealthy connection event immediately
      this._setHealth(false, true);
    } else if (event.type === 'online') {
      // retry right now...
      // We check this.isHealthy, not sure if it's always
      // smart to create a new WS connection if the old one is still up and running.
      // it's possible we didn't miss any messages, so this process is just expensive and not needed.
      this._log(
        `onlineStatusChanged() - Status changing to online. isHealthy: ${this.isHealthy}`,
      );
      if (!this.isHealthy) {
        this._reconnect({ interval: 10 });
      }
    }
  };

  onopen = (wsID: number) => {
    if (this.wsID !== wsID) return;

    const user = this.client.user;
    if (!user) {
      this.client.logger.error(`User not set, can't connect to WS`);
      return;
    }

    const token = this.client._getToken();
    if (!token) {
      this.client.logger.error(`Token not set, can't connect authenticate`);
      return;
    }

    const authMessage = JSON.stringify({
      token,
      user_details: {
        id: user.id,
        name: user.name,
        image: user.image,
        custom: user.custom,
      },
    } as WSAuthMessage);

    this._log(`onopen() - Sending auth message ${authMessage}`, {}, 'trace');

    this.ws?.send(authMessage);
    this._log('onopen() - onopen callback', { wsID });
  };

  onmessage = (wsID: number, event: MessageEvent) => {
    if (this.wsID !== wsID) return;

    const data =
      typeof event.data === 'string'
        ? (JSON.parse(event.data) as StreamVideoEvent)
        : null;

    // we wait till the first message before we consider the connection open.
    // the reason for this is that auth errors and similar errors trigger a ws.onopen and immediately
    // after that a ws.onclose.
    if (
      !this.isConnectionOpenResolved &&
      data &&
      data.type === 'connection.error'
    ) {
      this.isConnectionOpenResolved = true;
      if (data.error) {
        this.rejectConnectionOpen?.(this._errorFromWSEvent(data, false));
        return;
      }
    }

    // trigger the event..
    this.lastEvent = new Date();

    if (
      data &&
      (data.type === 'health.check' || data.type === 'connection.ok')
    ) {
      // the initial health-check should come from the client
      this.scheduleNextPing();
    }

    if (data && data.type === 'connection.ok') {
      this.resolveConnectionOpen?.(data);
      this._setHealth(true);
    }

    if (data && data.type === 'connection.error' && data.error) {
      const { code } = data.error;
      this.isHealthy = false;
      this.isConnecting = false;
      this.consecutiveFailures += 1;
      if (
        code === KnownCodes.TOKEN_EXPIRED &&
        !this.client.tokenManager.isStatic()
      ) {
        clearTimeout(this.connectionCheckTimeoutRef);
        this._log(
          'connect() - WS failure due to expired token, so going to try to reload token and reconnect',
        );
        this._reconnect({ refreshToken: true });
      }
    }

    if (data) {
      data.received_at = new Date();
      this.client.dispatchEvent(data);
    }
    this.scheduleConnectionCheck();
  };

  onclose = (wsID: number, event: CloseEvent) => {
    if (this.wsID !== wsID) return;

    this._log('onclose() - onclose callback - ' + event.code, { event, wsID });

    if (event.code === KnownCodes.WS_CLOSED_SUCCESS) {
      // this is a permanent error raised by stream.
      // usually caused by invalid auth details
      const error: WSConnectionError = new Error(
        `WS connection reject with error ${event.reason}`,
      );
      error.reason = event.reason;
      error.code = event.code;
      error.wasClean = event.wasClean;
      error.target = event.target;

      this.rejectConnectionOpen?.(error);
      this._log(`onclose() - WS connection reject with error ${event.reason}`, {
        event,
      });
    } else {
      this.consecutiveFailures += 1;
      this.totalFailures += 1;
      this._setHealth(false);
      this.isConnecting = false;

      this.rejectConnectionOpen?.(this._errorFromWSEvent(event));

      this._log(`onclose() - WS connection closed. Calling reconnect ...`, {
        event,
      });

      // reconnect if its an abnormal failure
      this._reconnect();
    }
  };

  onerror = (wsID: number, event: Event) => {
    if (this.wsID !== wsID) return;

    this.consecutiveFailures += 1;
    this.totalFailures += 1;
    this._setHealth(false);
    this.isConnecting = false;
    this._log(`onerror() - WS connection resulted into error`, { event });

    this._reconnect();
  };

  /**
   * _setHealth - Sets the connection to healthy or unhealthy.
   * Broadcasts an event in case the connection status changed.
   *
   * @param {boolean} healthy boolean indicating if the connection is healthy or not
   * @param {boolean} dispatchImmediately boolean indicating to dispatch event immediately even if the connection is unhealthy
   */
  _setHealth = (healthy: boolean, dispatchImmediately = false) => {
    if (healthy === this.isHealthy) return;

    this.isHealthy = healthy;

    if (this.isHealthy || dispatchImmediately) {
      this.client.dispatchEvent({
        type: 'connection.changed',
        online: this.isHealthy,
      });
      return;
    }

    // we're offline, wait few seconds and fire and event if still offline
    setTimeout(() => {
      if (this.isHealthy) return;
      this.client.dispatchEvent({
        type: 'connection.changed',
        online: this.isHealthy,
      });
    }, 5000);
  };

  /**
   * _errorFromWSEvent - Creates an error object for the WS event
   */
  private _errorFromWSEvent = (
    event: CloseEvent | ConnectionErrorEvent,
    isWSFailure = true,
  ): WSConnectionError => {
    let code: number;
    let statusCode: number;
    let message: string;
    if (isCloseEvent(event)) {
      code = event.code;
      message = event.reason;
      statusCode = 0;
    } else {
      const { error } = event;
      code = error.code;
      message = error.message;
      statusCode = error.StatusCode;
    }

    const msg = `WS failed with code: ${code}: ${APIErrorCodes[code] || code} and reason: ${message}`;
    this._log(msg, { event }, 'warn');
    const error = new Error(msg) as WSConnectionError;
    error.code = code;
    /**
     * StatusCode does not exist on any event types but has been left
     * as is to preserve JS functionality during the TS implementation
     */
    error.StatusCode = statusCode;
    error.isWSFailure = isWSFailure;
    return error;
  };

  /**
   * _destroyCurrentWSConnection - Removes the current WS connection
   *
   */
  _destroyCurrentWSConnection() {
    // increment the ID, meaning we will ignore all messages from the old
    // ws connection from now on.
    this.wsID += 1;

    try {
      this?.ws?.close();
    } catch {
      // we don't care
    }
  }

  /**
   * _setupPromise - sets up the this.connectOpen promise
   */
  _setupConnectionPromise = () => {
    this.isConnectionOpenResolved = false;
    /** a promise that is resolved once ws.open is called */
    this.connectionOpenSafe = makeSafePromise(
      new Promise<ConnectedEvent>((resolve, reject) => {
        this.resolveConnectionOpen = resolve;
        this.rejectConnectionOpen = reject;
      }),
    );
  };

  get connectionOpen() {
    return this.connectionOpenSafe?.();
  }

  /**
   * Schedules a next health check ping for websocket.
   */
  scheduleNextPing = () => {
    const timers = getTimers();
    if (this.healthCheckTimeoutRef) {
      timers.clearTimeout(this.healthCheckTimeoutRef);
    }

    // 30 seconds is the recommended interval (messenger uses this)
    this.healthCheckTimeoutRef = timers.setTimeout(() => {
      // send the healthcheck..., server replies with a health check event
      const data = [{ type: 'health.check', client_id: this.client.clientID }];
      // try to send on the connection
      try {
        this.ws?.send(JSON.stringify(data));
      } catch {
        // error will already be detected elsewhere
      }
    }, this.pingInterval);
  };

  /**
   * scheduleConnectionCheck - schedules a check for time difference between last received event and now.
   * If the difference is more than 35 seconds, it means our health check logic has failed and websocket needs
   * to be reconnected.
   */
  scheduleConnectionCheck = () => {
    clearTimeout(this.connectionCheckTimeoutRef);
    this.connectionCheckTimeoutRef = setTimeout(() => {
      const now = new Date();
      if (
        this.lastEvent &&
        now.getTime() - this.lastEvent.getTime() > this.connectionCheckTimeout
      ) {
        this._log('scheduleConnectionCheck - going to reconnect');
        this._setHealth(false);
        this._reconnect();
      }
    }, this.connectionCheckTimeout);
  };
}

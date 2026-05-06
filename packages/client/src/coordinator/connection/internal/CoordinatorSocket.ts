import type { WorkerTimer } from '@stream-io/worker-timer';
import type {
  ConnectedEvent,
  ConnectionErrorEvent,
} from '../../../gen/coordinator';
import { makeSafePromise, type SafePromise } from '../../../helpers/promise';
import type { ScopedLogger } from '../../../logger';
import { APIErrorCodes } from '../errors';
import type { TokenManager } from '../token_manager';
import { StreamVideoEvent, WebSocketConnectionError } from '../types';
import { isCloseEvent, KnownCodes, retryInterval, sleep } from '../utils';
import { ConnectionIdGate } from './ConnectionIdGate';
import { EventDispatcher } from './EventDispatcher';
import { HeartbeatController } from './HeartbeatController';
import { WebSocketTransport } from './WebSocketTransport';

export type CoordinatorSocketOptions = {
  pingIntervalMs?: number;
  healthTimeoutMs?: number;
  unhealthyDispatchDelayMs?: number;
  disconnectTimeoutMs?: number;
  defaultWsTimeoutMs?: number;
  authHandshakeTimeoutMs?: number;
};

export type CoordinatorSocketArgs = {
  urlBuilder: () => string;
  authMessageBuilder: () => string;
  tokenManager: TokenManager;
  eventDispatcher: EventDispatcher;
  gate: ConnectionIdGate;
  transportFactory: (url: string) => WebSocketTransport;
  timers: WorkerTimer;
  getClientId: () => string | undefined;
  logger: ScopedLogger;
  options?: CoordinatorSocketOptions;
};

type ResolvedOptions = Required<CoordinatorSocketOptions>;

const resolveOptions = (
  options: CoordinatorSocketOptions | undefined,
): ResolvedOptions => {
  const defaultWsTimeoutMs = options?.defaultWsTimeoutMs ?? 15000;
  return {
    pingIntervalMs: options?.pingIntervalMs ?? 25000,
    healthTimeoutMs: options?.healthTimeoutMs ?? 35000,
    unhealthyDispatchDelayMs: options?.unhealthyDispatchDelayMs ?? 5000,
    disconnectTimeoutMs: options?.disconnectTimeoutMs ?? 1000,
    defaultWsTimeoutMs,
    authHandshakeTimeoutMs:
      options?.authHandshakeTimeoutMs ?? defaultWsTimeoutMs,
  };
};

const isWebSocketConnectionError = (
  err: unknown,
): err is WebSocketConnectionError => err instanceof WebSocketConnectionError;

/**
 * Lifecycle owner for one logical coordinator WebSocket. Composes
 * WebSocketTransport, HeartbeatController and ConnectionIdGate, and runs the
 * inline reconnect logic that previously lived in StableWSConnection.
 */
export class CoordinatorSocket {
  private urlBuilder: () => string;
  private authMessageBuilder: () => string;
  private tokenManager: TokenManager;
  private eventDispatcher: EventDispatcher;
  private gate: ConnectionIdGate;
  private transportFactory: (url: string) => WebSocketTransport;
  private timers: WorkerTimer;
  private getClientId: () => string | undefined;
  private logger: ScopedLogger;
  private options: ResolvedOptions;

  private wsId = 1;
  private transport?: WebSocketTransport;
  private connectionId?: string;
  private healthy = false;
  private connecting = false;
  private disconnected = false;
  private lastEvent: Date | null = null;
  private connectionOpenSafe?: SafePromise<ConnectedEvent>;
  private resolveConnectionOpen?: (event: ConnectedEvent) => void;
  private rejectConnectionOpen?: (err: Error) => void;
  private isConnectionOpenResolved = false;
  private unhealthyDispatchHandle?: number;
  private authHandshakeHandle?: number;
  private wsConsecutiveFailures = 0;
  private totalFailures = 0;

  private heartbeat: HeartbeatController;

  constructor(args: CoordinatorSocketArgs) {
    this.urlBuilder = args.urlBuilder;
    this.authMessageBuilder = args.authMessageBuilder;
    this.tokenManager = args.tokenManager;
    this.eventDispatcher = args.eventDispatcher;
    this.gate = args.gate;
    this.transportFactory = args.transportFactory;
    this.timers = args.timers;
    this.getClientId = args.getClientId;
    this.logger = args.logger;
    this.options = resolveOptions(args.options);

    this.heartbeat = new HeartbeatController({
      options: {
        pingIntervalMs: this.options.pingIntervalMs,
        healthTimeoutMs: this.options.healthTimeoutMs,
      },
      timers: this.timers,
      sendPing: this.sendHealthCheck,
      onUnhealthy: this.onWatchdogUnhealthy,
      getClientId: this.getClientId,
    });
  }

  // public ----------------------------------------------------------------

  connect = async (timeout?: number): Promise<ConnectedEvent | undefined> => {
    if (this.connecting) {
      throw new Error(
        "You've called connect twice, can only attempt 1 connection at the time",
      );
    }
    this.disconnected = false;

    try {
      const handshake = await this.runHandshake();
      this.wsConsecutiveFailures = 0;
      this.logger.info(
        `connect() established ws connection with healthcheck: ${handshake?.connection_id}`,
      );
    } catch (err) {
      this.healthy = false;
      this.wsConsecutiveFailures += 1;
      const code = (err as { code?: string | number } | undefined)?.code;
      const isWSFailure = isWebSocketConnectionError(err)
        ? err.isWSFailure
        : Boolean((err as { isWSFailure?: boolean })?.isWSFailure);
      if (code === KnownCodes.TOKEN_EXPIRED && !this.tokenManager.isStatic()) {
        // Fire-and-forget so waitForHealthy() can poll for the reconnect attempt.
        this.scheduleReconnect({ refreshToken: true });
      } else if (!isWSFailure) {
        if (isWebSocketConnectionError(err)) throw err;
        const fallbackMessage =
          err instanceof Error ? err.message : String(err);
        throw new WebSocketConnectionError({
          code: code ?? '',
          StatusCode:
            (err as { StatusCode?: string | number } | undefined)?.StatusCode ??
            '',
          message: fallbackMessage,
          isWSFailure: false,
        });
      }
      // wsFailure: fall through to waitForHealthy poll
    }

    return await this.waitForHealthy(
      timeout ?? this.options.defaultWsTimeoutMs,
    );
  };

  disconnect = async (timeout?: number): Promise<void> => {
    this.logger.info(`disconnect() closing ws ${this.wsId}`);
    this.wsId += 1;
    this.connecting = false;
    this.disconnected = true;
    this.heartbeat.stop();
    this.clearAuthHandshakeWatchdog();
    if (this.unhealthyDispatchHandle != null) {
      this.timers.clearTimeout(this.unhealthyDispatchHandle);
      this.unhealthyDispatchHandle = undefined;
    }
    this.healthy = false;
    const transport = this.transport;
    this.transport = undefined;
    if (!transport) return;
    await transport.close(
      KnownCodes.WS_CLOSED_SUCCESS,
      'Manually closed connection by calling client.disconnect()',
      timeout ?? this.options.disconnectTimeoutMs,
    );
  };

  /**
   * Polls the in-flight connection promise until it resolves with the
   * connected event, or rejects after `timeout` with a typed
   * WebSocketConnectionError.
   */
  waitForHealthy = async (
    timeout = this.options.defaultWsTimeoutMs,
  ): Promise<ConnectedEvent | undefined> => {
    return Promise.race([this.poll(timeout), this.outerTimeout(timeout)]);
  };

  getConnectionId = (): string | undefined => this.connectionId;
  isHealthy = (): boolean => this.healthy;
  isConnecting = (): boolean => this.connecting;
  isDisconnected = (): boolean => this.disconnected;

  handleOnline = (): void => {
    this.logger.info('online: checking reconnect', { healthy: this.healthy });
    if (!this.healthy) this.scheduleReconnect({ interval: 10 });
  };

  handleOffline = (): void => {
    this.logger.info('offline: marking unhealthy');
    this.setHealth(false, true);
  };

  // private ---------------------------------------------------------------

  private poll = async (
    timeout: number,
  ): Promise<ConnectedEvent | undefined> => {
    const interval = 50;
    for (let i = 0; i <= timeout; i += interval) {
      const safe = this.connectionOpenSafe;
      if (!safe) {
        await sleep(interval);
        continue;
      }
      try {
        return await safe();
      } catch (err) {
        if (i === timeout) {
          if (isWebSocketConnectionError(err)) throw err;
          const e = err as {
            code?: string | number;
            StatusCode?: string | number;
            message?: string;
            isWSFailure?: boolean;
          };
          throw new WebSocketConnectionError({
            code: e?.code ?? '',
            StatusCode: e?.StatusCode ?? '',
            message: e?.message ?? 'WS handshake failed',
            isWSFailure: !!e?.isWSFailure,
          });
        }
        await sleep(interval);
      }
    }
    return undefined;
  };

  private outerTimeout = async (timeout: number): Promise<never> => {
    await sleep(timeout);
    this.connecting = false;
    throw new WebSocketConnectionError({
      code: '',
      StatusCode: '',
      message: 'initial WS connection could not be established',
      isWSFailure: true,
    });
  };

  private setupConnectionPromise = (): void => {
    this.isConnectionOpenResolved = false;
    const promise = new Promise<ConnectedEvent>((resolve, reject) => {
      this.resolveConnectionOpen = resolve;
      this.rejectConnectionOpen = reject;
    });
    this.connectionOpenSafe = makeSafePromise(promise);
  };

  private runHandshake = async (): Promise<ConnectedEvent | undefined> => {
    try {
      await this.tokenManager.tokenReady();
    } catch {
      // swallow: loadToken below will retry
    }
    if (!this.tokenManager.getToken() && !this.tokenManager.isStatic()) {
      await this.tokenManager.loadToken();
    }

    this.connecting = true;
    this.gate.arm();
    this.setupConnectionPromise();
    const url = this.urlBuilder();
    const myWsId = this.wsId;
    this.transport = this.transportFactory(url);
    this.transport.open({
      onOpen: () => this.onOpen(myWsId),
      onMessage: (event) => this.onMessage(myWsId, event),
      onClose: (event) => this.onClose(myWsId, event),
      onError: (event) => this.onError(myWsId, event),
    });

    try {
      const safe = this.connectionOpenSafe!;
      const response = await safe();
      this.connecting = false;
      if (response) {
        this.connectionId = response.connection_id;
        this.gate.resolve(this.connectionId);
        this.heartbeat.start();
        return response;
      }
      return undefined;
    } catch (err) {
      this.gate.reject(err as Error);
      this.connecting = false;
      this.logger.error('runHandshake error', err);
      throw err;
    }
  };

  private scheduleReconnect = (opts?: {
    interval?: number;
    refreshToken?: boolean;
  }): void => {
    if (this.connecting || this.healthy) {
      this.logger.debug('reconnect: abort (1) already connecting or healthy');
      return;
    }
    const delay = opts?.interval ?? retryInterval(this.wsConsecutiveFailures);
    void this.runScheduledReconnect(delay, opts?.refreshToken);
  };

  private runScheduledReconnect = async (
    delay: number,
    refreshToken?: boolean,
  ): Promise<void> => {
    await sleep(delay);
    if (this.connecting || this.healthy) return;
    if (this.disconnected) return;
    await this.handleReconnectAttempt({ refreshToken });
  };

  private handleReconnectAttempt = async (opts: {
    refreshToken?: boolean;
  }): Promise<void> => {
    this.destroyCurrentTransport();
    if (opts.refreshToken) {
      try {
        await this.tokenManager.loadToken();
      } catch (e) {
        this.logger.error('reconnect: token refresh failed', e);
        return;
      }
    }
    try {
      await this.runHandshake();
      this.wsConsecutiveFailures = 0;
    } catch (err) {
      const code = (err as { code?: string | number } | undefined)?.code;
      const isWSFailure = isWebSocketConnectionError(err)
        ? err.isWSFailure
        : Boolean((err as { isWSFailure?: boolean })?.isWSFailure);
      if (code === KnownCodes.TOKEN_EXPIRED && !this.tokenManager.isStatic()) {
        this.scheduleReconnect({ refreshToken: true });
        return;
      }
      if (isWSFailure) {
        this.scheduleReconnect();
        return;
      }
      this.logger.error(
        'handleReconnectAttempt: non-WS failure, giving up silently',
        err,
      );
    }
  };

  private destroyCurrentTransport = (): void => {
    this.wsId += 1;
    const transport = this.transport;
    this.transport = undefined;
    if (!transport) return;
    void transport.close(
      KnownCodes.WS_CLOSED_SUCCESS,
      'reconnect: closing previous transport',
      this.options.disconnectTimeoutMs,
    );
  };

  // event handlers --------------------------------------------------------

  private onOpen = (myWsId: number): void => {
    if (myWsId !== this.wsId) return;
    let authMessage: string;
    try {
      authMessage = this.authMessageBuilder();
    } catch (err) {
      this.logger.error(
        'onopen() failed to build auth message; not sending',
        err,
      );
      return;
    }
    this.logger.trace('onopen() sending auth message', { authMessage });
    const ok = this.transport!.send(authMessage);
    if (!ok) {
      this.logger.error('onopen() auth message send failed');
      return;
    }
    this.logger.info('onopen() onopen callback', { wsId: myWsId });
    this.armAuthHandshakeWatchdog(myWsId);
  };

  private onMessage = (myWsId: number, event: MessageEvent): void => {
    if (myWsId !== this.wsId) return;

    const data =
      typeof event.data === 'string'
        ? (JSON.parse(event.data) as StreamVideoEvent)
        : null;

    if (
      !this.isConnectionOpenResolved &&
      data &&
      data.type === 'connection.error'
    ) {
      this.isConnectionOpenResolved = true;
      this.clearAuthHandshakeWatchdog();
      const errEvent = data as unknown as ConnectionErrorEvent;
      if (errEvent.error) {
        this.rejectConnectionOpen?.(this.errorFromWSEvent(errEvent, false));
        return;
      }
    }

    this.lastEvent = new Date();

    if (
      data &&
      (data.type === 'health.check' || data.type === 'connection.ok')
    ) {
      this.heartbeat.notePingReply();
    }

    if (data && data.type === 'connection.ok') {
      this.clearAuthHandshakeWatchdog();
      this.resolveConnectionOpen?.(data);
      this.setHealth(true);
    }

    if (data && data.type === 'connection.error') {
      const errEvent = data as unknown as ConnectionErrorEvent;
      const code = errEvent.error?.code;
      this.healthy = false;
      this.connecting = false;
      this.wsConsecutiveFailures += 1;
      if (code === KnownCodes.TOKEN_EXPIRED && !this.tokenManager.isStatic()) {
        this.heartbeat.stop();
        this.logger.info(
          'onMessage(): WS failure due to expired token, scheduling reconnect with refreshed token',
        );
        this.scheduleReconnect({ refreshToken: true });
      }
    }

    if (data) {
      data.received_at = new Date();
      this.eventDispatcher.dispatch(data);
    }
    this.heartbeat.noteEventReceived();
  };

  private onClose = (myWsId: number, event: CloseEvent): void => {
    if (myWsId !== this.wsId) return;
    this.logger.info(`onclose() code ${event.code}`, { event, wsId: myWsId });
    this.clearAuthHandshakeWatchdog();

    if (event.code === KnownCodes.WS_CLOSED_SUCCESS) {
      const err = new WebSocketConnectionError({
        code: event.code,
        StatusCode: 0,
        message: `WS connection reject with error ${event.reason}`,
        isWSFailure: false,
        reason: event.reason,
        wasClean: event.wasClean,
      });
      this.rejectConnectionOpen?.(err);
      this.logger.info(`onclose() WS connection rejected: ${event.reason}`, {
        event,
      });
      return;
    }

    this.wsConsecutiveFailures += 1;
    this.totalFailures += 1;
    this.setHealth(false);
    this.connecting = false;
    const wsErr = this.errorFromWSEvent(event, true);
    this.rejectConnectionOpen?.(wsErr);
    this.invalidateGate(wsErr);
    this.logger.info('onclose() abnormal close, reconnecting', { event });
    this.scheduleReconnect();
  };

  private onError = (myWsId: number, event: Event): void => {
    if (myWsId !== this.wsId) return;
    this.clearAuthHandshakeWatchdog();
    this.wsConsecutiveFailures += 1;
    this.totalFailures += 1;
    this.setHealth(false);
    this.connecting = false;
    const wsErr = new WebSocketConnectionError({
      code: '',
      StatusCode: 0,
      message: 'WebSocket connection error',
      isWSFailure: true,
    });
    this.logger.warn('onerror() WS connection error', { event });
    this.rejectConnectionOpen?.(wsErr);
    this.invalidateGate(wsErr);
    this.scheduleReconnect();
  };

  // helpers ---------------------------------------------------------------

  private setHealth = (healthy: boolean, dispatchImmediately = false): void => {
    if (healthy === this.healthy) return;
    this.healthy = healthy;

    if (this.unhealthyDispatchHandle != null) {
      this.timers.clearTimeout(this.unhealthyDispatchHandle);
      this.unhealthyDispatchHandle = undefined;
    }

    if (this.healthy || dispatchImmediately) {
      this.eventDispatcher.dispatch({
        type: 'connection.changed',
        online: this.healthy,
      });
      return;
    }

    this.unhealthyDispatchHandle = this.timers.setTimeout(() => {
      if (this.healthy) return;
      this.eventDispatcher.dispatch({
        type: 'connection.changed',
        online: false,
      });
    }, this.options.unhealthyDispatchDelayMs);
  };

  private sendHealthCheck = (clientId: string): void => {
    const payload = JSON.stringify([
      { type: 'health.check', client_id: clientId },
    ]);
    this.transport?.send(payload);
  };

  private onWatchdogUnhealthy = (): void => {
    this.logger.info('watchdog: marking connection unhealthy and reconnecting');
    this.setHealth(false);
    this.scheduleReconnect();
  };

  /**
   * Reject the gate after a non-graceful close so callers awaiting the gate
   * see the typed error. If the gate is currently pending, reject directly. If
   * it has a resolved connection_id, rotate it: reset + arm + reject. New
   * callers then see the rejection; the next successful handshake re-arms via
   * runHandshake's `arm()`.
   */
  private invalidateGate = (err: Error): void => {
    if (this.gate.isPending()) {
      this.gate.reject(err);
      return;
    }
    if (this.gate.isSettled()) {
      this.gate.reset();
      this.gate.arm();
      this.gate.reject(err);
    }
  };

  private armAuthHandshakeWatchdog = (myWsId: number): void => {
    if (this.authHandshakeHandle != null) {
      this.timers.clearTimeout(this.authHandshakeHandle);
    }
    this.authHandshakeHandle = this.timers.setTimeout(() => {
      if (myWsId !== this.wsId) return;
      if (this.isConnectionOpenResolved) return;
      if (this.connectionId) return;
      const err = new WebSocketConnectionError({
        code: 'AUTH_HANDSHAKE_TIMEOUT',
        StatusCode: 0,
        message: 'auth handshake did not complete in time',
        isWSFailure: true,
      });
      this.logger.warn(
        'auth handshake timed out: rejecting handshake and scheduling reconnect',
        { wsId: myWsId },
      );
      this.isConnectionOpenResolved = true;
      this.rejectConnectionOpen?.(err);
      this.gate.reject(err);
      this.connecting = false;
      this.scheduleReconnect();
    }, this.options.authHandshakeTimeoutMs);
  };

  private clearAuthHandshakeWatchdog = (): void => {
    if (this.authHandshakeHandle != null) {
      this.timers.clearTimeout(this.authHandshakeHandle);
      this.authHandshakeHandle = undefined;
    }
  };

  private errorFromWSEvent = (
    event: CloseEvent | ConnectionErrorEvent,
    isWSFailure = true,
  ): WebSocketConnectionError => {
    let code: number | string;
    let statusCode: number | string;
    let message: string;
    let reason: string | undefined;
    let wasClean: boolean | undefined;
    if (isCloseEvent(event)) {
      code = event.code;
      message = event.reason;
      statusCode = 0;
      reason = event.reason;
      wasClean = event.wasClean;
    } else {
      const apiError = event.error;
      code = apiError.code;
      message = apiError.message;
      statusCode = apiError.StatusCode;
    }
    const friendly = `WS failed with code: ${code}: ${
      typeof code === 'number' ? APIErrorCodes[code] || code : code
    } and reason: ${message}`;
    this.logger.warn(friendly, { event });
    return new WebSocketConnectionError({
      code,
      StatusCode: statusCode,
      message: friendly,
      isWSFailure,
      reason,
      wasClean,
    });
  };
}

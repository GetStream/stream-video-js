import { SignalServerClient } from './gen/video/sfu/signal_rpc/signal.client';
import {
  createSignalClient,
  retryable,
  withHeaders,
  withRequestLogger,
  withRequestTracer,
} from './rpc';
import {
  createWebSocketSignalChannel,
  Dispatcher,
  IceTrickleBuffer,
  SfuEventKinds,
} from './rtc';
import {
  JoinRequest,
  JoinResponse,
  SfuRequest,
} from './gen/video/sfu/event/events';
import {
  ICERestartRequest,
  SendAnswerRequest,
  SendStatsRequest,
  SetPublisherRequest,
  TrackMuteState,
  TrackSubscriptionDetails,
} from './gen/video/sfu/signal_rpc/signal';
import { ICETrickle } from './gen/video/sfu/models/models';
import { StreamClient } from './coordinator/connection/client';
import { generateUUIDv4 } from './coordinator/connection/utils';
import { Credentials } from './gen/coordinator';
import { ScopedLogger, videoLoggerSystem } from './logger';
import {
  makeSafePromise,
  PromiseWithResolvers,
  promiseWithResolvers,
  SafePromise,
} from './helpers/promise';
import { getTimers } from './timers';
import { Tracer, TraceSlice } from './stats';

export type StreamSfuClientConstructor = {
  /**
   * The event dispatcher instance to use.
   */
  dispatcher: Dispatcher;

  /**
   * The credentials to use for the connection.
   */
  credentials: Credentials;

  /**
   * The `cid` (call ID) to use for the connection.
   */
  cid: string;

  /**
   * `sessionId` to use for the connection.
   */
  sessionId?: string;

  /**
   * A log tag to use for logging. Useful for debugging multiple instances.
   */
  tag: string;

  /**
   * The timeout in milliseconds for waiting for the `joinResponse`.
   * Defaults to 5000ms.
   */
  joinResponseTimeout?: number;

  /**
   * Callback for when the WebSocket connection is closed.
   */
  onSignalClose?: (reason: string) => void;

  /**
   * The StreamClient instance to use for the connection.
   */
  streamClient: StreamClient;

  /**
   * Flag to enable tracing.
   */
  enableTracing: boolean;
};

type SfuWebSocketParams = {
  attempt: string; // the reconnect attempt, start with 0
  user_id: string;
  api_key: string;
  user_session_id: string;
  cid: string;
};

/**
 * The client used for exchanging information with the SFU.
 */
export class StreamSfuClient {
  /**
   * A buffer for ICE Candidates that are received before
   * the Publisher and Subscriber Peer Connections are ready to handle them.
   */
  readonly iceTrickleBuffer = new IceTrickleBuffer();

  /**
   * The `sessionId` of the currently connected participant.
   */
  readonly sessionId: string;

  /**
   * The `edgeName` representing the edge the client is connected to.
   */
  readonly edgeName: string;

  /**
   * Holds the current WebSocket connection to the SFU.
   */
  private signalWs!: WebSocket;

  /**
   * Promise that resolves when the WebSocket connection is ready (open).
   */
  private signalReady!: SafePromise<WebSocket>;

  /**
   * Flag to indicate if the client is in the process of leaving the call.
   * This is set to `true` when the user initiates the leave process.
   */
  isLeaving = false;

  /**
   * Flag to indicate if the client is in the process of clean closing the connection.
   * When set to `true`, the client will not attempt to reconnect
   * and will close the WebSocket connection gracefully.
   * Otherwise, it will close the connection with an error code and
   * trigger a reconnection attempt.
   */
  isClosingClean = false;

  private readonly rpc: SignalServerClient;
  private keepAliveInterval?: number;
  private connectionCheckTimeout?: NodeJS.Timeout;
  private migrateAwayTimeout?: NodeJS.Timeout;
  private readonly pingIntervalInMs = 5 * 1000;
  private readonly unhealthyTimeoutInMs = 15 * 1000;
  private lastMessageTimestamp?: Date;
  private readonly tracer?: Tracer;
  private readonly unsubscribeIceTrickle: () => void;
  private readonly unsubscribeNetworkChanged: () => void;
  private readonly onSignalClose: ((reason: string) => void) | undefined;
  private readonly logger: ScopedLogger;
  readonly tag: string;
  private readonly credentials: Credentials;
  private readonly dispatcher: Dispatcher;
  private readonly joinResponseTimeout: number;
  private networkAvailableTask: PromiseWithResolvers<void> | undefined;
  /**
   * Promise that resolves when the JoinResponse is received.
   * Rejects after a certain threshold if the response is not received.
   */
  private joinResponseTask = promiseWithResolvers<JoinResponse>();

  /**
   * Promise that resolves when the migration is complete.
   * Rejects after a certain threshold if the migration is not complete.
   */
  private migrationTask?: PromiseWithResolvers<void>;

  /**
   * A controller to abort the current requests.
   */
  private readonly abortController = new AbortController();

  /**
   * The normal closure code. Used for controlled shutdowns.
   */
  static NORMAL_CLOSURE = 1000;
  /**
   * The error code used when the SFU connection is unhealthy.
   * Usually, this means that no message has been received from the SFU for
   * a certain amount of time (`connectionCheckTimeout`).
   */
  static ERROR_CONNECTION_UNHEALTHY = 4001;
  /**
   * The error code used when the SFU connection is disposed because a new
   * connection is established or is about to be established.
   * Here, we don't use 1000 (normal closure) because we don't want the
   * SFU to clean up the resources associated with the current participant.
   */
  static DISPOSE_OLD_SOCKET = 4100;
  /**
   * The close code used when the client fails to join the call (on the SFU).
   */
  static JOIN_FAILED = 4101;

  /**
   * Constructs a new SFU client.
   */
  constructor({
    dispatcher,
    credentials,
    sessionId,
    cid,
    tag,
    joinResponseTimeout = 5000,
    onSignalClose,
    streamClient,
    enableTracing,
  }: StreamSfuClientConstructor) {
    this.dispatcher = dispatcher;
    this.sessionId = sessionId || generateUUIDv4();
    this.onSignalClose = onSignalClose;
    this.credentials = credentials;
    const { server, token } = credentials;
    this.edgeName = server.edge_name;
    this.joinResponseTimeout = joinResponseTimeout;
    this.tag = tag;
    this.logger = videoLoggerSystem.getLogger('SfuClient', { tags: [tag] });
    this.tracer = enableTracing
      ? new Tracer(`${tag}-${this.edgeName}`)
      : undefined;
    this.rpc = createSignalClient({
      baseUrl: server.url,
      interceptors: [
        withHeaders({ Authorization: `Bearer ${token}` }),
        this.tracer && withRequestTracer(this.tracer.trace),
        this.logger.getLogLevel() === 'trace' &&
          withRequestLogger(this.logger, 'trace'),
      ].filter((v) => !!v),
    });

    // Special handling for the ICETrickle kind of events.
    // The SFU might trigger these events before the initial RTC
    // connection is established or "JoinResponse" received.
    // In that case, those events (ICE candidates) need to be buffered
    // and later added to the appropriate PeerConnection
    // once the remoteDescription is known and set.
    this.unsubscribeIceTrickle = dispatcher.on('iceTrickle', (iceTrickle) => {
      this.iceTrickleBuffer.push(iceTrickle);
    });

    // listen to network changes to handle offline state
    // we shouldn't attempt to recover websocket connection when offline
    this.unsubscribeNetworkChanged = streamClient.on('network.changed', (e) => {
      if (!e.online) {
        this.networkAvailableTask = promiseWithResolvers();
      } else {
        this.networkAvailableTask?.resolve();
      }
    });

    this.createWebSocket({
      attempt: tag,
      user_id: streamClient.user?.id || '',
      api_key: streamClient.key,
      user_session_id: this.sessionId,
      cid,
    });
  }

  private createWebSocket = (params: SfuWebSocketParams) => {
    const eventsToTrace: Partial<Record<SfuEventKinds, boolean>> = {
      callEnded: true,
      changePublishQuality: true,
      changePublishOptions: true,
      connectionQualityChanged: true,
      error: true,
      goAway: true,
      inboundStateNotification: true,
    };
    this.signalWs = createWebSocketSignalChannel({
      tag: this.tag,
      endpoint: `${this.credentials.server.ws_endpoint}?${new URLSearchParams(params).toString()}`,
      tracer: this.tracer,
      onMessage: (message) => {
        this.lastMessageTimestamp = new Date();
        this.scheduleConnectionCheck();
        const eventKind = message.eventPayload.oneofKind;
        if (eventsToTrace[eventKind]) {
          this.tracer?.trace(eventKind, message);
        }
        this.dispatcher.dispatch(message, this.tag);
      },
    });

    let timeoutId: NodeJS.Timeout;
    this.signalReady = makeSafePromise(
      Promise.race<WebSocket>([
        new Promise((resolve, reject) => {
          let didOpen = false;
          const onOpen = () => {
            didOpen = true;
            clearTimeout(timeoutId);
            this.signalWs.removeEventListener('open', onOpen);
            resolve(this.signalWs);
          };

          this.signalWs.addEventListener('open', onOpen);

          this.signalWs.addEventListener('close', (e) => {
            this.handleWebSocketClose(e);
            // Normally, this shouldn't have any effect, because WS should never emit 'close'
            // before emitting 'open'. However, stranger things have happened, and we don't
            // want to leave signalReady in a pending state.
            const message = didOpen
              ? `SFU WS closed: ${e.code} ${e.reason}`
              : `SFU WS connection can't be established: ${e.code} ${e.reason}`;
            this.tracer?.trace('signal.close', message);
            clearTimeout(timeoutId);
            reject(new Error(message));
          });
        }),

        new Promise((resolve, reject) => {
          timeoutId = setTimeout(() => {
            const message = `SFU WS connection failed to open after ${this.joinResponseTimeout}ms`;
            this.tracer?.trace('signal.timeout', message);
            reject(new Error(message));
          }, this.joinResponseTimeout);
        }),
      ]),
    );
  };

  get isHealthy() {
    return (
      this.signalWs.readyState === WebSocket.OPEN &&
      this.joinResponseTask.isResolved()
    );
  }

  get joinTask() {
    return this.joinResponseTask.promise;
  }

  private handleWebSocketClose = (e: CloseEvent) => {
    this.signalWs.removeEventListener('close', this.handleWebSocketClose);
    getTimers().clearInterval(this.keepAliveInterval);
    clearTimeout(this.connectionCheckTimeout);
    this.onSignalClose?.(`${e.code} ${e.reason}`);
  };

  close = (code: number = StreamSfuClient.NORMAL_CLOSURE, reason?: string) => {
    this.isClosingClean = code !== StreamSfuClient.ERROR_CONNECTION_UNHEALTHY;
    if (this.signalWs.readyState === WebSocket.OPEN) {
      this.logger.debug(`Closing SFU WS connection: ${code} - ${reason}`);
      this.signalWs.close(code, `js-client: ${reason}`);
      this.signalWs.removeEventListener('close', this.handleWebSocketClose);
    }
    this.dispose();
  };

  private dispose = () => {
    this.logger.debug('Disposing SFU client');
    this.unsubscribeIceTrickle();
    this.unsubscribeNetworkChanged();
    clearInterval(this.keepAliveInterval);
    clearTimeout(this.connectionCheckTimeout);
    clearTimeout(this.migrateAwayTimeout);
    this.abortController.abort();
    this.migrationTask?.resolve();
    this.iceTrickleBuffer.dispose();
  };

  getTrace = (): TraceSlice | undefined => {
    return this.tracer?.take();
  };

  leaveAndClose = async (reason: string) => {
    try {
      this.isLeaving = true;
      await this.joinTask;
      await this.notifyLeave(reason);
    } catch (err) {
      this.logger.debug('Error notifying SFU about leaving call', err);
    }

    this.close(StreamSfuClient.NORMAL_CLOSURE, reason.substring(0, 115));
  };

  updateSubscriptions = async (tracks: TrackSubscriptionDetails[]) => {
    await this.joinTask;
    return retryable(
      () => this.rpc.updateSubscriptions({ sessionId: this.sessionId, tracks }),
      this.abortController.signal,
    );
  };

  setPublisher = async (data: Omit<SetPublisherRequest, 'sessionId'>) => {
    await this.joinTask;
    return retryable(
      () => this.rpc.setPublisher({ ...data, sessionId: this.sessionId }),
      this.abortController.signal,
    );
  };

  sendAnswer = async (data: Omit<SendAnswerRequest, 'sessionId'>) => {
    await this.joinTask;
    return retryable(
      () => this.rpc.sendAnswer({ ...data, sessionId: this.sessionId }),
      this.abortController.signal,
    );
  };

  iceTrickle = async (data: Omit<ICETrickle, 'sessionId'>) => {
    await this.joinTask;
    return retryable(
      () => this.rpc.iceTrickle({ ...data, sessionId: this.sessionId }),
      this.abortController.signal,
    );
  };

  iceRestart = async (data: Omit<ICERestartRequest, 'sessionId'>) => {
    await this.joinTask;
    return retryable(
      () => this.rpc.iceRestart({ ...data, sessionId: this.sessionId }),
      this.abortController.signal,
    );
  };

  updateMuteStates = async (muteStates: TrackMuteState[]) => {
    await this.joinTask;
    return retryable(
      () =>
        this.rpc.updateMuteStates({ muteStates, sessionId: this.sessionId }),
      this.abortController.signal,
    );
  };

  sendStats = async (stats: Omit<SendStatsRequest, 'sessionId'>) => {
    await this.joinTask;
    // NOTE: we don't retry sending stats
    return this.rpc.sendStats({ ...stats, sessionId: this.sessionId });
  };

  startNoiseCancellation = async () => {
    await this.joinTask;
    return retryable(
      () => this.rpc.startNoiseCancellation({ sessionId: this.sessionId }),
      this.abortController.signal,
    );
  };

  stopNoiseCancellation = async () => {
    await this.joinTask;
    return retryable(
      () => this.rpc.stopNoiseCancellation({ sessionId: this.sessionId }),
      this.abortController.signal,
    );
  };

  enterMigration = async (opts: { timeout?: number } = {}) => {
    this.isLeaving = true;
    const { timeout = 7 * 1000 } = opts;

    this.migrationTask?.reject(new Error('Cancelled previous migration'));
    const task = (this.migrationTask = promiseWithResolvers());
    const unsubscribe = this.dispatcher.on(
      'participantMigrationComplete',
      () => {
        unsubscribe();
        clearTimeout(this.migrateAwayTimeout);
        task.resolve();
      },
    );
    this.migrateAwayTimeout = setTimeout(() => {
      unsubscribe();
      task.reject(
        new Error(`Migration (${this.tag}) failed to complete in ${timeout}ms`),
      );
    }, timeout);

    return task.promise;
  };

  join = async (
    data: Omit<JoinRequest, 'sessionId' | 'token'>,
  ): Promise<JoinResponse> => {
    // wait for the signal web socket to be ready before sending "joinRequest"
    await this.signalReady();
    if (
      this.joinResponseTask.isResolved() ||
      this.joinResponseTask.isRejected()
    ) {
      // we need to lock the RPC requests until we receive a JoinResponse.
      // that's why we have this primitive lock mechanism.
      // the client starts with already initialized joinResponseTask,
      // and this code creates a new one for the next join request.
      this.joinResponseTask = promiseWithResolvers<JoinResponse>();
    }

    // capture a reference to the current joinResponseTask as it might
    // be replaced with a new one in case a second join request is made
    const current = this.joinResponseTask;

    let timeoutId: NodeJS.Timeout | undefined = undefined;
    const unsubscribe = this.dispatcher.on('joinResponse', (joinResponse) => {
      clearTimeout(timeoutId);
      unsubscribe();
      this.keepAlive();
      current.resolve(joinResponse);
    });

    timeoutId = setTimeout(() => {
      unsubscribe();
      const message = `Waiting for "joinResponse" has timed out after ${this.joinResponseTimeout}ms`;
      this.tracer?.trace('joinRequestTimeout', message);
      current.reject(new Error(message));
    }, this.joinResponseTimeout);

    const joinRequest = SfuRequest.create({
      requestPayload: {
        oneofKind: 'joinRequest',
        joinRequest: JoinRequest.create({
          ...data,
          sessionId: this.sessionId,
          token: this.credentials.token,
        }),
      },
    });

    this.tracer?.trace('joinRequest', joinRequest);
    await this.send(joinRequest);

    return current.promise;
  };

  private ping = async () => {
    return this.send(
      SfuRequest.create({
        requestPayload: {
          oneofKind: 'healthCheckRequest',
          healthCheckRequest: {},
        },
      }),
    );
  };

  private notifyLeave = async (reason: string) => {
    return this.send(
      SfuRequest.create({
        requestPayload: {
          oneofKind: 'leaveCallRequest',
          leaveCallRequest: {
            sessionId: this.sessionId,
            reason,
          },
        },
      }),
    );
  };

  private send = async (message: SfuRequest) => {
    await this.signalReady(); // wait for the signal ws to be open
    const msgJson = SfuRequest.toJson(message);
    if (this.signalWs.readyState !== WebSocket.OPEN) {
      this.logger.debug('Signal WS is not open. Skipping message', msgJson);
      return;
    }
    this.logger.debug(`Sending message to: ${this.edgeName}`, msgJson);
    this.signalWs.send(SfuRequest.toBinary(message));
  };

  private keepAlive = () => {
    const timers = getTimers();
    timers.clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = timers.setInterval(() => {
      this.ping().catch((e) => {
        this.logger.error('Error sending healthCheckRequest to SFU', e);
      });
    }, this.pingIntervalInMs);
  };

  private scheduleConnectionCheck = () => {
    clearTimeout(this.connectionCheckTimeout);
    this.connectionCheckTimeout = setTimeout(() => {
      if (this.lastMessageTimestamp) {
        const timeSinceLastMessage =
          new Date().getTime() - this.lastMessageTimestamp.getTime();

        if (timeSinceLastMessage > this.unhealthyTimeoutInMs) {
          this.close(
            StreamSfuClient.ERROR_CONNECTION_UNHEALTHY,
            `SFU connection unhealthy. Didn't receive any message for ${this.unhealthyTimeoutInMs}ms`,
          );
        }
      }
    }, this.unhealthyTimeoutInMs);
  };
}

import { SignalServerClient } from './gen/video/sfu/signal_rpc/signal.client';
import {
  createSignalClient,
  retryable,
  withHeaders,
  withRequestLogger,
} from './rpc';
import {
  createWebSocketSignalChannel,
  Dispatcher,
  IceTrickleBuffer,
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
  TrackSubscriptionDetails,
  UpdateMuteStatesRequest,
} from './gen/video/sfu/signal_rpc/signal';
import { ICETrickle, TrackType } from './gen/video/sfu/models/models';
import { generateUUIDv4, sleep } from './coordinator/connection/utils';
import { Credentials } from './gen/coordinator';
import { Logger } from './coordinator/connection/types';
import { getLogger, getLogLevel } from './logger';
import { withoutConcurrency } from './helpers/concurrency';
import {
  promiseWithResolvers,
  PromiseWithResolvers,
} from './helpers/withResolvers';

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
   * `sessionId` to use for the connection.
   */
  sessionId?: string;

  /**
   * A log tag to use for logging. Useful for debugging multiple instances.
   */
  logTag: string;

  /**
   * The timeout in milliseconds for waiting for the `joinResponse`.
   * Defaults to 5000ms.
   */
  joinResponseTimeout?: number;

  /**
   * Callback for when the WebSocket connection is closed.
   */
  onSignalClose?: () => void;
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
  private signalReady!: Promise<WebSocket>;

  /**
   * Flag to indicate if the client is in the process of leaving the call.
   * This is set to `true` when the user initiates the leave process.
   */
  isLeaving = false;

  private readonly rpc: SignalServerClient;
  private keepAliveInterval?: NodeJS.Timeout;
  private connectionCheckTimeout?: NodeJS.Timeout;
  private migrateAwayTimeout?: NodeJS.Timeout;
  private pingIntervalInMs = 10 * 1000;
  private unhealthyTimeoutInMs = this.pingIntervalInMs + 5 * 1000;
  private lastMessageTimestamp?: Date;
  private readonly restoreWebSocketConcurrencyTag = Symbol('recoverWebSocket');
  private readonly unsubscribeIceTrickle: () => void;
  private readonly onSignalClose: (() => void) | undefined;
  private readonly logger: Logger;
  private readonly logTag: string;
  private readonly credentials: Credentials;
  private readonly dispatcher: Dispatcher;
  private readonly joinResponseTimeout?: number;
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
  static DISPOSE_OLD_SOCKET = 4002;

  /**
   * Constructs a new SFU client.
   */
  constructor({
    dispatcher,
    credentials,
    sessionId,
    logTag,
    joinResponseTimeout = 5000,
    onSignalClose,
  }: StreamSfuClientConstructor) {
    this.dispatcher = dispatcher;
    this.sessionId = sessionId || generateUUIDv4();
    this.onSignalClose = onSignalClose;
    this.credentials = credentials;
    const { server, token } = credentials;
    this.edgeName = server.edge_name;
    this.joinResponseTimeout = joinResponseTimeout;
    this.logTag = logTag;
    this.logger = getLogger(['SfuClient', logTag]);
    this.rpc = createSignalClient({
      baseUrl: server.url,
      interceptors: [
        withHeaders({
          Authorization: `Bearer ${token}`,
        }),
        getLogLevel() === 'trace' && withRequestLogger(this.logger, 'trace'),
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

    this.createWebSocket();
  }

  private createWebSocket = () => {
    this.signalWs = createWebSocketSignalChannel({
      logTag: this.logTag,
      endpoint: `${this.credentials.server.ws_endpoint}?tag=${this.logTag}`,
      onMessage: (message) => {
        this.lastMessageTimestamp = new Date();
        this.scheduleConnectionCheck();
        this.dispatcher.dispatch(message, this.logTag);
      },
    });

    this.signalWs.addEventListener('close', this.handleWebSocketClose);
    this.signalWs.addEventListener('error', this.restoreWebSocket);

    this.signalReady = new Promise((resolve) => {
      const onOpen = () => {
        this.signalWs.removeEventListener('open', onOpen);
        resolve(this.signalWs);
      };
      this.signalWs.addEventListener('open', onOpen);
    });
  };

  private cleanUpWebSocket = () => {
    this.signalWs.removeEventListener('error', this.restoreWebSocket);
    this.signalWs.removeEventListener('close', this.handleWebSocketClose);
  };

  private restoreWebSocket = () => {
    withoutConcurrency(this.restoreWebSocketConcurrencyTag, async () => {
      this.logger('debug', 'Restoring SFU WS connection');
      this.cleanUpWebSocket();
      await sleep(500);
      this.createWebSocket();
    }).catch((err) => this.logger('debug', `Can't restore WS connection`, err));
  };

  get isHealthy() {
    return this.signalWs.readyState === WebSocket.OPEN;
  }

  get joinTask() {
    return this.joinResponseTask.promise;
  }

  private handleWebSocketClose = () => {
    this.signalWs.removeEventListener('close', this.handleWebSocketClose);
    clearInterval(this.keepAliveInterval);
    clearTimeout(this.connectionCheckTimeout);
    this.onSignalClose?.();
  };

  close = (code: number = StreamSfuClient.NORMAL_CLOSURE, reason?: string) => {
    if (this.signalWs.readyState === WebSocket.OPEN) {
      this.logger('debug', `Closing SFU WS connection: ${code} - ${reason}`);
      this.signalWs.close(code, `js-client: ${reason}`);
      this.cleanUpWebSocket();
    }
    this.dispose();
  };

  dispose = () => {
    this.logger('debug', 'Disposing SFU client');
    this.unsubscribeIceTrickle();
    clearInterval(this.keepAliveInterval);
    clearTimeout(this.connectionCheckTimeout);
    clearTimeout(this.migrateAwayTimeout);
    this.abortController.abort();
    this.migrationTask?.resolve();
  };

  leaveAndClose = async (reason: string) => {
    await this.joinTask;
    try {
      this.isLeaving = true;
      await this.notifyLeave(reason);
    } catch (err) {
      this.logger('debug', 'Error notifying SFU about leaving call', err);
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

  updateMuteState = async (trackType: TrackType, muted: boolean) => {
    await this.joinTask;
    return this.updateMuteStates({ muteStates: [{ trackType, muted }] });
  };

  updateMuteStates = async (
    data: Omit<UpdateMuteStatesRequest, 'sessionId'>,
  ) => {
    await this.joinTask;
    return retryable(
      () => this.rpc.updateMuteStates({ ...data, sessionId: this.sessionId }),
      this.abortController.signal,
    );
  };

  sendStats = async (stats: Omit<SendStatsRequest, 'sessionId'>) => {
    await this.joinTask;
    return retryable(
      () => this.rpc.sendStats({ ...stats, sessionId: this.sessionId }),
      this.abortController.signal,
    );
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
        new Error(
          `Migration (${this.logTag}) failed to complete in ${timeout}ms`,
        ),
      );
    }, timeout);

    return task.promise;
  };

  join = async (
    data: Omit<JoinRequest, 'sessionId' | 'token'>,
  ): Promise<JoinResponse> => {
    // wait for the signal web socket to be ready before sending "joinRequest"
    await this.signalReady;
    if (this.joinResponseTask.isResolved || this.joinResponseTask.isRejected) {
      // we need to lock the RPC requests until we receive a JoinResponse.
      // that's why we have this primitive lock mechanism.
      // the client starts with already initialized joinResponseTask,
      // and this code creates a new one for the next join request.
      this.joinResponseTask = promiseWithResolvers<JoinResponse>();
    }

    // capture a reference to the current joinResponseTask as it might
    // be replaced with a new one in case a second join request is made
    const current = this.joinResponseTask;

    let timeoutId: NodeJS.Timeout;
    const unsubscribe = this.dispatcher.on('joinResponse', (joinResponse) => {
      this.logger('debug', 'Received joinResponse', joinResponse);
      clearTimeout(timeoutId);
      unsubscribe();
      this.keepAlive();
      current.resolve(joinResponse);
    });

    timeoutId = setTimeout(() => {
      unsubscribe();
      current.reject(new Error('Waiting for "joinResponse" has timed out'));
    }, this.joinResponseTimeout);

    await this.send(
      SfuRequest.create({
        requestPayload: {
          oneofKind: 'joinRequest',
          joinRequest: JoinRequest.create({
            ...data,
            sessionId: this.sessionId,
            token: this.credentials.token,
          }),
        },
      }),
    );

    return current.promise;
  };

  ping = async () => {
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
    await this.signalReady; // wait for the signal ws to be open
    const msgJson = SfuRequest.toJson(message);
    if (this.signalWs.readyState !== WebSocket.OPEN) {
      this.logger('debug', 'Signal WS is not open. Skipping message', msgJson);
      return;
    }
    this.logger('debug', `Sending message to: ${this.edgeName}`, msgJson);
    this.signalWs.send(SfuRequest.toBinary(message));
  };

  private keepAlive = () => {
    clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = setInterval(() => {
      this.ping().catch((e) => {
        this.logger('error', 'Error sending healthCheckRequest to SFU', e);
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

import type {
  FinishedUnaryCall,
  RpcInterceptor,
  UnaryCall,
} from '@protobuf-ts/runtime-rpc';
import { SignalServerClient } from './gen/video/sfu/signal_rpc/signal.client';
import { createSignalClient, withHeaders, withRequestLogger } from './rpc';
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
import {
  Error as SfuError,
  ICETrickle,
  TrackType,
} from './gen/video/sfu/models/models';
import { retryInterval, sleep } from './coordinator/connection/utils';
import { SFUResponse } from './gen/coordinator';
import { Logger, LogLevel } from './coordinator/connection/types';
import { getLogger, getLogLevel } from './logger';
import { promiseWithResolvers } from './helpers/withResolvers';

export type StreamSfuClientConstructor = {
  /**
   * The event dispatcher instance to use.
   */
  dispatcher: Dispatcher;

  /**
   * The SFU server to connect to.
   */
  sfuServer: SFUResponse;

  /**
   * The JWT token to use for authentication.
   */
  token: string;

  /**
   * `sessionId` to use for the connection.
   */
  sessionId: string;

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
   * @param event the event.
   */
  onSignalClose?: (event: CloseEvent) => void;
};

/**
 * The client used for exchanging information with the SFU.
 */
export class StreamSfuClient {
  /**
   * A buffer for ICE Candidates that are received before
   * the PeerConnections are ready to handle them.
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
   * The current token used for authenticating against the SFU.
   */
  readonly token: string;

  /**
   * The SFU server details the current client is connected to.
   */
  readonly sfuServer: SFUResponse;

  /**
   * Holds the current WebSocket connection to the SFU.
   */
  signalWs: WebSocket;

  /**
   * Promise that resolves when the WebSocket connection is ready (open).
   */
  signalReady: Promise<WebSocket>;

  isClosing = false;

  private readonly rpc: SignalServerClient;
  private keepAliveInterval?: NodeJS.Timeout;
  private connectionCheckTimeout?: NodeJS.Timeout;
  private migrateAwayTimeout?: NodeJS.Timeout;
  private pingIntervalInMs = 10 * 1000;
  private unhealthyTimeoutInMs = this.pingIntervalInMs + 5 * 1000;
  private lastMessageTimestamp?: Date;
  private readonly unsubscribeIceTrickle: () => void;
  private readonly logger: Logger;
  private readonly dispatcher: Dispatcher;
  private readonly joinResponseTimeout?: number;
  /**
   * Promise that resolves when the JoinResponse is received.
   * Rejects after a certain threshold if the response is not received.
   */
  private joinResponseTask = promiseWithResolvers<JoinResponse>();

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
   * Constructs a new SFU client.
   */
  constructor({
    dispatcher,
    sfuServer,
    token,
    sessionId,
    logTag,
    joinResponseTimeout = 5000,
    onSignalClose,
  }: StreamSfuClientConstructor) {
    this.dispatcher = dispatcher;
    this.sessionId = sessionId;
    this.sfuServer = sfuServer;
    this.edgeName = sfuServer.edge_name;
    this.token = token;
    this.joinResponseTimeout = joinResponseTimeout;
    this.logger = getLogger(['sfu-client', logTag]);
    this.rpc = createSignalClient({
      baseUrl: sfuServer.url,
      interceptors: [
        withHeaders({
          Authorization: `Bearer ${token}`,
        }),
        getLogLevel() === 'trace' && withRequestLogger(this.logger, 'trace'),
      ].filter(Boolean) as RpcInterceptor[],
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

    this.signalWs = createWebSocketSignalChannel({
      logTag,
      endpoint: sfuServer.ws_endpoint,
      onMessage: (message) => {
        this.lastMessageTimestamp = new Date();
        this.scheduleConnectionCheck();
        dispatcher.dispatch(message);
      },
    });

    const onClose = (e: CloseEvent) => {
      this.signalWs.removeEventListener('close', onClose);
      clearInterval(this.keepAliveInterval);
      clearTimeout(this.connectionCheckTimeout);
      if (onSignalClose) {
        onSignalClose(e);
      }
    };
    this.signalWs.addEventListener('close', onClose);

    this.signalReady = new Promise((resolve) => {
      const onOpen = () => {
        this.signalWs.removeEventListener('open', onOpen);
        resolve(this.signalWs);
      };
      this.signalWs.addEventListener('open', onOpen);
    });
  }

  close = (code?: number, reason?: string) => {
    this.isClosing = true;

    this.logger('debug', `Closing SFU WS connection: ${code} - ${reason}`);
    if (this.signalWs.readyState !== this.signalWs.CLOSED) {
      this.signalWs.close(code, `js-client: ${reason}`);
    }
    this.dispose();
  };

  dispose = () => {
    this.unsubscribeIceTrickle();
    clearInterval(this.keepAliveInterval);
    clearTimeout(this.connectionCheckTimeout);
    clearTimeout(this.migrateAwayTimeout);
  };

  leaveAndClose = async (reason: string) => {
    await this.joinResponseTask.promise;
    try {
      await this.notifyLeave(reason);
    } catch (err) {
      this.logger('debug', 'Error notifying SFU about leaving call', err);
    }

    this.close(StreamSfuClient.NORMAL_CLOSURE, reason.substring(0, 115));
  };

  updateSubscriptions = async (subscriptions: TrackSubscriptionDetails[]) => {
    await this.joinResponseTask.promise;
    return retryable(
      () =>
        this.rpc.updateSubscriptions({
          sessionId: this.sessionId,
          tracks: subscriptions,
        }),
      this.logger,
      'debug',
    );
  };

  setPublisher = async (data: Omit<SetPublisherRequest, 'sessionId'>) => {
    await this.joinResponseTask.promise;
    return retryable(
      () =>
        this.rpc.setPublisher({
          ...data,
          sessionId: this.sessionId,
        }),
      this.logger,
    );
  };

  sendAnswer = async (data: Omit<SendAnswerRequest, 'sessionId'>) => {
    await this.joinResponseTask.promise;
    return retryable(
      () =>
        this.rpc.sendAnswer({
          ...data,
          sessionId: this.sessionId,
        }),
      this.logger,
    );
  };

  iceTrickle = async (data: Omit<ICETrickle, 'sessionId'>) => {
    await this.joinResponseTask.promise;
    return retryable(
      () =>
        this.rpc.iceTrickle({
          ...data,
          sessionId: this.sessionId,
        }),
      this.logger,
    );
  };

  iceRestart = async (data: Omit<ICERestartRequest, 'sessionId'>) => {
    await this.joinResponseTask.promise;
    return retryable(
      () =>
        this.rpc.iceRestart({
          ...data,
          sessionId: this.sessionId,
        }),
      this.logger,
    );
  };

  updateMuteState = async (trackType: TrackType, muted: boolean) => {
    await this.joinResponseTask.promise;
    return this.updateMuteStates({
      muteStates: [
        {
          trackType,
          muted,
        },
      ],
    });
  };

  updateMuteStates = async (
    data: Omit<UpdateMuteStatesRequest, 'sessionId'>,
  ) => {
    await this.joinResponseTask.promise;
    return retryable(
      () =>
        this.rpc.updateMuteStates({
          ...data,
          sessionId: this.sessionId,
        }),
      this.logger,
    );
  };

  sendStats = async (stats: Omit<SendStatsRequest, 'sessionId'>) => {
    await this.joinResponseTask.promise;
    return retryable(
      () =>
        this.rpc.sendStats({
          ...stats,
          sessionId: this.sessionId,
        }),
      this.logger,
      'debug',
    );
  };

  startNoiseCancellation = async () => {
    await this.joinResponseTask.promise;
    return retryable(
      () =>
        this.rpc.startNoiseCancellation({
          sessionId: this.sessionId,
        }),
      this.logger,
    );
  };

  stopNoiseCancellation = async () => {
    await this.joinResponseTask.promise;
    return retryable(
      () =>
        this.rpc.stopNoiseCancellation({
          sessionId: this.sessionId,
        }),
      this.logger,
    );
  };

  enterMigration = (opts: {
    onComplete: (isSuccessful: boolean) => void;
    timeout?: number;
  }) => {
    this.isClosing = true;

    const { onComplete, timeout = 2500 } = opts;
    const unsubscribe = this.dispatcher.on(
      'participantMigrationComplete',
      () => {
        unsubscribe();
        clearTimeout(this.migrateAwayTimeout);
        onComplete(true);
      },
    );
    this.migrateAwayTimeout = setTimeout(() => {
      unsubscribe();
      onComplete(false);
    }, timeout);
  };

  join = async (
    data: Omit<JoinRequest, 'sessionId' | 'token'>,
  ): Promise<JoinResponse> => {
    if (this.joinResponseTask.isResolved || this.joinResponseTask.isRejected) {
      // we need to lock the RPC requests until we receive a JoinResponse.
      // that's why we have this primitive lock mechanism.
      // the client starts with already initialized joinResponseReady promise,
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
            token: this.token,
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

  send = async (message: SfuRequest) => {
    return this.signalReady.then((signal) => {
      if (signal.readyState !== signal.OPEN) return;
      this.logger(
        'debug',
        `Sending message to: ${this.edgeName}`,
        SfuRequest.toJson(message),
      );
      signal.send(SfuRequest.toBinary(message));
    });
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

/**
 * An internal interface which asserts that "retryable" SFU responses
 * contain a field called "error".
 * Ideally, this should be coming from the Protobuf definitions.
 */
interface SfuResponseWithError {
  /**
   * An optional error field which should be present in all SFU responses.
   */
  error?: SfuError;
}

const MAX_RETRIES = 5;

/**
 * Creates a closure which wraps the given RPC call and retries invoking
 * the RPC until it succeeds or the maximum number of retries is reached.
 *
 * Between each retry, there would be a random delay in order to avoid
 * request bursts towards the SFU.
 *
 * @param rpc the closure around the RPC call to execute.
 * @param logger a logger instance to use.
 * @param level the log level to use.
 * @param <I> the type of the request object.
 * @param <O> the type of the response object.
 */
const retryable = async <I extends object, O extends SfuResponseWithError>(
  rpc: () => UnaryCall<I, O>,
  logger: Logger,
  level: LogLevel = 'warn',
) => {
  let retryAttempt = 0;
  let rpcCallResult: FinishedUnaryCall<I, O>;
  do {
    // don't delay the first invocation
    if (retryAttempt > 0) {
      await sleep(retryInterval(retryAttempt));
    }

    rpcCallResult = await rpc();

    // if the RPC call failed, log the error and retry
    if (rpcCallResult.response.error) {
      logger(
        level,
        `SFU RPC Error (${rpcCallResult.method.name}):`,
        rpcCallResult.response.error,
      );
    }
    retryAttempt++;
  } while (
    rpcCallResult.response.error?.shouldRetry &&
    retryAttempt < MAX_RETRIES
  );

  if (rpcCallResult.response.error) {
    throw rpcCallResult.response.error;
  }

  return rpcCallResult;
};

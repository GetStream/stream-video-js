import type { WebSocket } from 'ws';
import type {
  FinishedUnaryCall,
  MethodInfo,
  NextUnaryFn,
  RpcInterceptor,
  RpcOptions,
  UnaryCall,
} from '@protobuf-ts/runtime-rpc';
import { SignalServerClient } from './gen/video/sfu/signal_rpc/signal.client';
import { createSignalClient, withHeaders } from './rpc';
import {
  createWebSocketSignalChannel,
  Dispatcher,
  IceTrickleBuffer,
} from './rtc';
import { JoinRequest, SfuRequest } from './gen/video/sfu/event/events';
import {
  SendAnswerRequest,
  SetPublisherRequest,
  TrackSubscriptionDetails,
  UpdateMuteStatesRequest,
} from './gen/video/sfu/signal_rpc/signal';
import {
  Error as SfuError,
  ICETrickle,
  TrackType,
} from './gen/video/sfu/models/models';
import {
  generateUUIDv4,
  retryInterval,
  sleep,
} from './coordinator/connection/utils';
import { SFUResponse } from './gen/coordinator';
import { Logger } from './coordinator/connection/types';
import { getLogger } from './logger';

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
   * An optional `sessionId` to use for the connection.
   * If not provided, a random UUIDv4 will be generated.
   */
  sessionId?: string;
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

  /**
   * A flag indicating whether the client is currently migrating away
   * from this SFU.
   */
  isMigratingAway = false;

  private readonly rpc: SignalServerClient;
  private keepAliveInterval?: NodeJS.Timeout;
  private connectionCheckTimeout?: NodeJS.Timeout;
  private pingIntervalInMs = 25 * 1000;
  private unhealthyTimeoutInMs = this.pingIntervalInMs + 5 * 1000;
  private lastMessageTimestamp?: Date;
  private readonly unsubscribeIceTrickle: () => void;
  private readonly logger: Logger;

  /**
   * Constructs a new SFU client.
   *
   * @param dispatcher the event dispatcher to use.
   * @param sfuServer the SFU server to connect to.
   * @param token the JWT token to use for authentication.
   * @param sessionId the `sessionId` of the currently connected participant.
   */
  constructor({
    dispatcher,
    sfuServer,
    token,
    sessionId,
  }: StreamSfuClientConstructor) {
    this.sessionId = sessionId || generateUUIDv4();
    this.sfuServer = sfuServer;
    this.edgeName = sfuServer.edge_name;
    this.token = token;
    this.logger = getLogger(['sfu-client']);
    const logger = this.logger;
    const logInterceptor: RpcInterceptor = {
      interceptUnary(
        next: NextUnaryFn,
        method: MethodInfo,
        input: object,
        options: RpcOptions,
      ): UnaryCall {
        logger('trace', `Calling SFU RPC method ${method.name}`, {
          input,
          options,
        });
        return next(method, input, options);
      },
    };
    this.rpc = createSignalClient({
      baseUrl: sfuServer.url,
      interceptors: [
        withHeaders({
          Authorization: `Bearer ${token}`,
        }),
        logInterceptor,
      ],
    });

    // Special handling for the ICETrickle kind of events.
    // These events might be triggered by the SFU before the initial RTC
    // connection is established. In that case, those events (ICE candidates)
    // need to be buffered and later added to the appropriate PeerConnection
    // once the remoteDescription is known and set.
    this.unsubscribeIceTrickle = dispatcher.on('iceTrickle', (e) => {
      if (e.eventPayload.oneofKind !== 'iceTrickle') return;
      const { iceTrickle } = e.eventPayload;
      this.iceTrickleBuffer.push(iceTrickle);
    });

    this.signalWs = createWebSocketSignalChannel({
      endpoint: sfuServer.ws_endpoint,
      onMessage: (message) => {
        this.lastMessageTimestamp = new Date();
        this.scheduleConnectionCheck();
        dispatcher.dispatch(message);
      },
    });

    this.signalReady = new Promise((resolve) => {
      const onOpen = () => {
        this.signalWs.removeEventListener('open', onOpen);
        this.keepAlive();
        resolve(this.signalWs);
      };
      this.signalWs.addEventListener('open', onOpen);
    });
  }

  close = (
    code: number = 1000,
    reason: string = 'Requested signal connection close',
  ) => {
    this.signalWs.close(code, reason);

    this.unsubscribeIceTrickle();
    clearInterval(this.keepAliveInterval);
    clearTimeout(this.connectionCheckTimeout);
  };

  updateSubscriptions = async (subscriptions: TrackSubscriptionDetails[]) => {
    return retryable(
      () =>
        this.rpc.updateSubscriptions({
          sessionId: this.sessionId,
          tracks: subscriptions,
        }),
      this.logger,
    );
  };

  setPublisher = async (data: Omit<SetPublisherRequest, 'sessionId'>) => {
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
    return retryable(
      () =>
        this.rpc.iceTrickle({
          ...data,
          sessionId: this.sessionId,
        }),
      this.logger,
    );
  };

  updateMuteState = async (trackType: TrackType, muted: boolean) => {
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
    return retryable(
      () =>
        this.rpc.updateMuteStates({
          ...data,
          sessionId: this.sessionId,
        }),
      this.logger,
    );
  };

  join = async (data: Omit<JoinRequest, 'sessionId' | 'token'>) => {
    const joinRequest = JoinRequest.create({
      ...data,
      sessionId: this.sessionId,
      token: this.token,
    });
    return this.send(
      SfuRequest.create({
        requestPayload: {
          oneofKind: 'joinRequest',
          joinRequest,
        },
      }),
    );
  };

  send = (message: SfuRequest) => {
    return this.signalReady.then((signal) => {
      this.logger(
        'debug',
        `Sending message to: ${this.edgeName}`,
        SfuRequest.toJson(message),
      );
      signal.send(SfuRequest.toBinary(message));
    });
  };

  private keepAlive = () => {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }
    this.keepAliveInterval = setInterval(() => {
      this.logger('trace', 'Sending healthCheckRequest to SFU');
      const message = SfuRequest.create({
        requestPayload: {
          oneofKind: 'healthCheckRequest',
          healthCheckRequest: {},
        },
      });
      void this.send(message);
    }, this.pingIntervalInMs);
  };

  private scheduleConnectionCheck = () => {
    if (this.connectionCheckTimeout) {
      clearTimeout(this.connectionCheckTimeout);
    }

    this.connectionCheckTimeout = setTimeout(() => {
      if (this.lastMessageTimestamp) {
        const timeSinceLastMessage =
          new Date().getTime() - this.lastMessageTimestamp.getTime();

        if (timeSinceLastMessage > this.unhealthyTimeoutInMs) {
          this.logger('error', 'SFU connection unhealthy, closing');
          this.close(
            4001,
            `SFU connection unhealthy. Didn't receive any healthcheck messages for ${this.unhealthyTimeoutInMs}ms`,
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
 * @param <I> the type of the request object.
 * @param <O> the type of the response object.
 */
const retryable = async <I extends object, O extends SfuResponseWithError>(
  rpc: () => UnaryCall<I, O>,
  logger: Logger,
) => {
  let retryAttempt = 0;
  let rpcCallResult: FinishedUnaryCall<I, O>;
  do {
    // don't delay the first invocation
    if (retryAttempt > 0) {
      await sleep(retryInterval(retryAttempt));
    }

    rpcCallResult = await rpc();
    logger(
      'trace',
      `SFU RPC response received for ${rpcCallResult.method.name}`,
      rpcCallResult,
    );

    // if the RPC call failed, log the error and retry
    if (rpcCallResult.response.error) {
      logger('error', 'SFU RPC Error:', rpcCallResult.response.error);
    }
    retryAttempt++;
  } while (
    rpcCallResult.response.error?.shouldRetry &&
    retryAttempt < MAX_RETRIES
  );

  return rpcCallResult;
};

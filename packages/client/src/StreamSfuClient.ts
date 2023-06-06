import type { FinishedUnaryCall, UnaryCall } from '@protobuf-ts/runtime-rpc';
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

export type StreamSfuClientConstructor = {
  /**
   * The event dispatcher instance to use.
   */
  dispatcher: Dispatcher;

  /**
   * The URL of the SFU to connect to.
   */
  url: string;

  /**
   * The WebSocket endpoint of the SFU to connect to.
   */
  wsEndpoint: string;

  /**
   * The JWT token to use for authentication.
   */
  token: string;

  /**
   * An optional `sessionId` to use for the connection.
   * If not provided, a random UUIDv4 will be generated.
   */
  sessionId?: string;

  /**
   * An optional `edgeName` representing the edge the client is connected to.
   */
  edgeName?: string;
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
   * Holds the current WebSocket connection to the SFU.
   */
  signalWs: WebSocket;

  /**
   * Promise that resolves when the WebSocket connection is ready (open).
   */
  signalReady: Promise<WebSocket>;

  private readonly rpc: SignalServerClient;
  private readonly token: string;
  private keepAliveInterval?: NodeJS.Timeout;
  private connectionCheckTimeout?: NodeJS.Timeout;
  private pingIntervalInMs = 25 * 1000;
  private unhealthyTimeoutInMs = this.pingIntervalInMs + 5 * 1000;
  private lastMessageTimestamp?: Date;
  private readonly unsubscribeIceTrickle: () => void;

  /**
   * Constructs a new SFU client.
   *
   * @param dispatcher the event dispatcher to use.
   * @param url the URL of the SFU.
   * @param wsEndpoint the WebSocket endpoint of the SFU.
   * @param token the JWT token to use for authentication.
   * @param sessionId the `sessionId` of the currently connected participant.
   * @param edgeName the `edgeName` representing the edge the client is connected to.
   */
  constructor({
    dispatcher,
    url,
    wsEndpoint,
    token,
    sessionId,
    edgeName,
  }: StreamSfuClientConstructor) {
    this.sessionId = sessionId || generateUUIDv4();
    this.edgeName = edgeName || 'N/A';
    this.token = token;
    this.rpc = createSignalClient({
      baseUrl: url,
      interceptors: [
        withHeaders({
          Authorization: `Bearer ${token}`,
        }),
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
      endpoint: wsEndpoint,
      onMessage: (message) => {
        this.lastMessageTimestamp = new Date();
        this.scheduleConnectionCheck();
        dispatcher.dispatch(message);
      },
    });

    this.signalReady = new Promise((resolve) => {
      this.signalWs.addEventListener('open', () => {
        this.keepAlive();
        resolve(this.signalWs);
      });
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
    return retryable(() =>
      this.rpc.updateSubscriptions({
        sessionId: this.sessionId,
        tracks: subscriptions,
      }),
    );
  };

  setPublisher = async (data: Omit<SetPublisherRequest, 'sessionId'>) => {
    return retryable(() =>
      this.rpc.setPublisher({
        ...data,
        sessionId: this.sessionId,
      }),
    );
  };

  sendAnswer = async (data: Omit<SendAnswerRequest, 'sessionId'>) => {
    return retryable(() =>
      this.rpc.sendAnswer({
        ...data,
        sessionId: this.sessionId,
      }),
    );
  };

  iceTrickle = async (data: Omit<ICETrickle, 'sessionId'>) => {
    return retryable(() =>
      this.rpc.iceTrickle({
        ...data,
        sessionId: this.sessionId,
      }),
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
    return retryable(() =>
      this.rpc.updateMuteStates({
        ...data,
        sessionId: this.sessionId,
      }),
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
      console.log(
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
      console.log('Sending healthCheckRequest to SFU');
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
          console.log('SFU connection unhealthy, closing');
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
 * @param <I> the type of the request object.
 * @param <O> the type of the response object.
 */
const retryable = async <I extends object, O extends SfuResponseWithError>(
  rpc: () => UnaryCall<I, O>,
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
      console.error('SFU Error:', rpcCallResult.response.error);
    }
    retryAttempt++;
  } while (
    rpcCallResult.response.error?.shouldRetry &&
    retryAttempt < MAX_RETRIES
  );

  return rpcCallResult;
};

import {
  StreamVideoWriteableStateStore,
  StreamVideoReadOnlyStateStore,
} from './stateStore';
import type { Call as CallMeta } from './gen/video/coordinator/call_v1/call';
import type {
  CreateCallRequest,
  GetOrCreateCallRequest,
  JoinCallRequest,
  ReportCallStatEventRequest,
  ReportCallStatEventResponse,
  ReportCallStatsRequest,
  ReportCallStatsResponse,
} from './gen/video/coordinator/client_v1_rpc/client_rpc';
import { ClientRPCClient } from './gen/video/coordinator/client_v1_rpc/client_rpc.client';
import { UserEventType } from './gen/video/coordinator/client_v1_rpc/client_rpc';
import type {
  Edge,
  ICEServer,
  Latency,
} from './gen/video/coordinator/edge_v1/edge';
import type { UserInput } from './gen/video/coordinator/user_v1/user';
import {
  createCoordinatorClient,
  measureResourceLoadLatencyTo,
  StreamVideoClientOptions,
  withHeaders,
} from './rpc';
import {
  createSocketConnection,
  StreamEventListener,
  StreamWSClient,
} from './ws';
import { StreamSfuClient } from './StreamSfuClient';
import { Call } from './rtc/Call';
import { registerWSEventHandlers } from './ws/callUserEventHandlers';
import {
  WebsocketClientEvent,
  WebsocketHealthcheck,
} from './gen/video/coordinator/client_v1_rpc/websocket';

const defaultOptions: Partial<StreamVideoClientOptions> = {
  coordinatorRpcUrl:
    'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc',
  coordinatorWsUrl:
    'wss://wss-video-coordinator.oregon-v1.stream-io-video.com/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
  sendJson: false,
  latencyMeasurementRounds: 3,
};

/**
 * A `StreamVideoClient` instance lets you communicate with our API, and sign in with the current user.
 */
export class StreamVideoClient {
  /**
   * A reactive store that exposes the state variables in a reactive manner - you can subscribe to changes of the different state variables.
   * @angular If you're using our Angular SDK, you shouldn't be interacting with the state store directly, instead, you should be using the [`StreamVideoService`](./StreamVideoService.md).
   */
  readonly readOnlyStateStore: StreamVideoReadOnlyStateStore;
  // Make it public temporary to ease SDK transition
  readonly writeableStateStore: StreamVideoWriteableStateStore;
  private client: ClientRPCClient;
  private options: StreamVideoClientOptions;
  private ws: StreamWSClient | undefined;

  /**
   * You should create only one instance of `StreamVideoClient`.
   * @angular If you're using our Angular SDK, you shouldn't be calling the `constructor` directly, instead you should be using [`StreamVideoClient` service](./StreamVideoClient.md).
   * @param apiKey your Stream API key
   * @param opts
   */
  constructor(apiKey: string, opts: StreamVideoClientOptions) {
    const options = {
      ...defaultOptions,
      ...opts,
    };
    this.options = options;
    const { token } = options;
    const authToken = typeof token === 'function' ? token() : token;
    this.client = createCoordinatorClient({
      baseUrl: options.coordinatorRpcUrl || '/',
      sendJson: options.sendJson,
      interceptors: [
        withHeaders({
          api_key: apiKey,
          Authorization: `Bearer ${authToken}`,
        }),
      ],
    });
    this.writeableStateStore = new StreamVideoWriteableStateStore();
    this.readOnlyStateStore = new StreamVideoReadOnlyStateStore(
      this.writeableStateStore,
    );
  }

  /**
   * Connects the given user to the client.
   * Only one user can connect at a time, if you want to change users, call `disconnect` before connecting a new user.
   * @param apiKey
   * @param token
   * @param user
   * @returns
   */
  connect = async (apiKey: string, token: string, user: UserInput) => {
    if (this.ws) return;
    this.ws = await createSocketConnection(
      this.options.coordinatorWsUrl!,
      apiKey,
      token,
      user,
    );
    if (this.ws) {
      registerWSEventHandlers(this, this.writeableStateStore);
    }
    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.connectedUserSubject,
      user,
    );
  };

  /**
   * Disconnects the currently connected user from the client.
   * @returns
   */
  disconnect = async () => {
    if (!this.ws) return;
    this.ws.disconnect();
    this.ws = undefined;
    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.connectedUserSubject,
      undefined,
    );
  };

  /**
   * You can subscribe to WebSocket events provided by the API. To remove a subscription, call the `off` method.
   * Please note that subscribing to WebSocket events is an advanced use-case, for most use-cases it should be enough to watch for changes in the reactive state store.
   * @param event
   * @param fn
   * @returns
   */
  on = <T>(event: string, fn: StreamEventListener<T>) => {
    return this.ws?.on(event, fn);
  };

  /**
   * Remove subscription for WebSocket events that were created by the `on` method.
   * @param event
   * @param fn
   * @returns
   */
  off = <T>(event: string, fn: StreamEventListener<T>) => {
    return this.ws?.off(event, fn);
  };

  /**
   *
   * @param hc
   *
   * @deprecated We should move this functionality inside the client and make this an internal function.
   */
  setHealthcheckPayload = (hc: WebsocketHealthcheck) => {
    this.ws?.keepAlive.setPayload(
      WebsocketClientEvent.toBinary({
        event: {
          oneofKind: 'healthcheck',
          healthcheck: hc,
        },
      }),
    );
  };

  /**
   * Allows you to create new calls with the given parameters. If a call with the same combination of type and id already exists, it will return the existing call.
   * @param data
   * @returns A call metadata with information about the call.
   */
  getOrCreateCall = async (data: GetOrCreateCallRequest) => {
    const { response } = await this.client.getOrCreateCall(data);
    if (response.call) {
      return response.call;
    } else {
      // TODO: handle error?
      return undefined;
    }
  };

  /**
   * Allows you to create new calls with the given parameters. If a call with the same combination of type and id already exists, this will return an error.
   * @param data
   * @returns A call metadata with information about the call.
   */
  createCall = async (data: CreateCallRequest) => {
    const callToCreate = await this.client.createCall(data);
    const { call: callEnvelope } = callToCreate.response;
    return callEnvelope;
  };

  acceptCall = async (callCid: string) => {
    await this.client.sendEvent({
      callCid,
      eventType: UserEventType.ACCEPTED_CALL,
    });
  };

  rejectCall = async (callCid: string) => {
    await this.client.sendEvent({
      callCid,
      eventType: UserEventType.REJECTED_CALL,
    });
  };

  cancelCall = async (callCid: string) => {
    await this.client.sendEvent({
      callCid,
      eventType: UserEventType.CANCELLED_CALL,
    });
  };

  /**
   * Allows you to create a new call with the given parameters and joins the call immediately. If a call with the same combination of type and id already exists, it will join the existing call.
   * @param data
   * @param sessionId
   * @returns A [`Call`](./Call.md) instance that can be used to interact with the call.
   */
  joinCall = async (data: JoinCallRequest, sessionId?: string) => {
    const { response } = await this.client.joinCall(data);
    if (response.call && response.call.call && response.edges) {
      const edge = await this.getCallEdgeServer(
        response.call.call,
        response.edges,
      );
      if (data.input?.ring) {
        this.writeableStateStore.setCurrentValue(
          this.writeableStateStore.activeRingCallMetaSubject,
          response.call.call,
        );
        this.writeableStateStore.setCurrentValue(
          this.writeableStateStore.activeRingCallDetailsSubject,
          response.call.details,
        );
      }
      if (edge && edge.credentials && edge.credentials.server) {
        const sfuClient = new StreamSfuClient(
          edge.credentials.server.url,
          edge.credentials.token,
          sessionId,
        );
        const call = new Call(
          sfuClient,
          {
            connectionConfig:
              this.toRtcConfiguration(edge.credentials.iceServers) ||
              this.defaultRtcConfiguration(edge.credentials.server.url),
          },
          this.writeableStateStore,
        );
        return call;
      } else {
        // TODO: handle error?
        return undefined;
      }
    } else {
      // TODO: handle error?
      return undefined;
    }
  };

  startRecording = async (callId: string, callType: string) => {
    await this.client.startRecording({
      callId,
      callType,
    });

    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.callRecordingInProgressSubject,
      true,
    );
  };

  stopRecording = async (callId: string, callType: string) => {
    await this.client.stopRecording({
      callId,
      callType,
    });

    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.callRecordingInProgressSubject,
      false,
    );
  };

  /**
   * We should make this an internal method, SDKs shouldn't need this.
   * @param stats
   * @returns
   */
  reportCallStats = async (
    stats: ReportCallStatsRequest,
  ): Promise<ReportCallStatsResponse> => {
    const response = await this.client.reportCallStats(stats);
    return response.response;
  };

  private getCallEdgeServer = async (call: CallMeta, edges: Edge[]) => {
    const latencyByEdge: { [e: string]: Latency } = {};
    await Promise.all(
      edges.map(async (edge) => {
        latencyByEdge[edge.name] = {
          measurementsSeconds: await measureResourceLoadLatencyTo(
            edge.latencyUrl,
            Math.max(this.options.latencyMeasurementRounds || 0, 3),
          ),
        };
      }),
    );

    const edgeServer = await this.client.getCallEdgeServer({
      callCid: call.callCid,
      // TODO: OL: check the double wrapping
      measurements: {
        measurements: latencyByEdge,
      },
    });

    return edgeServer.response;
  };

  private toRtcConfiguration = (config?: ICEServer[]) => {
    if (!config || config.length === 0) return undefined;
    const rtcConfig: RTCConfiguration = {
      iceServers: config.map((ice) => ({
        urls: ice.urls,
        username: ice.username,
        credential: ice.password,
      })),
    };
    return rtcConfig;
  };

  private defaultRtcConfiguration = (sfuUrl: string): RTCConfiguration => ({
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
      {
        urls: `turn:${this.hostnameFromUrl(sfuUrl)}:3478`,
        username: 'video',
        credential: 'video',
      },
    ],
  });

  private hostnameFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      console.warn(`Invalid URL. Can't extract hostname from it.`, e);
      return url;
    }
  };

  reportCallStatEvent = async (
    statEvent: ReportCallStatEventRequest,
  ): Promise<ReportCallStatEventResponse> => {
    const response = await this.client.reportCallStatEvent(statEvent);
    return response.response;
  };
}

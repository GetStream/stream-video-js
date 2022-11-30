import {
  StreamVideoReadableStateStore2,
  StreamVideoWriteableStateStore2,
  StreamVideoReadOnlyStateStore,
  StreamVideoWriteableStateStore,
} from './store';
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
import { UserEventType } from './gen/video/coordinator/client_v1_rpc/client_rpc';
import { ClientRPCClient } from './gen/video/coordinator/client_v1_rpc/client_rpc.client';
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
import {
  WebsocketClientEvent,
  WebsocketHealthcheck,
} from './gen/video/coordinator/client_v1_rpc/websocket';
import {
  CallAccepted,
  CallCancelled,
  CallCreated,
  CallRejected,
} from './gen/video/coordinator/event_v1/event';

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
  readonly readOnlyStateStore2: StreamVideoReadableStateStore2;
  // Make it public temporary to ease SDK transition
  readonly writeableStateStore: StreamVideoWriteableStateStore;
  private writeableStateStore2: StreamVideoWriteableStateStore2;
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
    this.writeableStateStore2 = new StreamVideoWriteableStateStore2();
    this.readOnlyStateStore2 = new StreamVideoReadableStateStore2(
      this.writeableStateStore2,
    );

    this.writeableStateStore = new StreamVideoWriteableStateStore();
    this.readOnlyStateStore = this.writeableStateStore.asReadOnlyStore();
  }

  /**
   * Connects the given user to the client.
   * Only one user can connect at a time, if you want to change users, call `disconnect` before connecting a new user.
   * If the connection is successful, the connected user state variable will be updated accordingly.
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
      this.registerWSEventHandlers();
    }
    this.writeableStateStore2.setCurrentValue(
      this.writeableStateStore.connectedUserSubject,
      user,
    );
    // todo: MC: remove stateStore
    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.connectedUserSubject,
      user,
    );
  };

  /**
   * Disconnects the currently connected user from the client.
   *
   * If the connection is successfully disconnected, the connected user state variable will be updated accordingly
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

  registerWSEventHandlers = () => {
    this.on('callCreated', this.onCallCreated);
    this.on('callAccepted', this.onCallAccepted);
    this.on('callRejected', this.onCallRejected);
    this.on('callCancelled', this.onCallCancelled);
  };

  /**
   * Allows you to create new calls with the given parameters. If a call with the same combination of type and id already exists, this will return an error.
   * Causes the CallCreated event to be emitted to all the call members.
   * @param data CreateCallRequest payload object
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

  createCall = async (data: CreateCallRequest) => {
    const callToCreate = await this.client.createCall(data);
    const { call: callEnvelope } = callToCreate.response;
    return callEnvelope;
  };

  /**
   * Event handler invoked upon delivery of CallCreated Websocket event
   * Updates the state store and notifies its subscribers that
   * a new pending call has been initiated.
   * @param event received CallCreated Websocket event
   * @returns
   */
  onCallCreated = (event: CallCreated) => {
    const { call } = event;
    if (!call) {
      console.warn("Can't find call in CallCreated event");
      return;
    }

    this.writeableStateStore2.addCall(
      this.writeableStateStore2.pendingCallsSubject,
      event,
    );
  };

  /**
   * Signals other users that I have accepted the incoming call.
   * Causes the CallAccepted event to be emitted to all the call members.
   * @param callCid config ID of the rejected call
   * @returns
   */
  acceptCall = async (callCid: string) => {
    await this.client.sendEvent({
      callCid,
      eventType: UserEventType.ACCEPTED_CALL,
    });
  };

  /**
   * Event handler invoked upon delivery of CallAccepted Websocket event
   * Updates the state store and notifies its subscribers that
   * the call is now considered active.
   * @param event received CallAccepted Websocket event
   * @returns
   */
  onCallAccepted = (event: CallAccepted) => {
    const { call } = event;
    if (!call) {
      console.warn("Can't find call in CallCreated event");
      return;
    }
    this.writeableStateStore2.setCurrentValue(
      this.writeableStateStore2.activeCallSubject,
      { data: event },
    );
    this.writeableStateStore2.removeCall(
      this.writeableStateStore2.pendingCallsSubject,
      event,
    );
  };

  /**
   * Signals other users that I have rejected the incoming call.
   * Causes the CallRejected event to be emitted to all the call members.
   * @param callCid config ID of the rejected call
   * @returns
   */
  rejectCall = async (callCid: string) => {
    await this.client.sendEvent({
      callCid,
      eventType: UserEventType.REJECTED_CALL,
    });
  };

  /**
   * Event handler invoked upon delivery of CallRejected Websocket event.
   * Updates the state store and notifies its subscribers that
   * the call is now considered terminated.
   * @param event received CallRejected Websocket event
   * @returns
   */
  onCallRejected = (event: CallRejected) => {
    const { call } = event;
    if (!call) {
      console.warn("Can't find call in CallRejected event");
      return;
    }
    this.writeableStateStore2.removeCall(
      this.writeableStateStore2.pendingCallsSubject,
      event,
    );
  };

  /**
   * Signals other users that I have cancelled my call to them before they accepted it.
   * Causes the CallCancelled event to be emitted to all the call members.
   * @param callCid config ID of the cancelled call
   * @returns
   */
  cancelCall = async (callCid: string) => {
    await this.client.sendEvent({
      callCid,
      eventType: UserEventType.CANCELLED_CALL,
    });
  };

  /**
   * Event handler invoked upon delivery of CallCancelled Websocket event
   * Updates the state store and notifies its subscribers that
   * the call is now considered terminated.
   * @param event received CallCancelled Websocket event
   * @returns
   */
  onCallCancelled = (event: CallCancelled) => {
    const { call } = event;
    if (!call) {
      console.log("Can't find call in CallCancelled event");
      return;
    }
    this.writeableStateStore2.removeCall(
      this.writeableStateStore2.pendingCallsSubject,
      event,
    );
  };

  /**
   * Allows you to create a new call with the given parameters and joins the call immediately. If a call with the same combination of `type` and `id` already exists, it will join the existing call.
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
      // todo: MC: remove stateStore
      // if (data.input?.ring) {
      //   this.writeableStateStore.setCurrentValue(
      //     this.writeableStateStore.activeRingCallMetaSubject,
      //     response.call.call,
      //   );
      //   this.writeableStateStore.setCurrentValue(
      //     this.writeableStateStore.activeRingCallDetailsSubject,
      //     response.call.details,
      //   );
      // }
      if (edge.credentials && edge.credentials.server) {
        const edgeName = edge.credentials.server.edgeName;
        const selectedEdge = response.edges.find((e) => e.name === edgeName);
        const { server, iceServers, token } = edge.credentials;
        const sfuClient = new StreamSfuClient(server.url, token, sessionId);
        const callController = new Call(
          response.call.call.id,
          sfuClient,
          {
            connectionConfig:
              this.toRtcConfiguration(iceServers) ||
              this.defaultRtcConfiguration(server.url),
            latencyCheckUrl: selectedEdge?.latencyUrl,
            edgeName,
          },
          // todo: MC: remove stateStore
          this.writeableStateStore,
          this.writeableStateStore2,
        );
        await callController.join();
        return callController;
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

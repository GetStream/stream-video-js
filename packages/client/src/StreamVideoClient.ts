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

const defaultOptions: Partial<StreamVideoClientOptions> = {
  coordinatorRpcUrl:
    'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc',
  coordinatorWsUrl:
    'wss://wss-video-coordinator.oregon-v1.stream-io-video.com/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
  sendJson: false,
  latencyMeasurementRounds: 3,
};

/**
 * Document me
 */
export class StreamVideoClient {
  readonly readOnlyStateStore: StreamVideoReadOnlyStateStore;
  // Make it public temporary to ease SDK transition
  readonly writeableStateStore: StreamVideoWriteableStateStore;
  private client: ClientRPCClient;
  private options: StreamVideoClientOptions;
  private ws: StreamWSClient | undefined;

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
    this.readOnlyStateStore = this.writeableStateStore.asReadOnlyStore();
  }

  /**
   * Connects the given user to the video client
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
    this.writeableStateStore.connectedUserSubject.next(user);
  };

  disconnect = async () => {
    if (!this.ws) return;
    this.ws.disconnect();
    this.ws = undefined;
    this.writeableStateStore.connectedUserSubject.next(undefined);
  };

  on = <T>(event: string, fn: StreamEventListener<T>) => {
    return this.ws?.on(event, fn);
  };

  off = <T>(event: string, fn: StreamEventListener<T>) => {
    return this.ws?.off(event, fn);
  };

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

  joinCall = async (data: JoinCallRequest, sessionId?: string) => {
    const { response } = await this.client.joinCall(data);
    if (response.call && response.call.call && response.edges) {
      const edge = await this.getCallEdgeServer(
        response.call.call,
        response.edges,
      );
      if (edge.credentials && edge.credentials.server) {
        const edgeName = edge.credentials.server.edgeName;
        const selectedEdge = response.edges.find((e) => e.name === edgeName);
        const { server, iceServers, token } = edge.credentials;
        const sfuClient = new StreamSfuClient(server.url, token, sessionId);
        const call = new Call(
          sfuClient,
          {
            connectionConfig:
              this.toRtcConfiguration(iceServers) ||
              this.defaultRtcConfiguration(server.url),
            latencyCheckUrl: selectedEdge?.latencyUrl,
            edgeName,
          },
          this.writeableStateStore,
        );
        this.writeableStateStore.pendingCallsSubject.next([
          ...this.writeableStateStore.pendingCallsSubject.getValue(),
          call,
        ]);
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

import type { Call } from './gen/video/coordinator/call_v1/call';
import type {
  CreateCallRequest,
  GetOrCreateCallRequest,
  JoinCallRequest,
  ReportCallStatsRequest,
  ReportCallStatsResponse,
} from './gen/video/coordinator/client_v1_rpc/client_rpc';
import { ClientRPCClient } from './gen/video/coordinator/client_v1_rpc/client_rpc.client';
import type { Edge, Latency } from './gen/video/coordinator/edge_v1/edge';
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

const defaultOptions: Partial<StreamVideoClientOptions> = {
  coordinatorRpcUrl:
    'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc',
  coordinatorWsUrl:
    'ws://wss-video-coordinator.oregon-v1.stream-io-video.com:8989/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
  sendJson: false,
  latencyMeasurementRounds: 3,
};

export class StreamVideoClient {
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
  }

  connect = async (apiKey: string, token: string, user: UserInput) => {
    if (this.ws) return;
    this.ws = await createSocketConnection(
      this.options.coordinatorWsUrl!,
      apiKey,
      token,
      user,
    );
  };

  disconnect = async () => {
    if (!this.ws) return;
    this.ws.disconnect();
    this.ws = undefined;
  };

  on = <T>(event: string, fn: StreamEventListener<T>) => {
    return this.ws?.on(event, fn);
  };

  off = <T>(event: string, fn: StreamEventListener<T>) => {
    return this.ws?.off(event, fn);
  };

  setHealthcheckPayload = (payload: Uint8Array) => {
    this.ws?.keepAlive.setPayload(payload);
  };

  getOrCreateCall = async (data: GetOrCreateCallRequest) => {
    const call = await this.client.getOrCreateCall(data);
    return call.response;
  };

  createCall = async (data: CreateCallRequest) => {
    const callToCreate = await this.client.createCall(data);
    const { call: callEnvelope } = callToCreate.response;
    return callEnvelope;
  };

  joinCall = async (data: JoinCallRequest) => {
    const callToJoin = await this.client.joinCall(data);
    return callToJoin.response;
  };

  getCallEdgeServer = async (call: Call, edges: Edge[]) => {
    // TODO: maybe run the measurements in parallel
    const latencyByEdge: { [e: string]: Latency } = {};
    for (const edge of edges) {
      latencyByEdge[edge.name] = {
        measurementsSeconds: await measureResourceLoadLatencyTo(
          edge.latencyUrl,
          Math.max(this.options.latencyMeasurementRounds || 0, 3),
        ),
      };
    }

    const edgeServer = await this.client.getCallEdgeServer({
      callCid: call.callCid,
      // TODO: OL: check the double wrapping
      measurements: {
        measurements: latencyByEdge,
      },
    });

    return edgeServer.response;
  };

  reportCallStats = async (
    stats: ReportCallStatsRequest,
  ): Promise<ReportCallStatsResponse> => {
    const response = await this.client.reportCallStats(stats);
    return response.response;
  };
}

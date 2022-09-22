import { Call } from './gen/video/coordinator/call_v1/call';
import {
  CreateCallRequest,
  JoinCallRequest,
  ReportCallStatsRequest,
  ReportCallStatsResponse,
  SendCustomEventRequest,
} from './gen/video/coordinator/client_v1_rpc/client_rpc';
import { ClientRPCClient } from './gen/video/coordinator/client_v1_rpc/client_rpc.client';
import {
  Latency,
  LatencyMeasurementClaim,
} from './gen/video/coordinator/edge_v1/edge';
import { UserInput } from './gen/video/coordinator/user_v1/user';
import {
  createClient,
  measureResourceLoadLatencyTo,
  StreamVideoClientOptions,
  withAuth,
} from './rpc';
import {
  createSocketConnection,
  StreamEventListener,
  StreamWSClient,
} from './ws';

const defaultOptions: Partial<StreamVideoClientOptions> = {
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
    this.client = createClient({
      baseUrl: options.baseUrl || '/',
      sendJson: options.sendJson,
      interceptors: [withAuth(apiKey, authToken)],
    });
  }

  connect = async (apiKey: string, token: string, user: UserInput) => {
    if (this.ws) return;
    this.ws = await createSocketConnection(
      'ws://localhost:8989/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
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

  createCall = async (data: CreateCallRequest) => {
    const callToCreate = await this.client.createCall(data);
    const { call: callEnvelope } = callToCreate.response;
    return callEnvelope;
  };

  joinCall = async (data: JoinCallRequest) => {
    const callToJoin = await this.client.joinCall(data);
    return callToJoin.response;
  };

  getCallEdgeServer = async (call: Call, edges: LatencyMeasurementClaim) => {
    // TODO: maybe run the measurements in parallel
    const latencyByEdge: { [e: string]: Latency } = {};
    for (const edge of edges.endpoints) {
      latencyByEdge[edge.id] = {
        measurementsSeconds: await measureResourceLoadLatencyTo(
          edge.url,
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

  sendEvent = async (event: SendCustomEventRequest) => {
    const eventResponse = await this.client.sendCustomEvent(event);
    return eventResponse.response;
  };

  reportCallStats = async (
    stats: ReportCallStatsRequest,
  ): Promise<ReportCallStatsResponse> => {
    const response = await this.client.reportCallStats(stats);
    return response.response;
  };
}

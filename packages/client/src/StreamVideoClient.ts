import { Latency } from './gen/video/coordinator/broadcast_v1/broadcast';
import { Call } from './gen/video/coordinator/call_v1/call';
import {
  CreateRoomRequest,
  JoinCallRequest,
  ReportCallStatsRequest,
  ReportCallStatsResponse,
  SendEventRequest,
} from './gen/video/coordinator/client_v1_rpc/client_rpc';
import { ClientRPCClient } from './gen/video/coordinator/client_v1_rpc/client_rpc.client';
import { Edge } from './gen/video/coordinator/edge_v1/edge';
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
      'ws://localhost:8989',
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

  createRoom = async (data: CreateRoomRequest) => {
    const callToCreate = await this.client.createRoom(data);
    const { room } = callToCreate.response;
    return room;
  };

  joinCall = async (data: JoinCallRequest) => {
    const callToJoin = await this.client.joinCall(data);
    return callToJoin.response;
  };

  selectEdgeServer = async (call: Call, edges: Edge[]) => {
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

    const edgeServer = await this.client.selectEdgeServer({
      callType: 'default',
      callId: call.id,
      latencyByEdge,
    });

    return edgeServer.response;
  };

  sendEvent = async (event: SendEventRequest) => {
    const eventResponse = await this.client.sendEvent(event);
    return eventResponse.response;
  };

  reportCallStats = async (
    stats: ReportCallStatsRequest,
  ): Promise<ReportCallStatsResponse> => {
    const response = await this.client.reportCallStats(stats);
    return response.response;
  };
}

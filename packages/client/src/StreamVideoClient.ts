import {
  CreateCallRequest,
  CreateUserRequest,
  JoinCallRequest,
  SendEventRequest,
} from './gen/video_coordinator_rpc/coordinator_service';
import { CallCoordinatorServiceClient } from './gen/video_coordinator_rpc/coordinator_service.client';
import type { Call, Edge, Latency } from './gen/video_models/models';
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
  private client: CallCoordinatorServiceClient;
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

  connect = async (apiKey: string, token: string, user: CreateUserRequest) => {
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

  createCall = async (data: CreateCallRequest) => {
    const callToCreate = await this.client.createCall(data);
    const { call } = callToCreate.response;
    return call;
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
}

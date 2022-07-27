import {
  createClient,
  withBearerToken,
  measureResourceLoadLatencyTo,
  StreamVideoClientOptions,
} from './rpc';
import {
  createSocketConnection,
  StreamEventListener,
  StreamWSClient,
} from './ws';
import {
  CreateCallRequest,
  CreateUserRequest,
  JoinCallRequest,
} from './gen/video_coordinator_rpc/coordinator_service';
import { CallCoordinatorServiceClient } from './gen/video_coordinator_rpc/coordinator_service.client';
import type { Latency } from './gen/video_models/models';

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
      interceptors: [withBearerToken(authToken)],
    });
  }

  connect = async (token: string, user: CreateUserRequest) => {
    if (this.ws) return;
    this.ws = await createSocketConnection('ws://localhost:8989', token, user);
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

  createCall = async (data: CreateCallRequest) => {
    const callToCreate = await this.client.createCall(data);
    const { call } = callToCreate.response;
    return call;
  };

  joinCall = async (data: JoinCallRequest) => {
    const callToJoin = await this.client.joinCall(data);
    const { call, edges } = callToJoin.response;
    if (!call) {
      throw new Error(`Call with id ${data.id} can't be found`);
    }

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
}

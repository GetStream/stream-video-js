import { createClient, withBearerToken } from './createClient';
import { measureLatencyTo } from './latency';
import {
  CreateCallRequest,
  JoinCallRequest,
} from './gen/video_coordinator_rpc/coordinator_service';
import { CallCoordinatorServiceClient } from './gen/video_coordinator_rpc/coordinator_service.client';

import type { Latency } from './gen/video_models/models';
import type { StreamVideoClientOptions } from './types';

export class StreamVideoClient {
  private client: CallCoordinatorServiceClient;

  constructor(apiKey: string, options: StreamVideoClientOptions) {
    const { user } = options;
    const token = typeof user.token === 'function' ? user.token() : user.token;
    this.client = createClient({
      baseUrl: options.baseUrl || '/',
      sendJson: options.sendJson,
      interceptors: [withBearerToken(token)],
    });
  }

  connect = () => {
    // TODO: establish WS connection
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
        measurementsSeconds: await measureLatencyTo(edge.latencyUrl),
      };
    }

    const edgeServer = await this.client.selectEdgeServer({
      callId: call.id,
      latencyByEdge,
    });

    return edgeServer.response;
  };
}

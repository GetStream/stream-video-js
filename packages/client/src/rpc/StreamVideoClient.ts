import { createClient, withBearerToken } from './createClient';
import { measureResourceLoadLatencyTo } from './latency';
import {
  CreateCallRequest,
  JoinCallRequest,
} from '../gen/video_coordinator_rpc/coordinator_service';
import { CallCoordinatorServiceClient } from '../gen/video_coordinator_rpc/coordinator_service.client';

import type { Latency } from '../gen/video_models/models';
import type { StreamVideoClientOptions } from './types';

const defaultOptions: Partial<StreamVideoClientOptions> = {
  sendJson: false,
  latencyMeasurementRounds: 3,
};

export class StreamVideoClient {
  private client: CallCoordinatorServiceClient;
  private options: StreamVideoClientOptions;

  constructor(apiKey: string, opts: StreamVideoClientOptions) {
    const options = {
      ...defaultOptions,
      ...opts,
    };
    this.options = options;
    const { user } = options;
    const token = typeof user.token === 'function' ? user.token() : user.token;
    this.client = createClient({
      baseUrl: options.baseUrl || '/',
      sendJson: options.sendJson,
      interceptors: [withBearerToken(token)],
    });
  }

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
      callId: call.id,
      latencyByEdge,
    });

    return edgeServer.response;
  };
}

import { StreamClient } from './connection/client';
import { sleep } from './connection/utils';
import { StreamClientOptions, User } from './connection/types';
import {
  GetCallEdgeServerRequest,
  GetCallEdgeServerResponse,
  GetOrCreateCallRequest,
  GetOrCreateCallResponse,
  JoinCallResponse,
} from '../gen/coordinator';

export class StreamCoordinatorClient {
  private client: StreamClient;

  constructor(apiKey: string, options: StreamClientOptions = {}) {
    this.client = new StreamClient(apiKey, {
      baseURL: 'http://localhost:3030/video',
      persistUserOnConnectionFailure: true,
      ...options,
    });
  }

  connectUser = async (user: User, token: string) => {
    return this.client.connectUser(user, token);
  };

  getOrCreateCall = async (
    id: string,
    type: string,
    data: GetOrCreateCallRequest,
  ) => {
    return await this.client.post<GetOrCreateCallResponse>(
      `/call/${type}/${id}`,
      data,
    );
  };

  joinCall = async (
    id: string,
    type: string,
    data?: GetOrCreateCallRequest,
  ) => {
    await sleep(1000);
    return await this.client.post<JoinCallResponse>(
      `/join_call/${type}/${id}`,
      data,
    );
  };

  getCallEdgeServer = async (
    id: string,
    type: string,
    data: GetCallEdgeServerRequest,
  ) => {
    return await this.client.post<GetCallEdgeServerResponse>(
      `/get_call_edge_server/${type}/${id}`,
      data,
    );
  };
}

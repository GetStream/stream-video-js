import axios, { AxiosInstance } from 'axios';
import { StableWSConnection } from './connection/StableWsConnection';
import {
  GetCallEdgeServerRequest,
  GetCallEdgeServerResponse,
  GetOrCreateCallRequest,
  GetOrCreateCallResponse,
  JoinCallResponse,
} from '../gen/coordinator';
import { sleep } from './connection/utils';
import { User } from './connection/types';

export type StreamCoordinatorClientOptions = {
  baseUrl?: string;
  authToken?: string;
};

export class StreamCoordinatorClient {
  wsConnection = new StableWSConnection();
  private api: AxiosInstance;

  constructor(apiKey: string, options: StreamCoordinatorClientOptions = {}) {
    this.api = axios.create({
      baseURL: options.baseUrl,
      params: {
        api_key: apiKey,
      },
      headers: {
        Authorization: options.authToken,
        'stream-auth-type': 'jwt',
      },
    });
    this.wsConnection.token = options.authToken!;
  }

  connect = async () => {
    const connection = await this.wsConnection.connect();
    if (connection) {
      this.api.defaults.params.connection_id = connection.connection_id;
    }
  };

  connectUser = async (user: User) => {
    this.api.defaults.params.user_id = user.id;
    this.wsConnection.ws?.send(
      JSON.stringify({
        token: this.wsConnection.token,
        user_details: {
          id: 'user_',
          name: 'ol',
          username: 'ol',
          role: 'admin',
        },
      }),
    );
  };

  getOrCreateCall = async (
    id: string,
    type: string,
    data: GetOrCreateCallRequest,
  ) => {
    // FIXME OL: remove once React waits until client WS is connected
    await sleep(1200);

    const response = await this.api.post<GetOrCreateCallResponse>(
      `call/${type}/${id}`,
      data,
    );
    return response.data;
  };

  joinCall = async (
    id: string,
    type: string,
    data?: GetOrCreateCallRequest,
  ) => {
    // FIXME OL: remove once React waits until client WS is connected

    await sleep(1200);
    const response = await this.api.post<JoinCallResponse>(
      `join_call/${type}/${id}`,
      data,
    );
    return response.data;
  };

  getCallEdgeServer = async (
    id: string,
    type: string,
    data: GetCallEdgeServerRequest,
  ) => {
    const response = await this.api.post<GetCallEdgeServerResponse>(
      `get_call_edge_server/${type}/${id}`,
      data,
    );
    return response.data;
  };
}

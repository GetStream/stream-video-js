import axios, { AxiosInstance } from 'axios';
import { StableWSConnection } from './connection/StableWsConnection';
import {
  GetCallEdgeServerRequest,
  GetCallEdgeServerResponse,
  GetOrCreateCallRequest,
  GetOrCreateCallResponse,
  JoinCallResponse,
} from '../gen/coordinator';

export class StreamCoordinatorClient {
  wsConnection = new StableWSConnection();
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:3030/video',
      params: {
        user_id: 'ol',
        api_key: '892s22ypvt6m',
      },
      headers: {
        Authorization: this.wsConnection.token,
        'stream-auth-type': 'jwt',
      },
    });
  }

  connect = async () => {
    const connection = await this.wsConnection.connect();
    if (connection) {
      this.api.defaults.params.connection_id = connection.connection_id;
    }
  };

  getOrCreateCall = async (
    id: string,
    type: string,
    data: GetOrCreateCallRequest,
  ) => {
    // FIXME OL: remove once React waits until client WS is connected
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));

    return this.api.post<
      GetOrCreateCallRequest,
      GetOrCreateCallResponse,
      GetOrCreateCallRequest
    >(`call/${type}/${id}`, data);
  };

  joinCall = async (id: string, type: string, data: GetOrCreateCallRequest) => {
    return this.api.post<
      GetOrCreateCallRequest,
      JoinCallResponse,
      GetOrCreateCallRequest
    >(`join_call/${type}/${id}`, data);
  };

  getCallEdgeServer = async (
    id: string,
    type: string,
    data: GetCallEdgeServerRequest,
  ) => {
    return this.api.post<
      GetCallEdgeServerRequest,
      GetCallEdgeServerResponse,
      GetCallEdgeServerRequest
    >(`get_call_edge_server/${type}/${id}`, data);
  };
}

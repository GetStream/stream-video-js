import { StreamClient } from './connection/client';
import { sleep } from './connection/utils';
import {
  EventHandler,
  StreamClientOptions,
  TokenOrProvider,
  UR,
  User,
} from './connection/types';
import {
  GetCallEdgeServerRequest,
  GetCallEdgeServerResponse,
  GetOrCreateCallRequest,
  GetOrCreateCallResponse,
  JoinCallResponse,
  SendEventRequest,
} from '../gen/coordinator';

export class StreamCoordinatorClient {
  private client: StreamClient;

  constructor(apiKey: string, options: StreamClientOptions = {}) {
    this.client = new StreamClient(apiKey, {
      // baseURL: 'http://localhost:3030/video',
      // baseURL: 'https://video-edge-oregon-ce3.stream-io-api.com/video',
      baseURL: 'https://video-edge-frankfurt-ce1.stream-io-api.com/video',
      persistUserOnConnectionFailure: true,
      ...options,
    });
  }

  on = (
    callbackOrEventName: EventHandler | string,
    callbackOrNothing?: EventHandler,
  ) => {
    return this.client.on(callbackOrEventName, callbackOrNothing);
  };

  off = (
    callbackOrEventName: EventHandler | string,
    callbackOrNothing?: EventHandler,
  ) => {
    return this.client.off(callbackOrEventName, callbackOrNothing);
  };

  connectUser = async (user: User, token: TokenOrProvider) => {
    return this.client.connectUser(user, token);
  };

  disconnectUser = async (timeout?: number) => {
    return this.client.disconnectUser(timeout);
  };

  getOrCreateCall = async (
    id: string,
    type: string,
    data: GetOrCreateCallRequest,
  ) => {
    await sleep(1000);
    return this.client.post<GetOrCreateCallResponse>(
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
    return this.client.post<JoinCallResponse>(`/join_call/${type}/${id}`, data);
  };

  getCallEdgeServer = async (
    id: string,
    type: string,
    data: GetCallEdgeServerRequest,
  ) => {
    return this.client.post<GetCallEdgeServerResponse>(
      `/get_call_edge_server/${type}/${id}`,
      data,
    );
  };

  queryUsers = async () => {
    console.log('Querying users is not implemented yet.');
  };

  sendEvent = async (id: string, type: string, data: SendEventRequest) => {
    return this.client.post(`/call/${type}/${id}/event`, data);
  };

  startRecording = async (id: string, type: string) => {
    console.log('Start recording is not implemented yet.');
  };

  stopRecording = async (id: string, type: string) => {
    console.log('Stop recording is not implemented yet.');
  };

  reportCallStats = async (id: string, type: string, data: UR) => {
    console.log('Report call stats is not implemented yet.');
  };

  reportCallStatEvent = async (id: string, type: string, data: UR) => {
    console.log('Report call stat event is not implemented yet.');
  };
}

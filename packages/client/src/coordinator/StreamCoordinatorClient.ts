import { StreamClient } from './connection/client';
import {
  EventHandler,
  StreamClientOptions,
  TokenOrProvider,
  UR,
  User,
} from './connection/types';
import {
  CallSettingsRequest,
  GetCallEdgeServerRequest,
  GetCallEdgeServerResponse,
  GetOrCreateCallRequest,
  GetOrCreateCallResponse,
  GoLiveResponse,
  JoinCallRequest,
  JoinCallResponse,
  QueryCallsRequest,
  QueryCallsResponse,
  SendEventRequest,
  SortParamRequest,
  StopLiveResponse,
  UpdateCallRequest,
  UpdateCallResponse,
  RequestPermissionRequest,
  RequestPermissionResponse,
  UpdateUserPermissionsRequest,
  UpdateUserPermissionsResponse,
} from '../gen/coordinator';

export class StreamCall {
  client: StreamClient;
  type: string;
  id: string;
  cid: string;
  basePath: string;

  constructor(client: StreamClient, type: string, id: string) {
    this.client = client;
    this.type = type;
    this.id = id;
    this.cid = `${type}:${id}`;
    this.basePath = `/call/${type}/${id}`;
  }

  goLive = async () => {
    return this.client.post<GoLiveResponse>(`${this.basePath}/go_live`, {});
  };

  stopLive = async () => {
    return this.client.post<StopLiveResponse>(`${this.basePath}/stop_live`, {});
  };

  update = async (
    custom: { [key: string]: any },
    settings?: CallSettingsRequest,
  ) => {
    const payload: UpdateCallRequest = {
      custom: custom,
      settings_override: settings,
    };
    return this.client.post<UpdateCallResponse>(
      `${this.basePath}/stop_live`,
      payload,
    );
  };
}

export class StreamCoordinatorClient {
  private client: StreamClient;

  constructor(apiKey: string, options: StreamClientOptions = {}) {
    this.client = new StreamClient(apiKey, {
      // baseURL: 'http://localhost:3030/video',
      // baseURL: 'https://video-edge-oregon-ce3.stream-io-api.com/video',
      baseURL: 'https://video-edge-frankfurt-ce1.stream-io-api.com/video',
      // FIXME: OL: fix SSR.
      browser: true,
      persistUserOnConnectionFailure: true,
      ...options,
    });
  }

  call = (type: string, id: string) => {
    return new StreamCall(this.client, type, id);
  };

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
    return this.client.connectUser(
      // @ts-expect-error
      user,
      token,
    );
  };

  disconnectUser = async (timeout?: number) => {
    return this.client.disconnectUser(timeout);
  };

  getOrCreateCall = async (
    id: string,
    type: string,
    data?: GetOrCreateCallRequest,
  ) => {
    return this.client.post<GetOrCreateCallResponse>(
      `/call/${type}/${id}`,
      data,
    );
  };

  joinCall = async (id: string, type: string, data?: JoinCallRequest) => {
    await this.client.connectionIdPromise;
    return this.client.post<JoinCallResponse>(`/join_call/${type}/${id}`, data);
  };

  getCallEdgeServer = async (
    id: string,
    type: string,
    data: GetCallEdgeServerRequest,
  ) => {
    return this.client.post<GetCallEdgeServerResponse>(
      `/call/${type}/${id}/get_edge_server`,
      data,
    );
  };

  queryCalls = async (
    filterConditions: { [key: string]: any },
    sort: Array<SortParamRequest>,
    limit?: number,
    next?: string,
  ) => {
    const data: QueryCallsRequest = {
      filter_conditions: filterConditions,
      sort: sort,
      limit: limit,
      next: next,
    };
    return this.client.post<QueryCallsResponse>(`/calls`, data);
  };

  queryUsers = async () => {
    console.log('Querying users is not implemented yet.');
  };

  sendEvent = async (id: string, type: string, data: SendEventRequest) => {
    return this.client.post(`/call/${type}/${id}/event`, data);
  };

  startRecording = async (id: string, type: string) => {
    return this.client.post(`/call/${type}/${id}/start_recording`, {});
  };

  stopRecording = async (id: string, type: string) => {
    return this.client.post(`/call/${type}/${id}/stop_recording`, {});
  };

  reportCallStats = async (id: string, type: string, data: UR) => {
    console.log('Report call stats is not implemented yet.');
  };

  reportCallStatEvent = async (id: string, type: string, data: UR) => {
    console.log('Report call stat event is not implemented yet.');
  };

  requestCallPermissions = async (
    id: string,
    type: string,
    data: RequestPermissionRequest,
  ) => {
    return this.client.post<RequestPermissionResponse>(
      `/call/${type}/${id}/request_permission`,
      data,
    );
  };

  updateUserPermissions = async (
    id: string,
    type: string,
    data: UpdateUserPermissionsRequest,
  ) => {
    return this.client.post<UpdateUserPermissionsResponse>(
      `/call/${type}/${id}/user_permissions`,
      data,
    );
  };
}

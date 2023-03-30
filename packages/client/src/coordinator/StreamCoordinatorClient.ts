import { StreamClient } from './connection/client';
import {
  EventHandler,
  StreamClientOptions,
  TokenOrProvider,
  User,
} from './connection/types';
import {
  BlockUserResponse,
  CallSettingsRequest,
  CreateCallTypeRequest,
  CreateCallTypeResponse,
  EndCallResponse,
  GetCallEdgeServerRequest,
  GetCallEdgeServerResponse,
  GetCallTypeResponse,
  GetCallResponse,
  GetEdgesResponse,
  GetOrCreateCallRequest,
  GetOrCreateCallResponse,
  GoLiveResponse,
  JoinCallRequest,
  JoinCallResponse,
  ListCallTypeResponse,
  MuteUsersResponse,
  QueryCallsRequest,
  QueryCallsResponse,
  RequestPermissionRequest,
  RequestPermissionResponse,
  SendEventRequest,
  SendReactionRequest,
  SendReactionResponse,
  SortParamRequest,
  StopLiveResponse,
  UnblockUserResponse,
  UpdateCallRequest,
  UpdateCallResponse,
  UpdateCallTypeRequest,
  UpdateCallTypeResponse,
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

  sendReaction = async (reaction: SendReactionRequest) => {
    return this.client.post<SendReactionResponse>(
      `${this.basePath}/reaction`,
      reaction,
    );
  };

  blockUser = async (userId: string) => {
    return this.client.post<BlockUserResponse>(`${this.basePath}/block`, {
      user_id: userId,
    });
  };

  unblockUser = async (userId: string) => {
    return this.client.post<UnblockUserResponse>(`${this.basePath}/unblock`, {
      user_id: userId,
    });
  };

  muteUser = (
    userId: string,
    type: 'audio' | 'video' | 'screenshare',
    sessionId?: string,
  ) => {
    return this.client.post<MuteUsersResponse>(`${this.basePath}/mute_users`, {
      user_ids: [userId],
      [type]: true,
      // session_ids: [sessionId],
    });
  };

  muteAllUsers = (type: 'audio' | 'video' | 'screenshare') => {
    return this.client.post<MuteUsersResponse>(`${this.basePath}/mute_users`, {
      mute_all_users: true,
      [type]: true,
    });
  };

  get = async () => {
    return this.client.get<GetCallResponse>(this.basePath);
  };

  getOrCreate = async (data?: GetOrCreateCallRequest) => {
    return this.client.post<GetOrCreateCallResponse>(this.basePath, data);
  };

  join = async (data?: JoinCallRequest) => {
    await this.client.connectionIdPromise;
    try {
      return await this.client.post<JoinCallResponse>(
        `${this.basePath}/join`,
        data,
      );
    } catch (e) {
      // fallback scenario, until we get a new Coordinator deployed
      return await this.client.post<JoinCallResponse>(
        `/join_call/${this.type}/${this.id}`,
        data,
      );
    }
  };

  getEdgeServer = async (data: GetCallEdgeServerRequest) => {
    return this.client.post<GetCallEdgeServerResponse>(
      `${this.basePath}/get_edge_server`,
      data,
    );
  };

  sendEvent = async (event: SendEventRequest) => {
    return this.client.post(`${this.basePath}/event`, event);
  };

  startRecording = async () => {
    return this.client.post(`${this.basePath}/start_recording`, {});
  };

  stopRecording = async () => {
    return this.client.post(`${this.basePath}/stop_recording`, {});
  };

  requestPermissions = async (data: RequestPermissionRequest) => {
    return this.client.post<RequestPermissionResponse>(
      `${this.basePath}/request_permission`,
      data,
    );
  };

  updateUserPermissions = async (data: UpdateUserPermissionsRequest) => {
    return this.client.post<UpdateUserPermissionsResponse>(
      `${this.basePath}/user_permissions`,
      data,
    );
  };

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
    return this.client.patch<UpdateCallResponse>(`${this.basePath}`, payload);
  };

  endCall = async () => {
    return this.client.post<EndCallResponse>(`${this.basePath}/mark_ended`);
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

  // DEPRECATED: use call.getOrCreate() instead
  getOrCreateCall = async (
    id: string,
    type: string,
    data?: GetOrCreateCallRequest,
  ) => {
    return this.call(type, id).getOrCreate(data);
  };

  // DEPRECATED: use call.join() instead
  joinCall = async (id: string, type: string, data?: JoinCallRequest) => {
    await this.client.connectionIdPromise;
    return this.call(type, id).join(data);
  };

  // DEPRECATED: use call.getEdgeServer() instead
  getCallEdgeServer = async (
    id: string,
    type: string,
    data: GetCallEdgeServerRequest,
  ) => {
    return this.call(type, id).getEdgeServer(data);
  };

  queryCalls = async (
    filterConditions: { [key: string]: any },
    sort: Array<SortParamRequest>,
    limit?: number,
    next?: string,
    watch?: boolean,
  ) => {
    const data: QueryCallsRequest = {
      filter_conditions: filterConditions,
      sort: sort,
      limit: limit,
      next: next,
      watch,
    };
    if (data.watch) {
      await this.client.connectionIdPromise;
    }
    return this.client.post<QueryCallsResponse>(`/calls`, data);
  };

  queryUsers = async () => {
    console.log('Querying users is not implemented yet.');
  };

  edges = async () => {
    return this.client.get<GetEdgesResponse>(`/edges`);
  };

  /**
   * @deprecated use call.startRecording() instead
   */
  sendEvent = async (id: string, type: string, data: SendEventRequest) => {
    return this.call(type, id).sendEvent(data);
  };

  /**
   * @deprecated use call.startRecording() instead
   */
  startRecording = async (id: string, type: string) => {
    return this.call(type, id).startRecording();
  };

  /**
   * @deprecated use call.startRecording() instead
   */
  stopRecording = async (id: string, type: string) => {
    return this.call(type, id).stopRecording();
  };

  /**
   * @deprecated use call.requestPermissions() instead
   */
  requestCallPermissions = async (
    id: string,
    type: string,
    data: RequestPermissionRequest,
  ) => {
    return this.call(type, id).requestPermissions(data);
  };

  /**
   * @deprecated use call.updateUserPermissions() instead
   */
  updateUserPermissions = async (
    id: string,
    type: string,
    data: UpdateUserPermissionsRequest,
  ) => {
    return this.call(type, id).updateUserPermissions(data);
  };

  endCall = async (id: string, type: string) => {
    return this.call(type, id).endCall();
  };

  // server-side only endpoints
  createCallType = async (data: CreateCallTypeRequest) => {
    return this.client.post<CreateCallTypeResponse>(`/calltypes`, data);
  };

  getCallType = async (name: string) => {
    return this.client.get<GetCallTypeResponse>(`/calltypes/${name}`);
  };

  updateCallType = async (name: string, data: UpdateCallTypeRequest) => {
    return this.client.put<UpdateCallTypeResponse>(`/calltypes/${name}`, data);
  };

  deleteCallType = async (name: string) => {
    return this.client.delete(`/calltypes/${name}`);
  };

  listCallTypes = async () => {
    return this.client.get<ListCallTypeResponse>(`/calltypes`);
  };
}

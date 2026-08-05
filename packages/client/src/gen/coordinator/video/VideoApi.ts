import { ApiClient, StreamResponse } from '../../gen-imports';
import {
  AcceptCallResponse,
  BlockUserRequest,
  BlockUserResponse,
  CollectUserFeedbackRequest,
  CollectUserFeedbackResponse,
  CreateDeviceRequest,
  CreateGuestRequest,
  CreateGuestResponse,
  DeleteCallRequest,
  DeleteCallResponse,
  DeleteRecordingResponse,
  DeleteTranscriptionResponse,
  EndCallResponse,
  GetCallReportResponse,
  GetCallResponse,
  GetCallSessionParticipantStatsDetailsResponse,
  GetEdgesResponse,
  GetOrCreateCallRequest,
  GetOrCreateCallResponse,
  GoLiveRequest,
  GoLiveResponse,
  JoinCallRequest,
  JoinCallResponse,
  KickUserRequest,
  KickUserResponse,
  ListDevicesResponse,
  ListRecordingsResponse,
  ListTranscriptionsResponse,
  MuteUsersRequest,
  MuteUsersResponse,
  PinRequest,
  PinResponse,
  QueryAggregateCallStatsRequest,
  QueryAggregateCallStatsResponse,
  QueryCallMembersRequest,
  QueryCallMembersResponse,
  QueryCallParticipantsRequest,
  QueryCallParticipantsResponse,
  QueryCallSessionParticipantStatsResponse,
  QueryCallSessionParticipantStatsTimelineResponse,
  QueryCallStatsMapResponse,
  QueryCallStatsRequest,
  QueryCallStatsResponse,
  QueryCallsRequest,
  QueryCallsResponse,
  RejectCallRequest,
  RejectCallResponse,
  RequestPermissionRequest,
  RequestPermissionResponse,
  Response,
  RingCallRequest,
  RingCallResponse,
  SendCallEventRequest,
  SendCallEventResponse,
  SendVideoReactionRequest,
  SendVideoReactionResponse,
  SortParamRequest,
  StartClosedCaptionsRequest,
  StartClosedCaptionsResponse,
  StartFrameRecordingRequest,
  StartFrameRecordingResponse,
  StartHLSBroadcastingResponse,
  StartRTMPBroadcastsRequest,
  StartRTMPBroadcastsResponse,
  StartRecordingRequest,
  StartRecordingResponse,
  StartTranscriptionRequest,
  StartTranscriptionResponse,
  StopAllRTMPBroadcastsResponse,
  StopClosedCaptionsRequest,
  StopClosedCaptionsResponse,
  StopFrameRecordingResponse,
  StopHLSBroadcastingResponse,
  StopLiveRequest,
  StopLiveResponse,
  StopRTMPBroadcastsRequest,
  StopRTMPBroadcastsResponse,
  StopRecordingRequest,
  StopRecordingResponse,
  StopTranscriptionRequest,
  StopTranscriptionResponse,
  UnblockUserRequest,
  UnblockUserResponse,
  UnpinRequest,
  UnpinResponse,
  UpdateCallMembersRequest,
  UpdateCallMembersResponse,
  UpdateCallRequest,
  UpdateCallResponse,
  UpdateUserPermissionsRequest,
  UpdateUserPermissionsResponse,
} from '../models';
import { decoders } from '../model-decoders/decoders';

const CALL_PATH = '/api/v2/video/call/{type}/{id}';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type PathParams = Record<string, string>;
type QueryParams = Record<string, unknown>;
type RequestOptions<
  Path extends PathParams | undefined = undefined,
  Query extends QueryParams | undefined = undefined,
  Body = undefined,
> = (Path extends undefined
  ? { params?: Query extends undefined ? never : { query?: Query } }
  : {
      params: { path: Path } & (Query extends undefined
        ? {}
        : { query?: Query });
    }) &
  (Body extends undefined ? { body?: never } : { body?: Body });

export class VideoApi {
  constructor(public readonly apiClient: ApiClient) {}

  private get<T>(
    path: string,
    pathParams: PathParams | undefined,
    queryParams: QueryParams | undefined,
    decoderKey: string,
  ): Promise<StreamResponse<T>> {
    return this.send<T>(
      'GET',
      path,
      pathParams,
      queryParams,
      undefined,
      decoderKey,
    );
  }

  private post<T>(
    path: string,
    pathParams: PathParams | undefined,
    queryParams: QueryParams | undefined,
    body: unknown,
    decoderKey: string,
    contentType?: string,
  ): Promise<StreamResponse<T>> {
    return this.send<T>(
      'POST',
      path,
      pathParams,
      queryParams,
      body,
      decoderKey,
      contentType,
    );
  }

  private patch<T>(
    path: string,
    pathParams: PathParams | undefined,
    queryParams: QueryParams | undefined,
    body: unknown,
    decoderKey: string,
    contentType?: string,
  ): Promise<StreamResponse<T>> {
    return this.send<T>(
      'PATCH',
      path,
      pathParams,
      queryParams,
      body,
      decoderKey,
      contentType,
    );
  }

  private del<T>(
    path: string,
    pathParams: PathParams | undefined,
    queryParams: QueryParams | undefined,
    decoderKey: string,
  ): Promise<StreamResponse<T>> {
    return this.send<T>(
      'DELETE',
      path,
      pathParams,
      queryParams,
      undefined,
      decoderKey,
    );
  }

  private async send<T>(
    method: HttpMethod,
    path: string,
    pathParams: PathParams | undefined,
    queryParams: QueryParams | undefined,
    body: unknown,
    decoderKey: string,
    contentType: string | undefined = body !== undefined
      ? 'application/json'
      : undefined,
  ): Promise<StreamResponse<T>> {
    const response = await this.apiClient.sendRequest<T>(
      method,
      path,
      pathParams,
      queryParams,
      body,
      contentType,
    );
    decoders[decoderKey]?.(response.body);
    return { ...response.body, metadata: response.metadata };
  }

  async deleteDevice(request?: {
    id: string;
  }): Promise<StreamResponse<Response>> {
    return this.del<Response>(
      '/api/v2/devices',
      undefined,
      request,
      'Response',
    );
  }

  async listDevices(): Promise<StreamResponse<ListDevicesResponse>> {
    return this.get<ListDevicesResponse>(
      '/api/v2/devices',
      undefined,
      undefined,
      'ListDevicesResponse',
    );
  }

  async createDevice(
    request?: CreateDeviceRequest,
  ): Promise<StreamResponse<Response>> {
    return this.post<Response>(
      '/api/v2/devices',
      undefined,
      undefined,
      request,
      'Response',
    );
  }

  async createGuest(
    request?: CreateGuestRequest,
  ): Promise<StreamResponse<CreateGuestResponse>> {
    return this.post<CreateGuestResponse>(
      '/api/v2/guest',
      undefined,
      undefined,
      request,
      'CreateGuestResponse',
    );
  }

  async queryCallMembers(
    request?: QueryCallMembersRequest,
  ): Promise<StreamResponse<QueryCallMembersResponse>> {
    return this.post<QueryCallMembersResponse>(
      '/api/v2/video/call/members',
      undefined,
      undefined,
      request,
      'QueryCallMembersResponse',
    );
  }

  async queryCallStats(
    request?: QueryCallStatsRequest,
  ): Promise<StreamResponse<QueryCallStatsResponse>> {
    return this.post<QueryCallStatsResponse>(
      '/api/v2/video/call/stats',
      undefined,
      undefined,
      request,
      'QueryCallStatsResponse',
    );
  }

  async getCall(
    pathParams: { type: string; id: string },
    request?: {
      connection_id?: string;
      members_limit?: number;
      ring?: boolean;
      notify?: boolean;
      video?: boolean;
    },
  ): Promise<StreamResponse<GetCallResponse>> {
    return this.get<GetCallResponse>(
      CALL_PATH,
      pathParams,
      request,
      'GetCallResponse',
    );
  }

  async updateCall(
    pathParams: { type: string; id: string },
    request?: UpdateCallRequest,
  ): Promise<StreamResponse<UpdateCallResponse>> {
    return this.patch<UpdateCallResponse>(
      CALL_PATH,
      pathParams,
      undefined,
      request,
      'UpdateCallResponse',
    );
  }

  async getOrCreateCall(
    options: RequestOptions<
      { type: string; id: string },
      { connection_id?: string },
      GetOrCreateCallRequest
    >,
  ): Promise<StreamResponse<GetOrCreateCallResponse>> {
    return this.post<GetOrCreateCallResponse>(
      CALL_PATH,
      options.params?.path,
      options.params?.query,
      options.body,
      'GetOrCreateCallResponse',
    );
  }

  async acceptCall(pathParams: {
    type: string;
    id: string;
  }): Promise<StreamResponse<AcceptCallResponse>> {
    return this.post<AcceptCallResponse>(
      `${CALL_PATH}/accept`,
      pathParams,
      undefined,
      undefined,
      'AcceptCallResponse',
    );
  }

  async blockUser(
    pathParams: { type: string; id: string },
    request?: BlockUserRequest,
  ): Promise<StreamResponse<BlockUserResponse>> {
    return this.post<BlockUserResponse>(
      `${CALL_PATH}/block`,
      pathParams,
      undefined,
      request,
      'BlockUserResponse',
    );
  }

  async deleteCall(
    pathParams: { type: string; id: string },
    request?: DeleteCallRequest,
  ): Promise<StreamResponse<DeleteCallResponse>> {
    return this.post<DeleteCallResponse>(
      `${CALL_PATH}/delete`,
      pathParams,
      undefined,
      request,
      'DeleteCallResponse',
    );
  }

  async sendCallEvent(
    pathParams: { type: string; id: string },
    request?: SendCallEventRequest,
  ): Promise<StreamResponse<SendCallEventResponse>> {
    return this.post<SendCallEventResponse>(
      `${CALL_PATH}/event`,
      pathParams,
      undefined,
      request,
      'SendCallEventResponse',
    );
  }

  async collectUserFeedback(
    pathParams: { type: string; id: string },
    request?: CollectUserFeedbackRequest,
  ): Promise<StreamResponse<CollectUserFeedbackResponse>> {
    return this.post<CollectUserFeedbackResponse>(
      `${CALL_PATH}/feedback`,
      pathParams,
      undefined,
      request,
      'CollectUserFeedbackResponse',
    );
  }

  async goLive(
    pathParams: { type: string; id: string },
    request?: GoLiveRequest,
  ): Promise<StreamResponse<GoLiveResponse>> {
    return this.post<GoLiveResponse>(
      `${CALL_PATH}/go_live`,
      pathParams,
      undefined,
      request,
      'GoLiveResponse',
    );
  }

  async joinCall(
    options: RequestOptions<
      { type: string; id: string },
      { connection_id?: string },
      JoinCallRequest
    >,
  ): Promise<StreamResponse<JoinCallResponse>> {
    return this.post<JoinCallResponse>(
      `${CALL_PATH}/join`,
      options.params?.path,
      options.params?.query,
      options.body,
      'JoinCallResponse',
    );
  }

  async kickUser(
    pathParams: { type: string; id: string },
    request?: KickUserRequest,
  ): Promise<StreamResponse<KickUserResponse>> {
    return this.post<KickUserResponse>(
      `${CALL_PATH}/kick`,
      pathParams,
      undefined,
      request,
      'KickUserResponse',
    );
  }

  async endCall(pathParams: {
    type: string;
    id: string;
  }): Promise<StreamResponse<EndCallResponse>> {
    return this.post<EndCallResponse>(
      `${CALL_PATH}/mark_ended`,
      pathParams,
      undefined,
      undefined,
      'EndCallResponse',
    );
  }

  async updateCallMembers(
    pathParams: { type: string; id: string },
    request?: UpdateCallMembersRequest,
  ): Promise<StreamResponse<UpdateCallMembersResponse>> {
    return this.post<UpdateCallMembersResponse>(
      `${CALL_PATH}/members`,
      pathParams,
      undefined,
      request,
      'UpdateCallMembersResponse',
    );
  }

  async muteUsers(
    pathParams: { type: string; id: string },
    request?: MuteUsersRequest,
  ): Promise<StreamResponse<MuteUsersResponse>> {
    return this.post<MuteUsersResponse>(
      `${CALL_PATH}/mute_users`,
      pathParams,
      undefined,
      request,
      'MuteUsersResponse',
    );
  }

  async queryCallParticipants(
    options: RequestOptions<
      { type: string; id: string },
      { limit?: number },
      QueryCallParticipantsRequest
    >,
  ): Promise<StreamResponse<QueryCallParticipantsResponse>> {
    return this.post<QueryCallParticipantsResponse>(
      `${CALL_PATH}/participants`,
      options.params?.path,
      options.params?.query,
      options.body,
      'QueryCallParticipantsResponse',
    );
  }

  async videoPin(
    pathParams: { type: string; id: string },
    request?: PinRequest,
  ): Promise<StreamResponse<PinResponse>> {
    return this.post<PinResponse>(
      `${CALL_PATH}/pin`,
      pathParams,
      undefined,
      request,
      'PinResponse',
    );
  }

  async sendVideoReaction(
    pathParams: { type: string; id: string },
    request?: SendVideoReactionRequest,
  ): Promise<StreamResponse<SendVideoReactionResponse>> {
    // With path params passed separately, the body's `type` (reaction type) no
    // longer collides with the `{type}` path param (call type) — no remap needed.
    return this.post<SendVideoReactionResponse>(
      `${CALL_PATH}/reaction`,
      pathParams,
      undefined,
      request,
      'SendVideoReactionResponse',
    );
  }

  async listRecordings(pathParams: {
    type: string;
    id: string;
  }): Promise<StreamResponse<ListRecordingsResponse>> {
    return this.get<ListRecordingsResponse>(
      `${CALL_PATH}/recordings`,
      pathParams,
      undefined,
      'ListRecordingsResponse',
    );
  }

  async startRecording(
    pathParams: { type: string; id: string; recording_type: string },
    request?: StartRecordingRequest,
  ): Promise<StreamResponse<StartRecordingResponse>> {
    return this.post<StartRecordingResponse>(
      `${CALL_PATH}/recordings/{recording_type}/start`,
      pathParams,
      undefined,
      request,
      'StartRecordingResponse',
    );
  }

  async stopRecording(
    pathParams: { type: string; id: string; recording_type: string },
    request?: StopRecordingRequest,
  ): Promise<StreamResponse<StopRecordingResponse>> {
    return this.post<StopRecordingResponse>(
      `${CALL_PATH}/recordings/{recording_type}/stop`,
      pathParams,
      undefined,
      request,
      'StopRecordingResponse',
    );
  }

  async rejectCall(
    pathParams: { type: string; id: string },
    request?: RejectCallRequest,
  ): Promise<StreamResponse<RejectCallResponse>> {
    return this.post<RejectCallResponse>(
      `${CALL_PATH}/reject`,
      pathParams,
      undefined,
      request,
      'RejectCallResponse',
    );
  }

  async getCallReport(
    pathParams: { type: string; id: string },
    request?: { session_id?: string },
  ): Promise<StreamResponse<GetCallReportResponse>> {
    return this.get<GetCallReportResponse>(
      `${CALL_PATH}/report`,
      pathParams,
      request,
      'GetCallReportResponse',
    );
  }

  async requestPermission(
    pathParams: { type: string; id: string },
    request?: RequestPermissionRequest,
  ): Promise<StreamResponse<RequestPermissionResponse>> {
    return this.post<RequestPermissionResponse>(
      `${CALL_PATH}/request_permission`,
      pathParams,
      undefined,
      request,
      'RequestPermissionResponse',
    );
  }

  async ringCall(
    pathParams: { type: string; id: string },
    request?: RingCallRequest,
  ): Promise<StreamResponse<RingCallResponse>> {
    return this.post<RingCallResponse>(
      `${CALL_PATH}/ring`,
      pathParams,
      undefined,
      request,
      'RingCallResponse',
    );
  }

  async startRTMPBroadcasts(
    pathParams: { type: string; id: string },
    request?: StartRTMPBroadcastsRequest,
  ): Promise<StreamResponse<StartRTMPBroadcastsResponse>> {
    return this.post<StartRTMPBroadcastsResponse>(
      `${CALL_PATH}/rtmp_broadcasts`,
      pathParams,
      undefined,
      request,
      'StartRTMPBroadcastsResponse',
    );
  }

  async stopAllRTMPBroadcasts(pathParams: {
    type: string;
    id: string;
  }): Promise<StreamResponse<StopAllRTMPBroadcastsResponse>> {
    return this.post<StopAllRTMPBroadcastsResponse>(
      `${CALL_PATH}/rtmp_broadcasts/stop`,
      pathParams,
      undefined,
      undefined,
      'StopAllRTMPBroadcastsResponse',
    );
  }

  async stopRTMPBroadcast(
    pathParams: { type: string; id: string; name: string },
    request?: StopRTMPBroadcastsRequest,
  ): Promise<StreamResponse<StopRTMPBroadcastsResponse>> {
    return this.post<StopRTMPBroadcastsResponse>(
      `${CALL_PATH}/rtmp_broadcasts/{name}/stop`,
      pathParams,
      undefined,
      request,
      'StopRTMPBroadcastsResponse',
    );
  }

  async startHLSBroadcasting(pathParams: {
    type: string;
    id: string;
  }): Promise<StreamResponse<StartHLSBroadcastingResponse>> {
    return this.post<StartHLSBroadcastingResponse>(
      `${CALL_PATH}/start_broadcasting`,
      pathParams,
      undefined,
      undefined,
      'StartHLSBroadcastingResponse',
    );
  }

  async startClosedCaptions(
    pathParams: { type: string; id: string },
    request?: StartClosedCaptionsRequest,
  ): Promise<StreamResponse<StartClosedCaptionsResponse>> {
    return this.post<StartClosedCaptionsResponse>(
      `${CALL_PATH}/start_closed_captions`,
      pathParams,
      undefined,
      request,
      'StartClosedCaptionsResponse',
    );
  }

  async startFrameRecording(
    pathParams: { type: string; id: string },
    request?: StartFrameRecordingRequest,
  ): Promise<StreamResponse<StartFrameRecordingResponse>> {
    return this.post<StartFrameRecordingResponse>(
      `${CALL_PATH}/start_frame_recording`,
      pathParams,
      undefined,
      request,
      'StartFrameRecordingResponse',
    );
  }

  async startTranscription(
    pathParams: { type: string; id: string },
    request?: StartTranscriptionRequest,
  ): Promise<StreamResponse<StartTranscriptionResponse>> {
    return this.post<StartTranscriptionResponse>(
      `${CALL_PATH}/start_transcription`,
      pathParams,
      undefined,
      request,
      'StartTranscriptionResponse',
    );
  }

  async stopHLSBroadcasting(pathParams: {
    type: string;
    id: string;
  }): Promise<StreamResponse<StopHLSBroadcastingResponse>> {
    return this.post<StopHLSBroadcastingResponse>(
      `${CALL_PATH}/stop_broadcasting`,
      pathParams,
      undefined,
      undefined,
      'StopHLSBroadcastingResponse',
    );
  }

  async stopClosedCaptions(
    pathParams: { type: string; id: string },
    request?: StopClosedCaptionsRequest,
  ): Promise<StreamResponse<StopClosedCaptionsResponse>> {
    return this.post<StopClosedCaptionsResponse>(
      `${CALL_PATH}/stop_closed_captions`,
      pathParams,
      undefined,
      request,
      'StopClosedCaptionsResponse',
    );
  }

  async stopFrameRecording(pathParams: {
    type: string;
    id: string;
  }): Promise<StreamResponse<StopFrameRecordingResponse>> {
    return this.post<StopFrameRecordingResponse>(
      `${CALL_PATH}/stop_frame_recording`,
      pathParams,
      undefined,
      undefined,
      'StopFrameRecordingResponse',
    );
  }

  async stopLive(
    pathParams: { type: string; id: string },
    request?: StopLiveRequest,
  ): Promise<StreamResponse<StopLiveResponse>> {
    return this.post<StopLiveResponse>(
      `${CALL_PATH}/stop_live`,
      pathParams,
      undefined,
      request,
      'StopLiveResponse',
    );
  }

  async stopTranscription(
    pathParams: { type: string; id: string },
    request?: StopTranscriptionRequest,
  ): Promise<StreamResponse<StopTranscriptionResponse>> {
    return this.post<StopTranscriptionResponse>(
      `${CALL_PATH}/stop_transcription`,
      pathParams,
      undefined,
      request,
      'StopTranscriptionResponse',
    );
  }

  async listTranscriptions(pathParams: {
    type: string;
    id: string;
  }): Promise<StreamResponse<ListTranscriptionsResponse>> {
    return this.get<ListTranscriptionsResponse>(
      `${CALL_PATH}/transcriptions`,
      pathParams,
      undefined,
      'ListTranscriptionsResponse',
    );
  }

  async unblockUser(
    pathParams: { type: string; id: string },
    request?: UnblockUserRequest,
  ): Promise<StreamResponse<UnblockUserResponse>> {
    return this.post<UnblockUserResponse>(
      `${CALL_PATH}/unblock`,
      pathParams,
      undefined,
      request,
      'UnblockUserResponse',
    );
  }

  async videoUnpin(
    pathParams: { type: string; id: string },
    request?: UnpinRequest,
  ): Promise<StreamResponse<UnpinResponse>> {
    return this.post<UnpinResponse>(
      `${CALL_PATH}/unpin`,
      pathParams,
      undefined,
      request,
      'UnpinResponse',
    );
  }

  async updateUserPermissions(
    pathParams: { type: string; id: string },
    request?: UpdateUserPermissionsRequest,
  ): Promise<StreamResponse<UpdateUserPermissionsResponse>> {
    return this.post<UpdateUserPermissionsResponse>(
      `${CALL_PATH}/user_permissions`,
      pathParams,
      undefined,
      request,
      'UpdateUserPermissionsResponse',
    );
  }

  async deleteRecording(pathParams: {
    type: string;
    id: string;
    session: string;
    filename: string;
  }): Promise<StreamResponse<DeleteRecordingResponse>> {
    return this.del<DeleteRecordingResponse>(
      `${CALL_PATH}/{session}/recordings/{filename}`,
      pathParams,
      undefined,
      'DeleteRecordingResponse',
    );
  }

  async deleteTranscription(pathParams: {
    type: string;
    id: string;
    session: string;
    filename: string;
  }): Promise<StreamResponse<DeleteTranscriptionResponse>> {
    return this.del<DeleteTranscriptionResponse>(
      `${CALL_PATH}/{session}/transcriptions/{filename}`,
      pathParams,
      undefined,
      'DeleteTranscriptionResponse',
    );
  }

  async getCallStatsMap(
    pathParams: { call_type: string; call_id: string; session: string },
    request?: {
      start_time?: string;
      end_time?: string;
      exclude_publishers?: boolean;
      exclude_subscribers?: boolean;
      exclude_sfus?: boolean;
    },
  ): Promise<StreamResponse<QueryCallStatsMapResponse>> {
    return this.get<QueryCallStatsMapResponse>(
      '/api/v2/video/call_stats/{call_type}/{call_id}/{session}/map',
      pathParams,
      request,
      'QueryCallStatsMapResponse',
    );
  }

  async getCallSessionParticipantStatsDetails(
    pathParams: {
      call_type: string;
      call_id: string;
      session: string;
      user: string;
      user_session: string;
    },
    request?: { since?: string; until?: string; max_points?: number },
  ): Promise<StreamResponse<GetCallSessionParticipantStatsDetailsResponse>> {
    return this.get<GetCallSessionParticipantStatsDetailsResponse>(
      '/api/v2/video/call_stats/{call_type}/{call_id}/{session}/participant/{user}/{user_session}/details',
      pathParams,
      request,
      'GetCallSessionParticipantStatsDetailsResponse',
    );
  }

  async queryCallSessionParticipantStats(
    pathParams: { call_type: string; call_id: string; session: string },
    request?: {
      limit?: number;
      prev?: string;
      next?: string;
      sort?: Array<SortParamRequest>;
      filter_conditions?: Record<string, unknown>;
    },
  ): Promise<StreamResponse<QueryCallSessionParticipantStatsResponse>> {
    return this.get<QueryCallSessionParticipantStatsResponse>(
      '/api/v2/video/call_stats/{call_type}/{call_id}/{session}/participants',
      pathParams,
      request,
      'QueryCallSessionParticipantStatsResponse',
    );
  }

  async getCallSessionParticipantStatsTimeline(
    pathParams: {
      call_type: string;
      call_id: string;
      session: string;
      user: string;
      user_session: string;
    },
    request?: {
      start_time?: string;
      end_time?: string;
      severity?: Array<string>;
    },
  ): Promise<StreamResponse<QueryCallSessionParticipantStatsTimelineResponse>> {
    return this.get<QueryCallSessionParticipantStatsTimelineResponse>(
      '/api/v2/video/call_stats/{call_type}/{call_id}/{session}/participants/{user}/{user_session}/timeline',
      pathParams,
      request,
      'QueryCallSessionParticipantStatsTimelineResponse',
    );
  }

  async queryCalls(
    options: RequestOptions<
      undefined,
      { connection_id?: string },
      QueryCallsRequest
    > = {},
  ): Promise<StreamResponse<QueryCallsResponse>> {
    return this.post<QueryCallsResponse>(
      '/api/v2/video/calls',
      undefined,
      options.params?.query,
      options.body,
      'QueryCallsResponse',
    );
  }

  async getEdges(): Promise<StreamResponse<GetEdgesResponse>> {
    return this.get<GetEdgesResponse>(
      '/api/v2/video/edges',
      undefined,
      undefined,
      'GetEdgesResponse',
    );
  }

  async queryAggregateCallStats(
    request?: QueryAggregateCallStatsRequest,
  ): Promise<StreamResponse<QueryAggregateCallStatsResponse>> {
    return this.post<QueryAggregateCallStatsResponse>(
      '/api/v2/video/stats',
      undefined,
      undefined,
      request,
      'QueryAggregateCallStatsResponse',
    );
  }
}

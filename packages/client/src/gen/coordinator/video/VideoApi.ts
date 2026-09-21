import type { ApiClient, StreamResponse } from '../../gen-imports';
import type {
  AcceptCallResponse,
  BlockUserRequest,
  BlockUserResponse,
  CollectUserFeedbackRequest,
  CollectUserFeedbackResponse,
  DeleteCallRequest,
  DeleteCallResponse,
  DeleteRecordingResponse,
  DeleteTranscriptionResponse,
  EndCallResponse,
  GetCallParticipantSessionMetricsResponse,
  GetCallReportResponse,
  GetCallResponse,
  GetCallRingStateResponse,
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
  QueryCallParticipantSessionsResponse,
  QueryCallParticipantsRequest,
  QueryCallParticipantsResponse,
  QueryCallSessionParticipantStatsResponse,
  QueryCallSessionParticipantStatsTimelineResponse,
  QueryCallSessionStatsRequest,
  QueryCallSessionStatsResponse,
  QueryCallStatsMapResponse,
  QueryCallStatsRequest,
  QueryCallStatsResponse,
  QueryCallsRequest,
  QueryCallsResponse,
  RejectCallRequest,
  RejectCallResponse,
  ReportClientEventRequest,
  ReportClientEventResponse,
  RequestPermissionRequest,
  RequestPermissionResponse,
  ResolveSipAuthRequest,
  ResolveSipAuthResponse,
  ResolveSipInboundRequest,
  ResolveSipInboundResponse,
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

export class VideoApi {
  constructor(public readonly apiClient: ApiClient) {}

  queryCallMembers(
    request: QueryCallMembersRequest,
  ): Promise<StreamResponse<QueryCallMembersResponse>> {
    return this.apiClient.sendRequest<QueryCallMembersResponse>(
      'POST',
      '/api/v2/video/call/members',
      undefined,
      undefined,
      request,
      'application/json',
    );
  }

  queryCallStats(
    request?: QueryCallStatsRequest,
  ): Promise<StreamResponse<QueryCallStatsResponse>> {
    return this.apiClient.sendRequest<QueryCallStatsResponse>(
      'POST',
      '/api/v2/video/call/stats',
      undefined,
      undefined,
      request,
      'application/json',
    );
  }

  getCall(
    pathParams: { type: string; id: string },
    request?: {
      connection_id?: string;
      members_limit?: number;
      ring?: boolean;
      notify?: boolean;
      video?: boolean;
    },
  ): Promise<StreamResponse<GetCallResponse>> {
    return this.apiClient.sendRequest<GetCallResponse>(
      'GET',
      '/api/v2/video/call/{type}/{id}',
      pathParams,
      request,
    );
  }

  updateCall(
    pathParams: { type: string; id: string },
    request?: UpdateCallRequest,
  ): Promise<StreamResponse<UpdateCallResponse>> {
    return this.apiClient.sendRequest<UpdateCallResponse>(
      'PATCH',
      '/api/v2/video/call/{type}/{id}',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  getOrCreateCall(
    pathParams: { type: string; id: string },
    request?: GetOrCreateCallRequest & { connection_id?: string },
  ): Promise<StreamResponse<GetOrCreateCallResponse>> {
    const { connection_id, ...body } = request ?? {};
    const queryParams = { connection_id };

    return this.apiClient.sendRequest<GetOrCreateCallResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}',
      pathParams,
      queryParams,
      body,
      'application/json',
    );
  }

  acceptCall(pathParams: {
    type: string;
    id: string;
  }): Promise<StreamResponse<AcceptCallResponse>> {
    return this.apiClient.sendRequest<AcceptCallResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/accept',
      pathParams,
      undefined,
    );
  }

  blockUser(
    pathParams: { type: string; id: string },
    request: BlockUserRequest,
  ): Promise<StreamResponse<BlockUserResponse>> {
    return this.apiClient.sendRequest<BlockUserResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/block',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  deleteCall(
    pathParams: { type: string; id: string },
    request?: DeleteCallRequest,
  ): Promise<StreamResponse<DeleteCallResponse>> {
    return this.apiClient.sendRequest<DeleteCallResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/delete',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  sendCallEvent(
    pathParams: { type: string; id: string },
    request?: SendCallEventRequest,
  ): Promise<StreamResponse<SendCallEventResponse>> {
    return this.apiClient.sendRequest<SendCallEventResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/event',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  collectUserFeedback(
    pathParams: { type: string; id: string },
    request: CollectUserFeedbackRequest,
  ): Promise<StreamResponse<CollectUserFeedbackResponse>> {
    return this.apiClient.sendRequest<CollectUserFeedbackResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/feedback',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  goLive(
    pathParams: { type: string; id: string },
    request?: GoLiveRequest,
  ): Promise<StreamResponse<GoLiveResponse>> {
    return this.apiClient.sendRequest<GoLiveResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/go_live',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  joinCall(
    pathParams: { type: string; id: string },
    request: JoinCallRequest & { connection_id?: string },
  ): Promise<StreamResponse<JoinCallResponse>> {
    const { connection_id, ...body } = request;
    const queryParams = { connection_id };

    return this.apiClient.sendRequest<JoinCallResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/join',
      pathParams,
      queryParams,
      body,
      'application/json',
    );
  }

  kickUser(
    pathParams: { type: string; id: string },
    request: KickUserRequest,
  ): Promise<StreamResponse<KickUserResponse>> {
    return this.apiClient.sendRequest<KickUserResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/kick',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  endCall(pathParams: {
    type: string;
    id: string;
  }): Promise<StreamResponse<EndCallResponse>> {
    return this.apiClient.sendRequest<EndCallResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/mark_ended',
      pathParams,
      undefined,
    );
  }

  updateCallMembers(
    pathParams: { type: string; id: string },
    request?: UpdateCallMembersRequest,
  ): Promise<StreamResponse<UpdateCallMembersResponse>> {
    return this.apiClient.sendRequest<UpdateCallMembersResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/members',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  muteUsers(
    pathParams: { type: string; id: string },
    request?: MuteUsersRequest,
  ): Promise<StreamResponse<MuteUsersResponse>> {
    return this.apiClient.sendRequest<MuteUsersResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/mute_users',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  queryCallParticipants(
    pathParams: { id: string; type: string },
    request?: QueryCallParticipantsRequest & { limit?: number },
  ): Promise<StreamResponse<QueryCallParticipantsResponse>> {
    const { limit, ...body } = request ?? {};
    const queryParams = { limit };

    return this.apiClient.sendRequest<QueryCallParticipantsResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/participants',
      pathParams,
      queryParams,
      body,
      'application/json',
    );
  }

  videoPin(
    pathParams: { type: string; id: string },
    request: PinRequest,
  ): Promise<StreamResponse<PinResponse>> {
    return this.apiClient.sendRequest<PinResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/pin',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  sendVideoReaction(
    pathParams: { type: string; id: string },
    request: SendVideoReactionRequest,
  ): Promise<StreamResponse<SendVideoReactionResponse>> {
    return this.apiClient.sendRequest<SendVideoReactionResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/reaction',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  listRecordings(pathParams: {
    type: string;
    id: string;
  }): Promise<StreamResponse<ListRecordingsResponse>> {
    return this.apiClient.sendRequest<ListRecordingsResponse>(
      'GET',
      '/api/v2/video/call/{type}/{id}/recordings',
      pathParams,
      undefined,
    );
  }

  startRecording(
    pathParams: { type: string; id: string; recording_type: string },
    request?: StartRecordingRequest,
  ): Promise<StreamResponse<StartRecordingResponse>> {
    return this.apiClient.sendRequest<StartRecordingResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/recordings/{recording_type}/start',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  stopRecording(
    pathParams: { type: string; id: string; recording_type: string },
    request?: StopRecordingRequest,
  ): Promise<StreamResponse<StopRecordingResponse>> {
    return this.apiClient.sendRequest<StopRecordingResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/recordings/{recording_type}/stop',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  rejectCall(
    pathParams: { type: string; id: string },
    request?: RejectCallRequest,
  ): Promise<StreamResponse<RejectCallResponse>> {
    return this.apiClient.sendRequest<RejectCallResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/reject',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  getCallReport(
    pathParams: { type: string; id: string },
    request?: { session_id?: string },
  ): Promise<StreamResponse<GetCallReportResponse>> {
    return this.apiClient.sendRequest<GetCallReportResponse>(
      'GET',
      '/api/v2/video/call/{type}/{id}/report',
      pathParams,
      request,
    );
  }

  requestPermission(
    pathParams: { type: string; id: string },
    request: RequestPermissionRequest,
  ): Promise<StreamResponse<RequestPermissionResponse>> {
    return this.apiClient.sendRequest<RequestPermissionResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/request_permission',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  ringCall(
    pathParams: { type: string; id: string },
    request?: RingCallRequest,
  ): Promise<StreamResponse<RingCallResponse>> {
    return this.apiClient.sendRequest<RingCallResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/ring',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  getCallRingState(
    pathParams: { type: string; id: string },
    request: { call_session_id: string },
  ): Promise<StreamResponse<GetCallRingStateResponse>> {
    return this.apiClient.sendRequest<GetCallRingStateResponse>(
      'GET',
      '/api/v2/video/call/{type}/{id}/ring_state',
      pathParams,
      request,
    );
  }

  startRTMPBroadcasts(
    pathParams: { type: string; id: string },
    request: StartRTMPBroadcastsRequest,
  ): Promise<StreamResponse<StartRTMPBroadcastsResponse>> {
    return this.apiClient.sendRequest<StartRTMPBroadcastsResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/rtmp_broadcasts',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  stopAllRTMPBroadcasts(pathParams: {
    type: string;
    id: string;
  }): Promise<StreamResponse<StopAllRTMPBroadcastsResponse>> {
    return this.apiClient.sendRequest<StopAllRTMPBroadcastsResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/rtmp_broadcasts/stop',
      pathParams,
      undefined,
    );
  }

  stopRTMPBroadcast(
    pathParams: { type: string; id: string; name: string },
    request?: StopRTMPBroadcastsRequest,
  ): Promise<StreamResponse<StopRTMPBroadcastsResponse>> {
    return this.apiClient.sendRequest<StopRTMPBroadcastsResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/rtmp_broadcasts/{name}/stop',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  getCallParticipantSessionMetrics(
    pathParams: {
      type: string;
      id: string;
      session: string;
      user: string;
      user_session: string;
    },
    request?: { since?: Date; until?: Date },
  ): Promise<StreamResponse<GetCallParticipantSessionMetricsResponse>> {
    return this.apiClient.sendRequest<GetCallParticipantSessionMetricsResponse>(
      'GET',
      '/api/v2/video/call/{type}/{id}/session/{session}/participant/{user}/{user_session}/details/track',
      pathParams,
      request,
    );
  }

  queryCallParticipantSessions(
    pathParams: { type: string; id: string; session: string },
    request?: {
      limit?: number;
      prev?: string;
      next?: string;
      filter_conditions?: Record<string, any>;
    },
  ): Promise<StreamResponse<QueryCallParticipantSessionsResponse>> {
    return this.apiClient.sendRequest<QueryCallParticipantSessionsResponse>(
      'GET',
      '/api/v2/video/call/{type}/{id}/session/{session}/participant_sessions',
      pathParams,
      request,
    );
  }

  startHLSBroadcasting(pathParams: {
    type: string;
    id: string;
  }): Promise<StreamResponse<StartHLSBroadcastingResponse>> {
    return this.apiClient.sendRequest<StartHLSBroadcastingResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/start_broadcasting',
      pathParams,
      undefined,
    );
  }

  startClosedCaptions(
    pathParams: { type: string; id: string },
    request?: StartClosedCaptionsRequest,
  ): Promise<StreamResponse<StartClosedCaptionsResponse>> {
    return this.apiClient.sendRequest<StartClosedCaptionsResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/start_closed_captions',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  startFrameRecording(
    pathParams: { type: string; id: string },
    request?: StartFrameRecordingRequest,
  ): Promise<StreamResponse<StartFrameRecordingResponse>> {
    return this.apiClient.sendRequest<StartFrameRecordingResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/start_frame_recording',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  startTranscription(
    pathParams: { type: string; id: string },
    request?: StartTranscriptionRequest,
  ): Promise<StreamResponse<StartTranscriptionResponse>> {
    return this.apiClient.sendRequest<StartTranscriptionResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/start_transcription',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  stopHLSBroadcasting(pathParams: {
    type: string;
    id: string;
  }): Promise<StreamResponse<StopHLSBroadcastingResponse>> {
    return this.apiClient.sendRequest<StopHLSBroadcastingResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/stop_broadcasting',
      pathParams,
      undefined,
    );
  }

  stopClosedCaptions(
    pathParams: { type: string; id: string },
    request?: StopClosedCaptionsRequest,
  ): Promise<StreamResponse<StopClosedCaptionsResponse>> {
    return this.apiClient.sendRequest<StopClosedCaptionsResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/stop_closed_captions',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  stopFrameRecording(pathParams: {
    type: string;
    id: string;
  }): Promise<StreamResponse<StopFrameRecordingResponse>> {
    return this.apiClient.sendRequest<StopFrameRecordingResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/stop_frame_recording',
      pathParams,
      undefined,
    );
  }

  stopLive(
    pathParams: { type: string; id: string },
    request?: StopLiveRequest,
  ): Promise<StreamResponse<StopLiveResponse>> {
    return this.apiClient.sendRequest<StopLiveResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/stop_live',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  stopTranscription(
    pathParams: { type: string; id: string },
    request?: StopTranscriptionRequest,
  ): Promise<StreamResponse<StopTranscriptionResponse>> {
    return this.apiClient.sendRequest<StopTranscriptionResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/stop_transcription',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  listTranscriptions(pathParams: {
    type: string;
    id: string;
  }): Promise<StreamResponse<ListTranscriptionsResponse>> {
    return this.apiClient.sendRequest<ListTranscriptionsResponse>(
      'GET',
      '/api/v2/video/call/{type}/{id}/transcriptions',
      pathParams,
      undefined,
    );
  }

  unblockUser(
    pathParams: { type: string; id: string },
    request: UnblockUserRequest,
  ): Promise<StreamResponse<UnblockUserResponse>> {
    return this.apiClient.sendRequest<UnblockUserResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/unblock',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  videoUnpin(
    pathParams: { type: string; id: string },
    request: UnpinRequest,
  ): Promise<StreamResponse<UnpinResponse>> {
    return this.apiClient.sendRequest<UnpinResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/unpin',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  updateUserPermissions(
    pathParams: { type: string; id: string },
    request: UpdateUserPermissionsRequest,
  ): Promise<StreamResponse<UpdateUserPermissionsResponse>> {
    return this.apiClient.sendRequest<UpdateUserPermissionsResponse>(
      'POST',
      '/api/v2/video/call/{type}/{id}/user_permissions',
      pathParams,
      undefined,
      request,
      'application/json',
    );
  }

  deleteRecording(pathParams: {
    type: string;
    id: string;
    session: string;
    filename: string;
  }): Promise<StreamResponse<DeleteRecordingResponse>> {
    return this.apiClient.sendRequest<DeleteRecordingResponse>(
      'DELETE',
      '/api/v2/video/call/{type}/{id}/{session}/recordings/{filename}',
      pathParams,
      undefined,
    );
  }

  deleteTranscription(pathParams: {
    type: string;
    id: string;
    session: string;
    filename: string;
  }): Promise<StreamResponse<DeleteTranscriptionResponse>> {
    return this.apiClient.sendRequest<DeleteTranscriptionResponse>(
      'DELETE',
      '/api/v2/video/call/{type}/{id}/{session}/transcriptions/{filename}',
      pathParams,
      undefined,
    );
  }

  reportClientCallEvent(
    request: ReportClientEventRequest,
  ): Promise<StreamResponse<ReportClientEventResponse>> {
    return this.apiClient.sendRequest<ReportClientEventResponse>(
      'POST',
      '/api/v2/video/call_client_event',
      undefined,
      undefined,
      request,
      'application/json',
    );
  }

  queryCallSessionStats(
    request?: QueryCallSessionStatsRequest,
  ): Promise<StreamResponse<QueryCallSessionStatsResponse>> {
    return this.apiClient.sendRequest<QueryCallSessionStatsResponse>(
      'POST',
      '/api/v2/video/call_stats',
      undefined,
      undefined,
      request,
      'application/json',
    );
  }

  getCallStatsMap(
    pathParams: { call_type: string; call_id: string; session: string },
    request?: {
      start_time?: Date;
      end_time?: Date;
      exclude_publishers?: boolean;
      exclude_subscribers?: boolean;
      exclude_sfus?: boolean;
    },
  ): Promise<StreamResponse<QueryCallStatsMapResponse>> {
    return this.apiClient.sendRequest<QueryCallStatsMapResponse>(
      'GET',
      '/api/v2/video/call_stats/{call_type}/{call_id}/{session}/map',
      pathParams,
      request,
    );
  }

  getCallSessionParticipantStatsDetails(
    pathParams: {
      call_type: string;
      call_id: string;
      session: string;
      user: string;
      user_session: string;
    },
    request?: { since?: string; until?: string; max_points?: number },
  ): Promise<StreamResponse<GetCallSessionParticipantStatsDetailsResponse>> {
    return this.apiClient.sendRequest<GetCallSessionParticipantStatsDetailsResponse>(
      'GET',
      '/api/v2/video/call_stats/{call_type}/{call_id}/{session}/participant/{user}/{user_session}/details',
      pathParams,
      request,
    );
  }

  queryCallSessionParticipantStats(
    pathParams: { call_type: string; call_id: string; session: string },
    request?: {
      limit?: number;
      prev?: string;
      next?: string;
      sort?: Array<SortParamRequest>;
      filter_conditions?: Record<string, any>;
    },
  ): Promise<StreamResponse<QueryCallSessionParticipantStatsResponse>> {
    return this.apiClient.sendRequest<QueryCallSessionParticipantStatsResponse>(
      'GET',
      '/api/v2/video/call_stats/{call_type}/{call_id}/{session}/participants',
      pathParams,
      request,
    );
  }

  getCallSessionParticipantStatsTimeline(
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
    return this.apiClient.sendRequest<QueryCallSessionParticipantStatsTimelineResponse>(
      'GET',
      '/api/v2/video/call_stats/{call_type}/{call_id}/{session}/participants/{user}/{user_session}/timeline',
      pathParams,
      request,
    );
  }

  queryCalls(
    request?: QueryCallsRequest & { connection_id?: string },
  ): Promise<StreamResponse<QueryCallsResponse>> {
    const { connection_id, ...body } = request ?? {};
    const queryParams = { connection_id };

    return this.apiClient.sendRequest<QueryCallsResponse>(
      'POST',
      '/api/v2/video/calls',
      undefined,
      queryParams,
      body,
      'application/json',
    );
  }

  getEdges(): Promise<StreamResponse<GetEdgesResponse>> {
    return this.apiClient.sendRequest<GetEdgesResponse>(
      'GET',
      '/api/v2/video/edges',
      undefined,
      undefined,
    );
  }

  resolveSipAuth(
    request: ResolveSipAuthRequest,
  ): Promise<StreamResponse<ResolveSipAuthResponse>> {
    return this.apiClient.sendRequest<ResolveSipAuthResponse>(
      'POST',
      '/api/v2/video/sip/auth',
      undefined,
      undefined,
      request,
      'application/json',
    );
  }

  resolveSipInbound(
    request: ResolveSipInboundRequest,
  ): Promise<StreamResponse<ResolveSipInboundResponse>> {
    return this.apiClient.sendRequest<ResolveSipInboundResponse>(
      'POST',
      '/api/v2/video/sip/resolve',
      undefined,
      undefined,
      request,
      'application/json',
    );
  }

  queryAggregateCallStats(
    request?: QueryAggregateCallStatsRequest,
  ): Promise<StreamResponse<QueryAggregateCallStatsResponse>> {
    return this.apiClient.sendRequest<QueryAggregateCallStatsResponse>(
      'POST',
      '/api/v2/video/stats',
      undefined,
      undefined,
      request,
      'application/json',
    );
  }
}

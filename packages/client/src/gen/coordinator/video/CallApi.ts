import type { StreamResponse, VideoApi } from '../../gen-imports';
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
  QueryCallParticipantSessionsResponse,
  QueryCallParticipantsRequest,
  QueryCallParticipantsResponse,
  RejectCallRequest,
  RejectCallResponse,
  RequestPermissionRequest,
  RequestPermissionResponse,
  RingCallRequest,
  RingCallResponse,
  SendCallEventRequest,
  SendCallEventResponse,
  SendVideoReactionRequest,
  SendVideoReactionResponse,
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

export class CallApi {
  constructor(
    protected videoApi: VideoApi,
    public readonly type: string,
    public readonly id: string,
  ) {}

  get(request?: {
    connection_id?: string;
    members_limit?: number;
    ring?: boolean;
    notify?: boolean;
    video?: boolean;
  }): Promise<StreamResponse<GetCallResponse>> {
    return this.videoApi.getCall({ id: this.id, type: this.type }, request);
  }

  update(
    request?: UpdateCallRequest,
  ): Promise<StreamResponse<UpdateCallResponse>> {
    return this.videoApi.updateCall({ id: this.id, type: this.type }, request);
  }

  getOrCreate(
    request?: GetOrCreateCallRequest & { connection_id?: string },
  ): Promise<StreamResponse<GetOrCreateCallResponse>> {
    return this.videoApi.getOrCreateCall(
      { id: this.id, type: this.type },
      request,
    );
  }

  accept(): Promise<StreamResponse<AcceptCallResponse>> {
    return this.videoApi.acceptCall({ id: this.id, type: this.type });
  }

  blockUser(
    request: BlockUserRequest,
  ): Promise<StreamResponse<BlockUserResponse>> {
    return this.videoApi.blockUser({ id: this.id, type: this.type }, request);
  }

  delete(
    request?: DeleteCallRequest,
  ): Promise<StreamResponse<DeleteCallResponse>> {
    return this.videoApi.deleteCall({ id: this.id, type: this.type }, request);
  }

  sendCallEvent(
    request?: SendCallEventRequest,
  ): Promise<StreamResponse<SendCallEventResponse>> {
    return this.videoApi.sendCallEvent(
      { id: this.id, type: this.type },
      request,
    );
  }

  collectUserFeedback(
    request: CollectUserFeedbackRequest,
  ): Promise<StreamResponse<CollectUserFeedbackResponse>> {
    return this.videoApi.collectUserFeedback(
      { id: this.id, type: this.type },
      request,
    );
  }

  goLive(request?: GoLiveRequest): Promise<StreamResponse<GoLiveResponse>> {
    return this.videoApi.goLive({ id: this.id, type: this.type }, request);
  }

  join(
    request: JoinCallRequest & { connection_id?: string },
  ): Promise<StreamResponse<JoinCallResponse>> {
    return this.videoApi.joinCall({ id: this.id, type: this.type }, request);
  }

  kickUser(
    request: KickUserRequest,
  ): Promise<StreamResponse<KickUserResponse>> {
    return this.videoApi.kickUser({ id: this.id, type: this.type }, request);
  }

  end(): Promise<StreamResponse<EndCallResponse>> {
    return this.videoApi.endCall({ id: this.id, type: this.type });
  }

  updateCallMembers(
    request?: UpdateCallMembersRequest,
  ): Promise<StreamResponse<UpdateCallMembersResponse>> {
    return this.videoApi.updateCallMembers(
      { id: this.id, type: this.type },
      request,
    );
  }

  muteUsers(
    request?: MuteUsersRequest,
  ): Promise<StreamResponse<MuteUsersResponse>> {
    return this.videoApi.muteUsers({ id: this.id, type: this.type }, request);
  }

  queryCallParticipants(
    request?: QueryCallParticipantsRequest & { limit?: number },
  ): Promise<StreamResponse<QueryCallParticipantsResponse>> {
    return this.videoApi.queryCallParticipants(
      { id: this.id, type: this.type },
      request,
    );
  }

  videoPin(request: PinRequest): Promise<StreamResponse<PinResponse>> {
    return this.videoApi.videoPin({ id: this.id, type: this.type }, request);
  }

  sendVideoReaction(
    request: SendVideoReactionRequest,
  ): Promise<StreamResponse<SendVideoReactionResponse>> {
    return this.videoApi.sendVideoReaction(
      { id: this.id, type: this.type },
      request,
    );
  }

  listRecordings(): Promise<StreamResponse<ListRecordingsResponse>> {
    return this.videoApi.listRecordings({ id: this.id, type: this.type });
  }

  startRecording(
    pathParams: { recording_type: string },
    request?: StartRecordingRequest,
  ): Promise<StreamResponse<StartRecordingResponse>> {
    return this.videoApi.startRecording(
      { id: this.id, type: this.type, ...pathParams },
      request,
    );
  }

  stopRecording(
    pathParams: { recording_type: string },
    request?: StopRecordingRequest,
  ): Promise<StreamResponse<StopRecordingResponse>> {
    return this.videoApi.stopRecording(
      { id: this.id, type: this.type, ...pathParams },
      request,
    );
  }

  reject(
    request?: RejectCallRequest,
  ): Promise<StreamResponse<RejectCallResponse>> {
    return this.videoApi.rejectCall({ id: this.id, type: this.type }, request);
  }

  getCallReport(request?: {
    session_id?: string;
  }): Promise<StreamResponse<GetCallReportResponse>> {
    return this.videoApi.getCallReport(
      { id: this.id, type: this.type },
      request,
    );
  }

  requestPermission(
    request: RequestPermissionRequest,
  ): Promise<StreamResponse<RequestPermissionResponse>> {
    return this.videoApi.requestPermission(
      { id: this.id, type: this.type },
      request,
    );
  }

  ring(request?: RingCallRequest): Promise<StreamResponse<RingCallResponse>> {
    return this.videoApi.ringCall({ id: this.id, type: this.type }, request);
  }

  getCallRingState(request: {
    call_session_id: string;
  }): Promise<StreamResponse<GetCallRingStateResponse>> {
    return this.videoApi.getCallRingState(
      { id: this.id, type: this.type },
      request,
    );
  }

  startRTMPBroadcasts(
    request: StartRTMPBroadcastsRequest,
  ): Promise<StreamResponse<StartRTMPBroadcastsResponse>> {
    return this.videoApi.startRTMPBroadcasts(
      { id: this.id, type: this.type },
      request,
    );
  }

  stopAllRTMPBroadcasts(): Promise<
    StreamResponse<StopAllRTMPBroadcastsResponse>
  > {
    return this.videoApi.stopAllRTMPBroadcasts({
      id: this.id,
      type: this.type,
    });
  }

  stopRTMPBroadcast(
    pathParams: { name: string },
    request?: StopRTMPBroadcastsRequest,
  ): Promise<StreamResponse<StopRTMPBroadcastsResponse>> {
    return this.videoApi.stopRTMPBroadcast(
      { id: this.id, type: this.type, ...pathParams },
      request,
    );
  }

  getCallParticipantSessionMetrics(
    pathParams: { session: string; user: string; user_session: string },
    request?: { since?: Date; until?: Date },
  ): Promise<StreamResponse<GetCallParticipantSessionMetricsResponse>> {
    return this.videoApi.getCallParticipantSessionMetrics(
      { id: this.id, type: this.type, ...pathParams },
      request,
    );
  }

  queryCallParticipantSessions(
    pathParams: { session: string },
    request?: {
      limit?: number;
      prev?: string;
      next?: string;
      filter_conditions?: Record<string, any>;
    },
  ): Promise<StreamResponse<QueryCallParticipantSessionsResponse>> {
    return this.videoApi.queryCallParticipantSessions(
      { id: this.id, type: this.type, ...pathParams },
      request,
    );
  }

  startHLSBroadcasting(): Promise<
    StreamResponse<StartHLSBroadcastingResponse>
  > {
    return this.videoApi.startHLSBroadcasting({ id: this.id, type: this.type });
  }

  startClosedCaptions(
    request?: StartClosedCaptionsRequest,
  ): Promise<StreamResponse<StartClosedCaptionsResponse>> {
    return this.videoApi.startClosedCaptions(
      { id: this.id, type: this.type },
      request,
    );
  }

  startFrameRecording(
    request?: StartFrameRecordingRequest,
  ): Promise<StreamResponse<StartFrameRecordingResponse>> {
    return this.videoApi.startFrameRecording(
      { id: this.id, type: this.type },
      request,
    );
  }

  startTranscription(
    request?: StartTranscriptionRequest,
  ): Promise<StreamResponse<StartTranscriptionResponse>> {
    return this.videoApi.startTranscription(
      { id: this.id, type: this.type },
      request,
    );
  }

  stopHLSBroadcasting(): Promise<StreamResponse<StopHLSBroadcastingResponse>> {
    return this.videoApi.stopHLSBroadcasting({ id: this.id, type: this.type });
  }

  stopClosedCaptions(
    request?: StopClosedCaptionsRequest,
  ): Promise<StreamResponse<StopClosedCaptionsResponse>> {
    return this.videoApi.stopClosedCaptions(
      { id: this.id, type: this.type },
      request,
    );
  }

  stopFrameRecording(): Promise<StreamResponse<StopFrameRecordingResponse>> {
    return this.videoApi.stopFrameRecording({ id: this.id, type: this.type });
  }

  stopLive(
    request?: StopLiveRequest,
  ): Promise<StreamResponse<StopLiveResponse>> {
    return this.videoApi.stopLive({ id: this.id, type: this.type }, request);
  }

  stopTranscription(
    request?: StopTranscriptionRequest,
  ): Promise<StreamResponse<StopTranscriptionResponse>> {
    return this.videoApi.stopTranscription(
      { id: this.id, type: this.type },
      request,
    );
  }

  listTranscriptions(): Promise<StreamResponse<ListTranscriptionsResponse>> {
    return this.videoApi.listTranscriptions({ id: this.id, type: this.type });
  }

  unblockUser(
    request: UnblockUserRequest,
  ): Promise<StreamResponse<UnblockUserResponse>> {
    return this.videoApi.unblockUser({ id: this.id, type: this.type }, request);
  }

  videoUnpin(request: UnpinRequest): Promise<StreamResponse<UnpinResponse>> {
    return this.videoApi.videoUnpin({ id: this.id, type: this.type }, request);
  }

  updateUserPermissions(
    request: UpdateUserPermissionsRequest,
  ): Promise<StreamResponse<UpdateUserPermissionsResponse>> {
    return this.videoApi.updateUserPermissions(
      { id: this.id, type: this.type },
      request,
    );
  }

  deleteRecording(pathParams: {
    session: string;
    filename: string;
  }): Promise<StreamResponse<DeleteRecordingResponse>> {
    return this.videoApi.deleteRecording({
      id: this.id,
      type: this.type,
      ...pathParams,
    });
  }

  deleteTranscription(pathParams: {
    session: string;
    filename: string;
  }): Promise<StreamResponse<DeleteTranscriptionResponse>> {
    return this.videoApi.deleteTranscription({
      id: this.id,
      type: this.type,
      ...pathParams,
    });
  }
}

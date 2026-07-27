import { StreamResponse, VideoApi } from '../../gen-imports';
import {
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
  GetCallReportResponse,
  GetCallResponse,
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

type CallPathParams = {
  type: string;
  id: string;
};

const splitQueryParam = <T extends object, K extends keyof T & string>(
  request: T | undefined,
  key: K,
): { query?: { [P in K]?: T[P] }; body?: Omit<T, K> } => {
  if (!request) return {};
  const { [key]: value, ...body } = request;
  const query =
    value !== undefined ? ({ [key]: value } as { [P in K]?: T[P] }) : undefined;
  return { query, body };
};

export class CallApi {
  protected videoApi: VideoApi;
  public readonly type: string;
  public readonly id: string;

  constructor(videoApi: VideoApi, type: string, id: string) {
    this.videoApi = videoApi;
    this.type = type;
    this.id = id;
  }

  private pathParams = (): CallPathParams => ({
    type: this.type,
    id: this.id,
  });

  private run = <R, T>(
    fn: (pathParams: CallPathParams, request?: R) => Promise<StreamResponse<T>>,
    request?: R,
  ): Promise<StreamResponse<T>> => {
    return fn.call(this.videoApi, this.pathParams(), request);
  };

  private runWithOptions = <Query extends object, Body, T>(
    fn: (options: {
      params: { path: CallPathParams; query?: Query };
      body?: Body;
    }) => Promise<StreamResponse<T>>,
    query?: Query,
    body?: Body,
  ): Promise<StreamResponse<T>> => {
    return fn.call(this.videoApi, {
      params: {
        path: this.pathParams(),
        ...(query ? { query } : null),
      },
      ...(body !== undefined ? { body } : null),
    });
  };

  private runWithPathParams = <Extra extends object, R, T>(
    fn: (
      pathParams: CallPathParams & Extra,
      request?: R,
    ) => Promise<StreamResponse<T>>,
    extraPathParams: Extra,
    request?: R,
  ): Promise<StreamResponse<T>> => {
    return fn.call(
      this.videoApi,
      { ...this.pathParams(), ...extraPathParams },
      request,
    );
  };

  get = (request?: {
    connection_id?: string;
    members_limit?: number;
    ring?: boolean;
    notify?: boolean;
    video?: boolean;
  }): Promise<StreamResponse<GetCallResponse>> => {
    return this.run(this.videoApi.getCall, request);
  };

  update = (
    request?: UpdateCallRequest,
  ): Promise<StreamResponse<UpdateCallResponse>> => {
    return this.run(this.videoApi.updateCall, request);
  };

  getOrCreate = (
    request?: GetOrCreateCallRequest & { connection_id?: string },
  ): Promise<StreamResponse<GetOrCreateCallResponse>> => {
    const { query, body } = splitQueryParam(request, 'connection_id');
    return this.runWithOptions(this.videoApi.getOrCreateCall, query, body);
  };

  accept = (): Promise<StreamResponse<AcceptCallResponse>> => {
    return this.run(this.videoApi.acceptCall);
  };

  blockUser = (
    request: BlockUserRequest,
  ): Promise<StreamResponse<BlockUserResponse>> => {
    return this.run(this.videoApi.blockUser, request);
  };

  delete = (
    request?: DeleteCallRequest,
  ): Promise<StreamResponse<DeleteCallResponse>> => {
    return this.run(this.videoApi.deleteCall, request);
  };

  sendCallEvent = (
    request?: SendCallEventRequest,
  ): Promise<StreamResponse<SendCallEventResponse>> => {
    return this.run(this.videoApi.sendCallEvent, request);
  };

  collectUserFeedback = (
    request: CollectUserFeedbackRequest,
  ): Promise<StreamResponse<CollectUserFeedbackResponse>> => {
    return this.run(this.videoApi.collectUserFeedback, request);
  };

  goLive = (
    request?: GoLiveRequest,
  ): Promise<StreamResponse<GoLiveResponse>> => {
    return this.run(this.videoApi.goLive, request);
  };

  join = (
    request: JoinCallRequest & { connection_id?: string },
  ): Promise<StreamResponse<JoinCallResponse>> => {
    const { query, body } = splitQueryParam(request, 'connection_id');
    return this.runWithOptions(this.videoApi.joinCall, query, body);
  };

  kickUser = (
    request: KickUserRequest,
  ): Promise<StreamResponse<KickUserResponse>> => {
    return this.run(this.videoApi.kickUser, request);
  };

  end = (): Promise<StreamResponse<EndCallResponse>> => {
    return this.run(this.videoApi.endCall);
  };

  updateCallMembers = (
    request?: UpdateCallMembersRequest,
  ): Promise<StreamResponse<UpdateCallMembersResponse>> => {
    return this.run(this.videoApi.updateCallMembers, request);
  };

  muteUsers = (
    request?: MuteUsersRequest,
  ): Promise<StreamResponse<MuteUsersResponse>> => {
    return this.run(this.videoApi.muteUsers, request);
  };

  queryCallParticipants = (
    request?: QueryCallParticipantsRequest & { limit?: number },
  ): Promise<StreamResponse<QueryCallParticipantsResponse>> => {
    const { query, body } = splitQueryParam(request, 'limit');
    return this.runWithOptions(
      this.videoApi.queryCallParticipants,
      query,
      body,
    );
  };

  videoPin = (request: PinRequest): Promise<StreamResponse<PinResponse>> => {
    return this.run(this.videoApi.videoPin, request);
  };

  sendVideoReaction = (
    request: SendVideoReactionRequest,
  ): Promise<StreamResponse<SendVideoReactionResponse>> => {
    return this.run(this.videoApi.sendVideoReaction, request);
  };

  listRecordings = (): Promise<StreamResponse<ListRecordingsResponse>> => {
    return this.run(this.videoApi.listRecordings);
  };

  startRecording = (
    request: StartRecordingRequest & { recording_type: string },
  ): Promise<StreamResponse<StartRecordingResponse>> => {
    const { recording_type, ...body } = request;
    return this.runWithPathParams(
      this.videoApi.startRecording,
      { recording_type },
      body,
    );
  };

  stopRecording = (
    request: StopRecordingRequest & { recording_type: string },
  ): Promise<StreamResponse<StopRecordingResponse>> => {
    const { recording_type, ...body } = request;
    return this.runWithPathParams(
      this.videoApi.stopRecording,
      { recording_type },
      body,
    );
  };

  reject = (
    request?: RejectCallRequest,
  ): Promise<StreamResponse<RejectCallResponse>> => {
    return this.run(this.videoApi.rejectCall, request);
  };

  getCallReport = (request?: {
    session_id?: string;
  }): Promise<StreamResponse<GetCallReportResponse>> => {
    return this.run(this.videoApi.getCallReport, request);
  };

  requestPermission = (
    request: RequestPermissionRequest,
  ): Promise<StreamResponse<RequestPermissionResponse>> => {
    return this.run(this.videoApi.requestPermission, request);
  };

  ring = (
    request?: RingCallRequest,
  ): Promise<StreamResponse<RingCallResponse>> => {
    return this.run(this.videoApi.ringCall, request);
  };

  startRTMPBroadcasts = (
    request: StartRTMPBroadcastsRequest,
  ): Promise<StreamResponse<StartRTMPBroadcastsResponse>> => {
    return this.run(this.videoApi.startRTMPBroadcasts, request);
  };

  stopAllRTMPBroadcasts = (): Promise<
    StreamResponse<StopAllRTMPBroadcastsResponse>
  > => {
    return this.run(this.videoApi.stopAllRTMPBroadcasts);
  };

  stopRTMPBroadcast = (
    request: StopRTMPBroadcastsRequest & { name: string },
  ): Promise<StreamResponse<StopRTMPBroadcastsResponse>> => {
    const { name, ...body } = request;
    return this.runWithPathParams(
      this.videoApi.stopRTMPBroadcast,
      { name },
      body,
    );
  };

  startHLSBroadcasting = (): Promise<
    StreamResponse<StartHLSBroadcastingResponse>
  > => {
    return this.run(this.videoApi.startHLSBroadcasting);
  };

  startClosedCaptions = (
    request?: StartClosedCaptionsRequest,
  ): Promise<StreamResponse<StartClosedCaptionsResponse>> => {
    return this.run(this.videoApi.startClosedCaptions, request);
  };

  startFrameRecording = (
    request?: StartFrameRecordingRequest,
  ): Promise<StreamResponse<StartFrameRecordingResponse>> => {
    return this.run(this.videoApi.startFrameRecording, request);
  };

  startTranscription = (
    request?: StartTranscriptionRequest,
  ): Promise<StreamResponse<StartTranscriptionResponse>> => {
    return this.run(this.videoApi.startTranscription, request);
  };

  stopHLSBroadcasting = (): Promise<
    StreamResponse<StopHLSBroadcastingResponse>
  > => {
    return this.run(this.videoApi.stopHLSBroadcasting);
  };

  stopClosedCaptions = (
    request?: StopClosedCaptionsRequest,
  ): Promise<StreamResponse<StopClosedCaptionsResponse>> => {
    return this.run(this.videoApi.stopClosedCaptions, request);
  };

  stopFrameRecording = (): Promise<
    StreamResponse<StopFrameRecordingResponse>
  > => {
    return this.run(this.videoApi.stopFrameRecording);
  };

  stopLive = (
    request?: StopLiveRequest,
  ): Promise<StreamResponse<StopLiveResponse>> => {
    return this.run(this.videoApi.stopLive, request);
  };

  stopTranscription = (
    request?: StopTranscriptionRequest,
  ): Promise<StreamResponse<StopTranscriptionResponse>> => {
    return this.run(this.videoApi.stopTranscription, request);
  };

  listTranscriptions = (): Promise<
    StreamResponse<ListTranscriptionsResponse>
  > => {
    return this.run(this.videoApi.listTranscriptions);
  };

  unblockUser = (
    request: UnblockUserRequest,
  ): Promise<StreamResponse<UnblockUserResponse>> => {
    return this.run(this.videoApi.unblockUser, request);
  };

  videoUnpin = (
    request: UnpinRequest,
  ): Promise<StreamResponse<UnpinResponse>> => {
    return this.run(this.videoApi.videoUnpin, request);
  };

  updateUserPermissions = (
    request: UpdateUserPermissionsRequest,
  ): Promise<StreamResponse<UpdateUserPermissionsResponse>> => {
    return this.run(this.videoApi.updateUserPermissions, request);
  };

  deleteRecording = (request: {
    session: string;
    filename: string;
  }): Promise<StreamResponse<DeleteRecordingResponse>> => {
    return this.runWithPathParams(this.videoApi.deleteRecording, request);
  };

  deleteTranscription = (request: {
    session: string;
    filename: string;
  }): Promise<StreamResponse<DeleteTranscriptionResponse>> => {
    return this.runWithPathParams(this.videoApi.deleteTranscription, request);
  };
}

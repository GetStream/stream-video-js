/* tslint:disable */
/* eslint-disable */
/**
 *
 * @export
 * @interface APIError
 */
export interface APIError {
  /**
   * Response HTTP status code
   * @type {number}
   * @memberof APIError
   */
  StatusCode: number;
  /**
   * API error code
   * @type {number}
   * @memberof APIError
   */
  code: number;
  /**
   * Additional error-specific information
   * @type {Array<number>}
   * @memberof APIError
   */
  details: Array<number>;
  /**
   * Request duration
   * @type {string}
   * @memberof APIError
   */
  duration: string;
  /**
   * Additional error info
   * @type {{ [key: string]: string; }}
   * @memberof APIError
   */
  exception_fields?: { [key: string]: string };
  /**
   * Message describing an error
   * @type {string}
   * @memberof APIError
   */
  message: string;
  /**
   * URL with additional information
   * @type {string}
   * @memberof APIError
   */
  more_info: string;
  /**
   * Flag that indicates if the error is unrecoverable, requests that return unrecoverable errors should not be retried, this error only applies to the request that caused it
   * @type {boolean}
   * @memberof APIError
   */
  unrecoverable?: boolean;
}
/**
 * AcceptCallResponse is the payload for accepting a call.
 * @export
 * @interface AcceptCallResponse
 */
export interface AcceptCallResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof AcceptCallResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface AggregatedStats
 */
export interface AggregatedStats {
  /**
   *
   * @type {PublisherAggregateStats}
   * @memberof AggregatedStats
   */
  publisher_aggregate_stats?: PublisherAggregateStats;
  /**
   *
   * @type {TURNAggregatedStats}
   * @memberof AggregatedStats
   */
  turn?: TURNAggregatedStats;
}
/**
 *
 * @export
 * @interface AudioSettingsRequest
 */
export interface AudioSettingsRequest {
  /**
   *
   * @type {boolean}
   * @memberof AudioSettingsRequest
   */
  access_request_enabled?: boolean;
  /**
   *
   * @type {string}
   * @memberof AudioSettingsRequest
   */
  default_device: AudioSettingsRequestDefaultDeviceEnum;
  /**
   *
   * @type {boolean}
   * @memberof AudioSettingsRequest
   */
  mic_default_on?: boolean;
  /**
   *
   * @type {NoiseCancellationSettings}
   * @memberof AudioSettingsRequest
   */
  noise_cancellation?: NoiseCancellationSettings;
  /**
   *
   * @type {boolean}
   * @memberof AudioSettingsRequest
   */
  opus_dtx_enabled?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof AudioSettingsRequest
   */
  redundant_coding_enabled?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof AudioSettingsRequest
   */
  speaker_default_on?: boolean;
}

/**
 * @export
 */
export const AudioSettingsRequestDefaultDeviceEnum = {
  SPEAKER: 'speaker',
  EARPIECE: 'earpiece',
} as const;
export type AudioSettingsRequestDefaultDeviceEnum =
  (typeof AudioSettingsRequestDefaultDeviceEnum)[keyof typeof AudioSettingsRequestDefaultDeviceEnum];

/**
 *
 * @export
 * @interface AudioSettingsResponse
 */
export interface AudioSettingsResponse {
  /**
   *
   * @type {boolean}
   * @memberof AudioSettingsResponse
   */
  access_request_enabled: boolean;
  /**
   *
   * @type {string}
   * @memberof AudioSettingsResponse
   */
  default_device: AudioSettingsResponseDefaultDeviceEnum;
  /**
   *
   * @type {boolean}
   * @memberof AudioSettingsResponse
   */
  mic_default_on: boolean;
  /**
   *
   * @type {NoiseCancellationSettings}
   * @memberof AudioSettingsResponse
   */
  noise_cancellation?: NoiseCancellationSettings;
  /**
   *
   * @type {boolean}
   * @memberof AudioSettingsResponse
   */
  opus_dtx_enabled: boolean;
  /**
   *
   * @type {boolean}
   * @memberof AudioSettingsResponse
   */
  redundant_coding_enabled: boolean;
  /**
   *
   * @type {boolean}
   * @memberof AudioSettingsResponse
   */
  speaker_default_on: boolean;
}

/**
 * @export
 */
export const AudioSettingsResponseDefaultDeviceEnum = {
  SPEAKER: 'speaker',
  EARPIECE: 'earpiece',
} as const;
export type AudioSettingsResponseDefaultDeviceEnum =
  (typeof AudioSettingsResponseDefaultDeviceEnum)[keyof typeof AudioSettingsResponseDefaultDeviceEnum];

/**
 *
 * @export
 * @interface BackstageSettingsRequest
 */
export interface BackstageSettingsRequest {
  /**
   *
   * @type {boolean}
   * @memberof BackstageSettingsRequest
   */
  enabled?: boolean;
  /**
   *
   * @type {number}
   * @memberof BackstageSettingsRequest
   */
  join_ahead_time_seconds?: number;
}
/**
 *
 * @export
 * @interface BackstageSettingsResponse
 */
export interface BackstageSettingsResponse {
  /**
   *
   * @type {boolean}
   * @memberof BackstageSettingsResponse
   */
  enabled: boolean;
  /**
   *
   * @type {number}
   * @memberof BackstageSettingsResponse
   */
  join_ahead_time_seconds?: number;
}
/**
 * BlockUserRequest is the payload for blocking a user.
 * @export
 * @interface BlockUserRequest
 */
export interface BlockUserRequest {
  /**
   * the user to block
   * @type {string}
   * @memberof BlockUserRequest
   */
  user_id: string;
}
/**
 * BlockUserResponse is the payload for blocking a user.
 * @export
 * @interface BlockUserResponse
 */
export interface BlockUserResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof BlockUserResponse
   */
  duration: string;
}
/**
 * This event is sent to call participants to notify when a user is blocked on a call, clients can use this event to show a notification.
 * If the user is the current user, the client should leave the call screen as well
 * @export
 * @interface BlockedUserEvent
 */
export interface BlockedUserEvent {
  /**
   *
   * @type {UserResponse}
   * @memberof BlockedUserEvent
   */
  blocked_by_user?: UserResponse;
  /**
   *
   * @type {string}
   * @memberof BlockedUserEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof BlockedUserEvent
   */
  created_at: string;
  /**
   * The type of event: "call.blocked_user" in this case
   * @type {string}
   * @memberof BlockedUserEvent
   */
  type: string;
  /**
   *
   * @type {UserResponse}
   * @memberof BlockedUserEvent
   */
  user: UserResponse;
}
/**
 *
 * @export
 * @interface Bound
 */
export interface Bound {
  /**
   *
   * @type {boolean}
   * @memberof Bound
   */
  inclusive: boolean;
  /**
   *
   * @type {number}
   * @memberof Bound
   */
  value: number;
}
/**
 *
 * @export
 * @interface BroadcastSettingsRequest
 */
export interface BroadcastSettingsRequest {
  /**
   *
   * @type {boolean}
   * @memberof BroadcastSettingsRequest
   */
  enabled?: boolean;
  /**
   *
   * @type {HLSSettingsRequest}
   * @memberof BroadcastSettingsRequest
   */
  hls?: HLSSettingsRequest;
  /**
   *
   * @type {RTMPSettingsRequest}
   * @memberof BroadcastSettingsRequest
   */
  rtmp?: RTMPSettingsRequest;
}
/**
 * BroadcastSettingsResponse is the payload for broadcasting settings
 * @export
 * @interface BroadcastSettingsResponse
 */
export interface BroadcastSettingsResponse {
  /**
   *
   * @type {boolean}
   * @memberof BroadcastSettingsResponse
   */
  enabled: boolean;
  /**
   *
   * @type {HLSSettingsResponse}
   * @memberof BroadcastSettingsResponse
   */
  hls: HLSSettingsResponse;
  /**
   *
   * @type {RTMPSettingsResponse}
   * @memberof BroadcastSettingsResponse
   */
  rtmp: RTMPSettingsResponse;
}
/**
 * This event is sent when a user accepts a notification to join a call.
 * @export
 * @interface CallAcceptedEvent
 */
export interface CallAcceptedEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallAcceptedEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallAcceptedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallAcceptedEvent
   */
  created_at: string;
  /**
   * The type of event: "call.accepted" in this case
   * @type {string}
   * @memberof CallAcceptedEvent
   */
  type: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CallAcceptedEvent
   */
  user: UserResponse;
}
/**
 * CallClosedCaption represents a closed caption of a call.
 * @export
 * @interface CallClosedCaption
 */
export interface CallClosedCaption {
  /**
   *
   * @type {string}
   * @memberof CallClosedCaption
   */
  end_time: string;
  /**
   *
   * @type {string}
   * @memberof CallClosedCaption
   */
  speaker_id: string;
  /**
   *
   * @type {string}
   * @memberof CallClosedCaption
   */
  start_time: string;
  /**
   *
   * @type {string}
   * @memberof CallClosedCaption
   */
  text: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CallClosedCaption
   */
  user: UserResponse;
}
/**
 * This event is sent when call closed captions has failed
 * @export
 * @interface CallClosedCaptionsFailedEvent
 */
export interface CallClosedCaptionsFailedEvent {
  /**
   *
   * @type {string}
   * @memberof CallClosedCaptionsFailedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallClosedCaptionsFailedEvent
   */
  created_at: string;
  /**
   * The type of event: "call.closed_captions_failed" in this case
   * @type {string}
   * @memberof CallClosedCaptionsFailedEvent
   */
  type: string;
}
/**
 * This event is sent when call closed caption has started
 * @export
 * @interface CallClosedCaptionsStartedEvent
 */
export interface CallClosedCaptionsStartedEvent {
  /**
   *
   * @type {string}
   * @memberof CallClosedCaptionsStartedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallClosedCaptionsStartedEvent
   */
  created_at: string;
  /**
   * The type of event: "call.closed_captions_started" in this case
   * @type {string}
   * @memberof CallClosedCaptionsStartedEvent
   */
  type: string;
}
/**
 * This event is sent when call closed captions has stopped
 * @export
 * @interface CallClosedCaptionsStoppedEvent
 */
export interface CallClosedCaptionsStoppedEvent {
  /**
   *
   * @type {string}
   * @memberof CallClosedCaptionsStoppedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallClosedCaptionsStoppedEvent
   */
  created_at: string;
  /**
   * The type of event: "call.transcription_stopped" in this case
   * @type {string}
   * @memberof CallClosedCaptionsStoppedEvent
   */
  type: string;
}
/**
 * This event is sent when a call is created. Clients receiving this event should check if the ringing
 * field is set to true and if so, show the call screen
 * @export
 * @interface CallCreatedEvent
 */
export interface CallCreatedEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallCreatedEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallCreatedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallCreatedEvent
   */
  created_at: string;
  /**
   * the members added to this call
   * @type {Array<MemberResponse>}
   * @memberof CallCreatedEvent
   */
  members: Array<MemberResponse>;
  /**
   * The type of event: "call.created" in this case
   * @type {string}
   * @memberof CallCreatedEvent
   */
  type: string;
}
/**
 * This event is sent when a call is deleted. Clients receiving this event should leave the call screen
 * @export
 * @interface CallDeletedEvent
 */
export interface CallDeletedEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallDeletedEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallDeletedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallDeletedEvent
   */
  created_at: string;
  /**
   * The type of event: "call.deleted" in this case
   * @type {string}
   * @memberof CallDeletedEvent
   */
  type: string;
}
/**
 *
 * @export
 * @interface CallDurationReport
 */
export interface CallDurationReport {
  /**
   *
   * @type {Array<ReportByHistogramBucket>}
   * @memberof CallDurationReport
   */
  histogram: Array<ReportByHistogramBucket>;
}
/**
 *
 * @export
 * @interface CallDurationReportResponse
 */
export interface CallDurationReportResponse {
  /**
   *
   * @type {Array<DailyAggregateCallDurationReportResponse>}
   * @memberof CallDurationReportResponse
   */
  daily: Array<DailyAggregateCallDurationReportResponse>;
}
/**
 * This event is sent when a call is mark as ended for all its participants. Clients receiving this event should leave the call screen
 * @export
 * @interface CallEndedEvent
 */
export interface CallEndedEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallEndedEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallEndedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallEndedEvent
   */
  created_at: string;
  /**
   * The type of event: "call.ended" in this case
   * @type {string}
   * @memberof CallEndedEvent
   */
  type: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CallEndedEvent
   */
  user?: UserResponse;
}
/**
 *
 * @export
 * @interface CallEvent
 */
export interface CallEvent {
  /**
   *
   * @type {string}
   * @memberof CallEvent
   */
  category?: string;
  /**
   *
   * @type {string}
   * @memberof CallEvent
   */
  component?: string;
  /**
   *
   * @type {string}
   * @memberof CallEvent
   */
  description: string;
  /**
   *
   * @type {number}
   * @memberof CallEvent
   */
  end_timestamp: number;
  /**
   *
   * @type {boolean}
   * @memberof CallEvent
   */
  internal: boolean;
  /**
   *
   * @type {Array<string>}
   * @memberof CallEvent
   */
  issue_tags?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof CallEvent
   */
  kind: string;
  /**
   *
   * @type {number}
   * @memberof CallEvent
   */
  severity: number;
  /**
   *
   * @type {number}
   * @memberof CallEvent
   */
  timestamp: number;
  /**
   *
   * @type {string}
   * @memberof CallEvent
   */
  type: string;
}
/**
 * This event is sent when HLS broadcasting has failed
 * @export
 * @interface CallHLSBroadcastingFailedEvent
 */
export interface CallHLSBroadcastingFailedEvent {
  /**
   *
   * @type {string}
   * @memberof CallHLSBroadcastingFailedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallHLSBroadcastingFailedEvent
   */
  created_at: string;
  /**
   * The type of event: "call.hls_broadcasting_failed" in this case
   * @type {string}
   * @memberof CallHLSBroadcastingFailedEvent
   */
  type: string;
}
/**
 * This event is sent when HLS broadcasting has started
 * @export
 * @interface CallHLSBroadcastingStartedEvent
 */
export interface CallHLSBroadcastingStartedEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallHLSBroadcastingStartedEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallHLSBroadcastingStartedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallHLSBroadcastingStartedEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof CallHLSBroadcastingStartedEvent
   */
  hls_playlist_url: string;
  /**
   * The type of event: "call.hls_broadcasting_started" in this case
   * @type {string}
   * @memberof CallHLSBroadcastingStartedEvent
   */
  type: string;
}
/**
 * This event is sent when HLS broadcasting has stopped
 * @export
 * @interface CallHLSBroadcastingStoppedEvent
 */
export interface CallHLSBroadcastingStoppedEvent {
  /**
   *
   * @type {string}
   * @memberof CallHLSBroadcastingStoppedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallHLSBroadcastingStoppedEvent
   */
  created_at: string;
  /**
   * The type of event: "call.hls_broadcasting_stopped" in this case
   * @type {string}
   * @memberof CallHLSBroadcastingStoppedEvent
   */
  type: string;
}
/**
 * CallIngressResponse is the payload for ingress settings
 * @export
 * @interface CallIngressResponse
 */
export interface CallIngressResponse {
  /**
   *
   * @type {RTMPIngress}
   * @memberof CallIngressResponse
   */
  rtmp: RTMPIngress;
}
/**
 * This event is sent when a call is started. Clients receiving this event should start the call.
 * @export
 * @interface CallLiveStartedEvent
 */
export interface CallLiveStartedEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallLiveStartedEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallLiveStartedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallLiveStartedEvent
   */
  created_at: string;
  /**
   * The type of event: "call.live_started" in this case
   * @type {string}
   * @memberof CallLiveStartedEvent
   */
  type: string;
}
/**
 * This event is sent when one or more members are added to a call
 * @export
 * @interface CallMemberAddedEvent
 */
export interface CallMemberAddedEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallMemberAddedEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallMemberAddedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallMemberAddedEvent
   */
  created_at: string;
  /**
   * the members added to this call
   * @type {Array<MemberResponse>}
   * @memberof CallMemberAddedEvent
   */
  members: Array<MemberResponse>;
  /**
   * The type of event: "call.member_added" in this case
   * @type {string}
   * @memberof CallMemberAddedEvent
   */
  type: string;
}
/**
 * This event is sent when one or more members are removed from a call
 * @export
 * @interface CallMemberRemovedEvent
 */
export interface CallMemberRemovedEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallMemberRemovedEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallMemberRemovedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallMemberRemovedEvent
   */
  created_at: string;
  /**
   * the list of member IDs removed from the call
   * @type {Array<string>}
   * @memberof CallMemberRemovedEvent
   */
  members: Array<string>;
  /**
   * The type of event: "call.member_removed" in this case
   * @type {string}
   * @memberof CallMemberRemovedEvent
   */
  type: string;
}
/**
 * This event is sent when one or more members are updated
 * @export
 * @interface CallMemberUpdatedEvent
 */
export interface CallMemberUpdatedEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallMemberUpdatedEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallMemberUpdatedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallMemberUpdatedEvent
   */
  created_at: string;
  /**
   * The list of members that were updated
   * @type {Array<MemberResponse>}
   * @memberof CallMemberUpdatedEvent
   */
  members: Array<MemberResponse>;
  /**
   * The type of event: "call.member_updated" in this case
   * @type {string}
   * @memberof CallMemberUpdatedEvent
   */
  type: string;
}
/**
 * This event is sent when one or more members get its role updated
 * @export
 * @interface CallMemberUpdatedPermissionEvent
 */
export interface CallMemberUpdatedPermissionEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallMemberUpdatedPermissionEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallMemberUpdatedPermissionEvent
   */
  call_cid: string;
  /**
   * The capabilities by role for this call
   * @type {{ [key: string]: Array<string>; }}
   * @memberof CallMemberUpdatedPermissionEvent
   */
  capabilities_by_role: { [key: string]: Array<string> };
  /**
   *
   * @type {string}
   * @memberof CallMemberUpdatedPermissionEvent
   */
  created_at: string;
  /**
   * The list of members that were updated
   * @type {Array<MemberResponse>}
   * @memberof CallMemberUpdatedPermissionEvent
   */
  members: Array<MemberResponse>;
  /**
   * The type of event: "call.member_added" in this case
   * @type {string}
   * @memberof CallMemberUpdatedPermissionEvent
   */
  type: string;
}
/**
 * This event is sent to call members who did not accept/reject/join the call to notify they missed the call
 * @export
 * @interface CallMissedEvent
 */
export interface CallMissedEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallMissedEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallMissedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallMissedEvent
   */
  created_at: string;
  /**
   * List of members who missed the call
   * @type {Array<MemberResponse>}
   * @memberof CallMissedEvent
   */
  members: Array<MemberResponse>;
  /**
   *
   * @type {boolean}
   * @memberof CallMissedEvent
   */
  notify_user: boolean;
  /**
   * Call session ID
   * @type {string}
   * @memberof CallMissedEvent
   */
  session_id: string;
  /**
   * The type of event: "call.notification" in this case
   * @type {string}
   * @memberof CallMissedEvent
   */
  type: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CallMissedEvent
   */
  user: UserResponse;
}
/**
 * This event is sent to all call members to notify they are getting called
 * @export
 * @interface CallNotificationEvent
 */
export interface CallNotificationEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallNotificationEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallNotificationEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallNotificationEvent
   */
  created_at: string;
  /**
   * Call members
   * @type {Array<MemberResponse>}
   * @memberof CallNotificationEvent
   */
  members: Array<MemberResponse>;
  /**
   * Call session ID
   * @type {string}
   * @memberof CallNotificationEvent
   */
  session_id: string;
  /**
   * The type of event: "call.notification" in this case
   * @type {string}
   * @memberof CallNotificationEvent
   */
  type: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CallNotificationEvent
   */
  user: UserResponse;
}
/**
 *
 * @export
 * @interface CallParticipantCountReport
 */
export interface CallParticipantCountReport {
  /**
   *
   * @type {Array<ReportByHistogramBucket>}
   * @memberof CallParticipantCountReport
   */
  histogram: Array<ReportByHistogramBucket>;
}
/**
 *
 * @export
 * @interface CallParticipantCountReportResponse
 */
export interface CallParticipantCountReportResponse {
  /**
   *
   * @type {Array<DailyAggregateCallParticipantCountReportResponse>}
   * @memberof CallParticipantCountReportResponse
   */
  daily: Array<DailyAggregateCallParticipantCountReportResponse>;
}
/**
 *
 * @export
 * @interface CallParticipantResponse
 */
export interface CallParticipantResponse {
  /**
   *
   * @type {string}
   * @memberof CallParticipantResponse
   */
  joined_at: string;
  /**
   *
   * @type {string}
   * @memberof CallParticipantResponse
   */
  role: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CallParticipantResponse
   */
  user: UserResponse;
  /**
   *
   * @type {string}
   * @memberof CallParticipantResponse
   */
  user_session_id: string;
}
/**
 * This event is sent when a reaction is sent in a call, clients should use this to show the reaction in the call screen
 * @export
 * @interface CallReactionEvent
 */
export interface CallReactionEvent {
  /**
   *
   * @type {string}
   * @memberof CallReactionEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallReactionEvent
   */
  created_at: string;
  /**
   *
   * @type {ReactionResponse}
   * @memberof CallReactionEvent
   */
  reaction: ReactionResponse;
  /**
   * The type of event: "call.reaction_new" in this case
   * @type {string}
   * @memberof CallReactionEvent
   */
  type: string;
}
/**
 * CallRecording represents a recording of a call.
 * @export
 * @interface CallRecording
 */
export interface CallRecording {
  /**
   *
   * @type {string}
   * @memberof CallRecording
   */
  end_time: string;
  /**
   *
   * @type {string}
   * @memberof CallRecording
   */
  filename: string;
  /**
   *
   * @type {string}
   * @memberof CallRecording
   */
  start_time: string;
  /**
   *
   * @type {string}
   * @memberof CallRecording
   */
  url: string;
}
/**
 * This event is sent when call recording has failed
 * @export
 * @interface CallRecordingFailedEvent
 */
export interface CallRecordingFailedEvent {
  /**
   *
   * @type {string}
   * @memberof CallRecordingFailedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallRecordingFailedEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof CallRecordingFailedEvent
   */
  egress_id: string;
  /**
   * The type of event: "call.recording_failed" in this case
   * @type {string}
   * @memberof CallRecordingFailedEvent
   */
  type: string;
}
/**
 * This event is sent when call recording is ready
 * @export
 * @interface CallRecordingReadyEvent
 */
export interface CallRecordingReadyEvent {
  /**
   *
   * @type {string}
   * @memberof CallRecordingReadyEvent
   */
  call_cid: string;
  /**
   *
   * @type {CallRecording}
   * @memberof CallRecordingReadyEvent
   */
  call_recording: CallRecording;
  /**
   *
   * @type {string}
   * @memberof CallRecordingReadyEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof CallRecordingReadyEvent
   */
  egress_id: string;
  /**
   * The type of event: "call.recording_ready" in this case
   * @type {string}
   * @memberof CallRecordingReadyEvent
   */
  type: string;
}
/**
 * This event is sent when call recording has started
 * @export
 * @interface CallRecordingStartedEvent
 */
export interface CallRecordingStartedEvent {
  /**
   *
   * @type {string}
   * @memberof CallRecordingStartedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallRecordingStartedEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof CallRecordingStartedEvent
   */
  egress_id: string;
  /**
   * The type of event: "call.recording_started" in this case
   * @type {string}
   * @memberof CallRecordingStartedEvent
   */
  type: string;
}
/**
 * This event is sent when call recording has stopped
 * @export
 * @interface CallRecordingStoppedEvent
 */
export interface CallRecordingStoppedEvent {
  /**
   *
   * @type {string}
   * @memberof CallRecordingStoppedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallRecordingStoppedEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof CallRecordingStoppedEvent
   */
  egress_id: string;
  /**
   * The type of event: "call.recording_stopped" in this case
   * @type {string}
   * @memberof CallRecordingStoppedEvent
   */
  type: string;
}
/**
 * This event is sent when a user rejects a notification to join a call.
 * @export
 * @interface CallRejectedEvent
 */
export interface CallRejectedEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallRejectedEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallRejectedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallRejectedEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof CallRejectedEvent
   */
  reason?: string;
  /**
   * The type of event: "call.rejected" in this case
   * @type {string}
   * @memberof CallRejectedEvent
   */
  type: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CallRejectedEvent
   */
  user: UserResponse;
}
/**
 * CallRequest is the payload for creating a call.
 * @export
 * @interface CallRequest
 */
export interface CallRequest {
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof CallRequest
   */
  custom?: { [key: string]: any };
  /**
   *
   * @type {Array<MemberRequest>}
   * @memberof CallRequest
   */
  members?: Array<MemberRequest>;
  /**
   *
   * @type {CallSettingsRequest}
   * @memberof CallRequest
   */
  settings_override?: CallSettingsRequest;
  /**
   *
   * @type {string}
   * @memberof CallRequest
   */
  starts_at?: string;
  /**
   *
   * @type {string}
   * @memberof CallRequest
   */
  team?: string;
  /**
   *
   * @type {boolean}
   * @memberof CallRequest
   */
  video?: boolean;
}
/**
 * Represents a call
 * @export
 * @interface CallResponse
 */
export interface CallResponse {
  /**
   *
   * @type {boolean}
   * @memberof CallResponse
   */
  backstage: boolean;
  /**
   *
   * @type {Array<string>}
   * @memberof CallResponse
   */
  blocked_user_ids: Array<string>;
  /**
   *
   * @type {boolean}
   * @memberof CallResponse
   */
  captioning: boolean;
  /**
   * The unique identifier for a call (<type>:<id>)
   * @type {string}
   * @memberof CallResponse
   */
  cid: string;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof CallResponse
   */
  created_at: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CallResponse
   */
  created_by: UserResponse;
  /**
   *
   * @type {string}
   * @memberof CallResponse
   */
  current_session_id: string;
  /**
   * Custom data for this object
   * @type {{ [key: string]: any; }}
   * @memberof CallResponse
   */
  custom: { [key: string]: any };
  /**
   *
   * @type {EgressResponse}
   * @memberof CallResponse
   */
  egress: EgressResponse;
  /**
   * Date/time when the call ended
   * @type {string}
   * @memberof CallResponse
   */
  ended_at?: string;
  /**
   * Call ID
   * @type {string}
   * @memberof CallResponse
   */
  id: string;
  /**
   *
   * @type {CallIngressResponse}
   * @memberof CallResponse
   */
  ingress: CallIngressResponse;
  /**
   *
   * @type {number}
   * @memberof CallResponse
   */
  join_ahead_time_seconds?: number;
  /**
   *
   * @type {boolean}
   * @memberof CallResponse
   */
  recording: boolean;
  /**
   *
   * @type {CallSessionResponse}
   * @memberof CallResponse
   */
  session?: CallSessionResponse;
  /**
   *
   * @type {CallSettingsResponse}
   * @memberof CallResponse
   */
  settings: CallSettingsResponse;
  /**
   * Date/time when the call will start
   * @type {string}
   * @memberof CallResponse
   */
  starts_at?: string;
  /**
   *
   * @type {string}
   * @memberof CallResponse
   */
  team?: string;
  /**
   *
   * @type {ThumbnailResponse}
   * @memberof CallResponse
   */
  thumbnails?: ThumbnailResponse;
  /**
   *
   * @type {boolean}
   * @memberof CallResponse
   */
  transcribing: boolean;
  /**
   * The type of call
   * @type {string}
   * @memberof CallResponse
   */
  type: string;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof CallResponse
   */
  updated_at: string;
}
/**
 * This event is sent to all call members to notify they are getting called
 * @export
 * @interface CallRingEvent
 */
export interface CallRingEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallRingEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallRingEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallRingEvent
   */
  created_at: string;
  /**
   * Call members
   * @type {Array<MemberResponse>}
   * @memberof CallRingEvent
   */
  members: Array<MemberResponse>;
  /**
   * Call session ID
   * @type {string}
   * @memberof CallRingEvent
   */
  session_id: string;
  /**
   * The type of event: "call.notification" in this case
   * @type {string}
   * @memberof CallRingEvent
   */
  type: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CallRingEvent
   */
  user: UserResponse;
  /**
   *
   * @type {boolean}
   * @memberof CallRingEvent
   */
  video: boolean;
}
/**
 * This event is sent when a call RTMP broadcast has failed
 * @export
 * @interface CallRtmpBroadcastFailedEvent
 */
export interface CallRtmpBroadcastFailedEvent {
  /**
   * The unique identifier for a call (<type>:<id>)
   * @type {string}
   * @memberof CallRtmpBroadcastFailedEvent
   */
  call_cid: string;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof CallRtmpBroadcastFailedEvent
   */
  created_at: string;
  /**
   * Name of the given RTMP broadcast
   * @type {string}
   * @memberof CallRtmpBroadcastFailedEvent
   */
  name: string;
  /**
   * The type of event: "call.rtmp_broadcast_failed" in this case
   * @type {string}
   * @memberof CallRtmpBroadcastFailedEvent
   */
  type: string;
}
/**
 * This event is sent when RTMP broadcast has started
 * @export
 * @interface CallRtmpBroadcastStartedEvent
 */
export interface CallRtmpBroadcastStartedEvent {
  /**
   * The unique identifier for a call (<type>:<id>)
   * @type {string}
   * @memberof CallRtmpBroadcastStartedEvent
   */
  call_cid: string;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof CallRtmpBroadcastStartedEvent
   */
  created_at: string;
  /**
   * Name of the given RTMP broadcast
   * @type {string}
   * @memberof CallRtmpBroadcastStartedEvent
   */
  name: string;
  /**
   * The type of event: "call.rtmp_broadcast_started" in this case
   * @type {string}
   * @memberof CallRtmpBroadcastStartedEvent
   */
  type: string;
}
/**
 * This event is sent when RTMP broadcast has stopped
 * @export
 * @interface CallRtmpBroadcastStoppedEvent
 */
export interface CallRtmpBroadcastStoppedEvent {
  /**
   * The unique identifier for a call (<type>:<id>)
   * @type {string}
   * @memberof CallRtmpBroadcastStoppedEvent
   */
  call_cid: string;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof CallRtmpBroadcastStoppedEvent
   */
  created_at: string;
  /**
   * Name of the given RTMP broadcast
   * @type {string}
   * @memberof CallRtmpBroadcastStoppedEvent
   */
  name: string;
  /**
   * The type of event: "call.rtmp_broadcast_stopped" in this case
   * @type {string}
   * @memberof CallRtmpBroadcastStoppedEvent
   */
  type: string;
}
/**
 * This event is sent when a call session ends
 * @export
 * @interface CallSessionEndedEvent
 */
export interface CallSessionEndedEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallSessionEndedEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallSessionEndedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallSessionEndedEvent
   */
  created_at: string;
  /**
   * Call session ID
   * @type {string}
   * @memberof CallSessionEndedEvent
   */
  session_id: string;
  /**
   * The type of event: "call.session_ended" in this case
   * @type {string}
   * @memberof CallSessionEndedEvent
   */
  type: string;
}
/**
 * This event is sent when the participant counts in a call session are updated
 * @export
 * @interface CallSessionParticipantCountsUpdatedEvent
 */
export interface CallSessionParticipantCountsUpdatedEvent {
  /**
   *
   * @type {number}
   * @memberof CallSessionParticipantCountsUpdatedEvent
   */
  anonymous_participant_count: number;
  /**
   *
   * @type {string}
   * @memberof CallSessionParticipantCountsUpdatedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallSessionParticipantCountsUpdatedEvent
   */
  created_at: string;
  /**
   *
   * @type {{ [key: string]: number; }}
   * @memberof CallSessionParticipantCountsUpdatedEvent
   */
  participants_count_by_role: { [key: string]: number };
  /**
   * Call session ID
   * @type {string}
   * @memberof CallSessionParticipantCountsUpdatedEvent
   */
  session_id: string;
  /**
   * The type of event: "call.session_participant_count_updated" in this case
   * @type {string}
   * @memberof CallSessionParticipantCountsUpdatedEvent
   */
  type: string;
}
/**
 * This event is sent when a participant joins a call session
 * @export
 * @interface CallSessionParticipantJoinedEvent
 */
export interface CallSessionParticipantJoinedEvent {
  /**
   *
   * @type {string}
   * @memberof CallSessionParticipantJoinedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallSessionParticipantJoinedEvent
   */
  created_at: string;
  /**
   *
   * @type {CallParticipantResponse}
   * @memberof CallSessionParticipantJoinedEvent
   */
  participant: CallParticipantResponse;
  /**
   * Call session ID
   * @type {string}
   * @memberof CallSessionParticipantJoinedEvent
   */
  session_id: string;
  /**
   * The type of event: "call.session_participant_joined" in this case
   * @type {string}
   * @memberof CallSessionParticipantJoinedEvent
   */
  type: string;
}
/**
 * This event is sent when a participant leaves a call session
 * @export
 * @interface CallSessionParticipantLeftEvent
 */
export interface CallSessionParticipantLeftEvent {
  /**
   *
   * @type {string}
   * @memberof CallSessionParticipantLeftEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallSessionParticipantLeftEvent
   */
  created_at: string;
  /**
   * The duration participant was in the session in seconds
   * @type {number}
   * @memberof CallSessionParticipantLeftEvent
   */
  duration_seconds: number;
  /**
   *
   * @type {CallParticipantResponse}
   * @memberof CallSessionParticipantLeftEvent
   */
  participant: CallParticipantResponse;
  /**
   * Call session ID
   * @type {string}
   * @memberof CallSessionParticipantLeftEvent
   */
  session_id: string;
  /**
   * The type of event: "call.session_participant_left" in this case
   * @type {string}
   * @memberof CallSessionParticipantLeftEvent
   */
  type: string;
}
/**
 *
 * @export
 * @interface CallSessionResponse
 */
export interface CallSessionResponse {
  /**
   *
   * @type {{ [key: string]: string; }}
   * @memberof CallSessionResponse
   */
  accepted_by: { [key: string]: string };
  /**
   *
   * @type {number}
   * @memberof CallSessionResponse
   */
  anonymous_participant_count: number;
  /**
   *
   * @type {string}
   * @memberof CallSessionResponse
   */
  ended_at?: string;
  /**
   *
   * @type {string}
   * @memberof CallSessionResponse
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof CallSessionResponse
   */
  live_ended_at?: string;
  /**
   *
   * @type {string}
   * @memberof CallSessionResponse
   */
  live_started_at?: string;
  /**
   *
   * @type {{ [key: string]: string; }}
   * @memberof CallSessionResponse
   */
  missed_by: { [key: string]: string };
  /**
   *
   * @type {Array<CallParticipantResponse>}
   * @memberof CallSessionResponse
   */
  participants: Array<CallParticipantResponse>;
  /**
   *
   * @type {{ [key: string]: number; }}
   * @memberof CallSessionResponse
   */
  participants_count_by_role: { [key: string]: number };
  /**
   *
   * @type {{ [key: string]: string; }}
   * @memberof CallSessionResponse
   */
  rejected_by: { [key: string]: string };
  /**
   *
   * @type {string}
   * @memberof CallSessionResponse
   */
  started_at?: string;
  /**
   *
   * @type {string}
   * @memberof CallSessionResponse
   */
  timer_ends_at?: string;
}
/**
 * This event is sent when a call session starts
 * @export
 * @interface CallSessionStartedEvent
 */
export interface CallSessionStartedEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallSessionStartedEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallSessionStartedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallSessionStartedEvent
   */
  created_at: string;
  /**
   * Call session ID
   * @type {string}
   * @memberof CallSessionStartedEvent
   */
  session_id: string;
  /**
   * The type of event: "call.session_started" in this case
   * @type {string}
   * @memberof CallSessionStartedEvent
   */
  type: string;
}
/**
 *
 * @export
 * @interface CallSettingsRequest
 */
export interface CallSettingsRequest {
  /**
   *
   * @type {AudioSettingsRequest}
   * @memberof CallSettingsRequest
   */
  audio?: AudioSettingsRequest;
  /**
   *
   * @type {BackstageSettingsRequest}
   * @memberof CallSettingsRequest
   */
  backstage?: BackstageSettingsRequest;
  /**
   *
   * @type {BroadcastSettingsRequest}
   * @memberof CallSettingsRequest
   */
  broadcasting?: BroadcastSettingsRequest;
  /**
   *
   * @type {FrameRecordingSettingsRequest}
   * @memberof CallSettingsRequest
   */
  frame_recording?: FrameRecordingSettingsRequest;
  /**
   *
   * @type {GeofenceSettingsRequest}
   * @memberof CallSettingsRequest
   */
  geofencing?: GeofenceSettingsRequest;
  /**
   *
   * @type {LimitsSettingsRequest}
   * @memberof CallSettingsRequest
   */
  limits?: LimitsSettingsRequest;
  /**
   *
   * @type {RecordSettingsRequest}
   * @memberof CallSettingsRequest
   */
  recording?: RecordSettingsRequest;
  /**
   *
   * @type {RingSettingsRequest}
   * @memberof CallSettingsRequest
   */
  ring?: RingSettingsRequest;
  /**
   *
   * @type {ScreensharingSettingsRequest}
   * @memberof CallSettingsRequest
   */
  screensharing?: ScreensharingSettingsRequest;
  /**
   *
   * @type {SessionSettingsRequest}
   * @memberof CallSettingsRequest
   */
  session?: SessionSettingsRequest;
  /**
   *
   * @type {ThumbnailsSettingsRequest}
   * @memberof CallSettingsRequest
   */
  thumbnails?: ThumbnailsSettingsRequest;
  /**
   *
   * @type {TranscriptionSettingsRequest}
   * @memberof CallSettingsRequest
   */
  transcription?: TranscriptionSettingsRequest;
  /**
   *
   * @type {VideoSettingsRequest}
   * @memberof CallSettingsRequest
   */
  video?: VideoSettingsRequest;
}
/**
 *
 * @export
 * @interface CallSettingsResponse
 */
export interface CallSettingsResponse {
  /**
   *
   * @type {AudioSettingsResponse}
   * @memberof CallSettingsResponse
   */
  audio: AudioSettingsResponse;
  /**
   *
   * @type {BackstageSettingsResponse}
   * @memberof CallSettingsResponse
   */
  backstage: BackstageSettingsResponse;
  /**
   *
   * @type {BroadcastSettingsResponse}
   * @memberof CallSettingsResponse
   */
  broadcasting: BroadcastSettingsResponse;
  /**
   *
   * @type {FrameRecordingSettingsResponse}
   * @memberof CallSettingsResponse
   */
  frame_recording: FrameRecordingSettingsResponse;
  /**
   *
   * @type {GeofenceSettingsResponse}
   * @memberof CallSettingsResponse
   */
  geofencing: GeofenceSettingsResponse;
  /**
   *
   * @type {LimitsSettingsResponse}
   * @memberof CallSettingsResponse
   */
  limits: LimitsSettingsResponse;
  /**
   *
   * @type {RecordSettingsResponse}
   * @memberof CallSettingsResponse
   */
  recording: RecordSettingsResponse;
  /**
   *
   * @type {RingSettingsResponse}
   * @memberof CallSettingsResponse
   */
  ring: RingSettingsResponse;
  /**
   *
   * @type {ScreensharingSettingsResponse}
   * @memberof CallSettingsResponse
   */
  screensharing: ScreensharingSettingsResponse;
  /**
   *
   * @type {SessionSettingsResponse}
   * @memberof CallSettingsResponse
   */
  session: SessionSettingsResponse;
  /**
   *
   * @type {ThumbnailsSettingsResponse}
   * @memberof CallSettingsResponse
   */
  thumbnails: ThumbnailsSettingsResponse;
  /**
   *
   * @type {TranscriptionSettingsResponse}
   * @memberof CallSettingsResponse
   */
  transcription: TranscriptionSettingsResponse;
  /**
   *
   * @type {VideoSettingsResponse}
   * @memberof CallSettingsResponse
   */
  video: VideoSettingsResponse;
}
/**
 * CallStateResponseFields is the payload for call state response
 * @export
 * @interface CallStateResponseFields
 */
export interface CallStateResponseFields {
  /**
   *
   * @type {CallResponse}
   * @memberof CallStateResponseFields
   */
  call: CallResponse;
  /**
   * List of call members
   * @type {Array<MemberResponse>}
   * @memberof CallStateResponseFields
   */
  members: Array<MemberResponse>;
  /**
   *
   * @type {MemberResponse}
   * @memberof CallStateResponseFields
   */
  membership?: MemberResponse;
  /**
   *
   * @type {Array<OwnCapability>}
   * @memberof CallStateResponseFields
   */
  own_capabilities: Array<OwnCapability>;
}
/**
 *
 * @export
 * @interface CallStatsReportSummaryResponse
 */
export interface CallStatsReportSummaryResponse {
  /**
   *
   * @type {string}
   * @memberof CallStatsReportSummaryResponse
   */
  call_cid: string;
  /**
   *
   * @type {number}
   * @memberof CallStatsReportSummaryResponse
   */
  call_duration_seconds: number;
  /**
   *
   * @type {string}
   * @memberof CallStatsReportSummaryResponse
   */
  call_session_id: string;
  /**
   *
   * @type {string}
   * @memberof CallStatsReportSummaryResponse
   */
  call_status: string;
  /**
   *
   * @type {string}
   * @memberof CallStatsReportSummaryResponse
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof CallStatsReportSummaryResponse
   */
  first_stats_time: string;
  /**
   *
   * @type {number}
   * @memberof CallStatsReportSummaryResponse
   */
  min_user_rating?: number;
  /**
   *
   * @type {number}
   * @memberof CallStatsReportSummaryResponse
   */
  quality_score?: number;
}
/**
 *
 * @export
 * @interface CallTimeline
 */
export interface CallTimeline {
  /**
   *
   * @type {Array<CallEvent>}
   * @memberof CallTimeline
   */
  events: Array<CallEvent>;
}
/**
 * CallTranscription represents a transcription of a call.
 * @export
 * @interface CallTranscription
 */
export interface CallTranscription {
  /**
   *
   * @type {string}
   * @memberof CallTranscription
   */
  end_time: string;
  /**
   *
   * @type {string}
   * @memberof CallTranscription
   */
  filename: string;
  /**
   *
   * @type {string}
   * @memberof CallTranscription
   */
  start_time: string;
  /**
   *
   * @type {string}
   * @memberof CallTranscription
   */
  url: string;
}
/**
 * This event is sent when call transcription has failed
 * @export
 * @interface CallTranscriptionFailedEvent
 */
export interface CallTranscriptionFailedEvent {
  /**
   *
   * @type {string}
   * @memberof CallTranscriptionFailedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallTranscriptionFailedEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof CallTranscriptionFailedEvent
   */
  egress_id: string;
  /**
   * The type of event: "call.transcription_failed" in this case
   * @type {string}
   * @memberof CallTranscriptionFailedEvent
   */
  type: string;
}
/**
 * This event is sent when call transcription is ready
 * @export
 * @interface CallTranscriptionReadyEvent
 */
export interface CallTranscriptionReadyEvent {
  /**
   *
   * @type {string}
   * @memberof CallTranscriptionReadyEvent
   */
  call_cid: string;
  /**
   *
   * @type {CallTranscription}
   * @memberof CallTranscriptionReadyEvent
   */
  call_transcription: CallTranscription;
  /**
   *
   * @type {string}
   * @memberof CallTranscriptionReadyEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof CallTranscriptionReadyEvent
   */
  egress_id: string;
  /**
   * The type of event: "call.transcription_ready" in this case
   * @type {string}
   * @memberof CallTranscriptionReadyEvent
   */
  type: string;
}
/**
 * This event is sent when call transcription has started
 * @export
 * @interface CallTranscriptionStartedEvent
 */
export interface CallTranscriptionStartedEvent {
  /**
   *
   * @type {string}
   * @memberof CallTranscriptionStartedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallTranscriptionStartedEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof CallTranscriptionStartedEvent
   */
  egress_id: string;
  /**
   * The type of event: "call.transcription_started" in this case
   * @type {string}
   * @memberof CallTranscriptionStartedEvent
   */
  type: string;
}
/**
 * This event is sent when call transcription has stopped
 * @export
 * @interface CallTranscriptionStoppedEvent
 */
export interface CallTranscriptionStoppedEvent {
  /**
   *
   * @type {string}
   * @memberof CallTranscriptionStoppedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallTranscriptionStoppedEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof CallTranscriptionStoppedEvent
   */
  egress_id: string;
  /**
   * The type of event: "call.transcription_stopped" in this case
   * @type {string}
   * @memberof CallTranscriptionStoppedEvent
   */
  type: string;
}
/**
 * This event is sent when a call is updated, clients should use this update the local state of the call.
 * This event also contains the capabilities by role for the call, clients should update the own_capability for the current.
 * @export
 * @interface CallUpdatedEvent
 */
export interface CallUpdatedEvent {
  /**
   *
   * @type {CallResponse}
   * @memberof CallUpdatedEvent
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallUpdatedEvent
   */
  call_cid: string;
  /**
   * The capabilities by role for this call
   * @type {{ [key: string]: Array<string>; }}
   * @memberof CallUpdatedEvent
   */
  capabilities_by_role: { [key: string]: Array<string> };
  /**
   *
   * @type {string}
   * @memberof CallUpdatedEvent
   */
  created_at: string;
  /**
   * The type of event: "call.ended" in this case
   * @type {string}
   * @memberof CallUpdatedEvent
   */
  type: string;
}
/**
 * This event is sent when a call member is muted
 * @export
 * @interface CallUserMutedEvent
 */
export interface CallUserMutedEvent {
  /**
   *
   * @type {string}
   * @memberof CallUserMutedEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallUserMutedEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof CallUserMutedEvent
   */
  from_user_id: string;
  /**
   *
   * @type {Array<string>}
   * @memberof CallUserMutedEvent
   */
  muted_user_ids: Array<string>;
  /**
   * The type of event: "call.user_muted" in this case
   * @type {string}
   * @memberof CallUserMutedEvent
   */
  type: string;
}
/**
 *
 * @export
 * @interface CallsPerDayReport
 */
export interface CallsPerDayReport {
  /**
   *
   * @type {number}
   * @memberof CallsPerDayReport
   */
  count: number;
}
/**
 *
 * @export
 * @interface CallsPerDayReportResponse
 */
export interface CallsPerDayReportResponse {
  /**
   *
   * @type {Array<DailyAggregateCallsPerDayReportResponse>}
   * @memberof CallsPerDayReportResponse
   */
  daily: Array<DailyAggregateCallsPerDayReportResponse>;
}
/**
 * This event is sent when closed captions are being sent in a call, clients should use this to show the closed captions in the call screen
 * @export
 * @interface ClosedCaptionEvent
 */
export interface ClosedCaptionEvent {
  /**
   *
   * @type {string}
   * @memberof ClosedCaptionEvent
   */
  call_cid: string;
  /**
   *
   * @type {CallClosedCaption}
   * @memberof ClosedCaptionEvent
   */
  closed_caption: CallClosedCaption;
  /**
   *
   * @type {string}
   * @memberof ClosedCaptionEvent
   */
  created_at: string;
  /**
   * The type of event: "call.closed_caption" in this case
   * @type {string}
   * @memberof ClosedCaptionEvent
   */
  type: string;
}
/**
 *
 * @export
 * @interface CollectUserFeedbackRequest
 */
export interface CollectUserFeedbackRequest {
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof CollectUserFeedbackRequest
   */
  custom?: { [key: string]: any };
  /**
   *
   * @type {number}
   * @memberof CollectUserFeedbackRequest
   */
  rating: number;
  /**
   *
   * @type {string}
   * @memberof CollectUserFeedbackRequest
   */
  reason?: string;
  /**
   *
   * @type {string}
   * @memberof CollectUserFeedbackRequest
   */
  sdk: string;
  /**
   *
   * @type {string}
   * @memberof CollectUserFeedbackRequest
   */
  sdk_version: string;
  /**
   *
   * @type {string}
   * @memberof CollectUserFeedbackRequest
   */
  user_session_id?: string;
}
/**
 * Basic response information
 * @export
 * @interface CollectUserFeedbackResponse
 */
export interface CollectUserFeedbackResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof CollectUserFeedbackResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface ConnectUserDetailsRequest
 */
export interface ConnectUserDetailsRequest {
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof ConnectUserDetailsRequest
   */
  custom?: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof ConnectUserDetailsRequest
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof ConnectUserDetailsRequest
   */
  image?: string;
  /**
   *
   * @type {boolean}
   * @memberof ConnectUserDetailsRequest
   */
  invisible?: boolean;
  /**
   *
   * @type {string}
   * @memberof ConnectUserDetailsRequest
   */
  language?: string;
  /**
   *
   * @type {string}
   * @memberof ConnectUserDetailsRequest
   */
  name?: string;
  /**
   *
   * @type {object}
   * @memberof ConnectUserDetailsRequest
   */
  privacy_settings?: object;
}
/**
 * This event is sent when the WS connection is established and authenticated, this event contains the full user object as it is stored on the server
 * @export
 * @interface ConnectedEvent
 */
export interface ConnectedEvent {
  /**
   * The connection_id for this client
   * @type {string}
   * @memberof ConnectedEvent
   */
  connection_id: string;
  /**
   *
   * @type {string}
   * @memberof ConnectedEvent
   */
  created_at: string;
  /**
   *
   * @type {OwnUserResponse}
   * @memberof ConnectedEvent
   */
  me: OwnUserResponse;
  /**
   * The type of event: "connection.ok" in this case
   * @type {string}
   * @memberof ConnectedEvent
   */
  type: string;
}
/**
 * This event is sent when the WS connection fails
 * @export
 * @interface ConnectionErrorEvent
 */
export interface ConnectionErrorEvent {
  /**
   *
   * @type {string}
   * @memberof ConnectionErrorEvent
   */
  connection_id: string;
  /**
   *
   * @type {string}
   * @memberof ConnectionErrorEvent
   */
  created_at: string;
  /**
   *
   * @type {APIError}
   * @memberof ConnectionErrorEvent
   */
  error: APIError;
  /**
   * The type of event: "connection.ok" in this case
   * @type {string}
   * @memberof ConnectionErrorEvent
   */
  type: string;
}
/**
 *
 * @export
 * @interface Coordinates
 */
export interface Coordinates {
  /**
   *
   * @type {number}
   * @memberof Coordinates
   */
  latitude: number;
  /**
   *
   * @type {number}
   * @memberof Coordinates
   */
  longitude: number;
}
/**
 *
 * @export
 * @interface Count
 */
export interface Count {
  /**
   *
   * @type {boolean}
   * @memberof Count
   */
  approximate: boolean;
  /**
   *
   * @type {number}
   * @memberof Count
   */
  value: number;
}
/**
 * Create device request
 * @export
 * @interface CreateDeviceRequest
 */
export interface CreateDeviceRequest {
  /**
   * Device ID
   * @type {string}
   * @memberof CreateDeviceRequest
   */
  id: string;
  /**
   * Push provider
   * @type {string}
   * @memberof CreateDeviceRequest
   */
  push_provider: CreateDeviceRequestPushProviderEnum;
  /**
   * Push provider name
   * @type {string}
   * @memberof CreateDeviceRequest
   */
  push_provider_name?: string;
  /**
   * When true the token is for Apple VoIP push notifications
   * @type {boolean}
   * @memberof CreateDeviceRequest
   */
  voip_token?: boolean;
}

/**
 * @export
 */
export const CreateDeviceRequestPushProviderEnum = {
  FIREBASE: 'firebase',
  APN: 'apn',
  HUAWEI: 'huawei',
  XIAOMI: 'xiaomi',
} as const;
export type CreateDeviceRequestPushProviderEnum =
  (typeof CreateDeviceRequestPushProviderEnum)[keyof typeof CreateDeviceRequestPushProviderEnum];

/**
 *
 * @export
 * @interface CreateGuestRequest
 */
export interface CreateGuestRequest {
  /**
   *
   * @type {UserRequest}
   * @memberof CreateGuestRequest
   */
  user: UserRequest;
}
/**
 *
 * @export
 * @interface CreateGuestResponse
 */
export interface CreateGuestResponse {
  /**
   * the access token to authenticate the user
   * @type {string}
   * @memberof CreateGuestResponse
   */
  access_token: string;
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof CreateGuestResponse
   */
  duration: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CreateGuestResponse
   */
  user: UserResponse;
}
/**
 *
 * @export
 * @interface Credentials
 */
export interface Credentials {
  /**
   *
   * @type {Array<ICEServer>}
   * @memberof Credentials
   */
  ice_servers: Array<ICEServer>;
  /**
   *
   * @type {SFUResponse}
   * @memberof Credentials
   */
  server: SFUResponse;
  /**
   *
   * @type {string}
   * @memberof Credentials
   */
  token: string;
}
/**
 * A custom event, this event is used to send custom events to other participants in the call.
 * @export
 * @interface CustomVideoEvent
 */
export interface CustomVideoEvent {
  /**
   *
   * @type {string}
   * @memberof CustomVideoEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CustomVideoEvent
   */
  created_at: string;
  /**
   * Custom data for this object
   * @type {{ [key: string]: any; }}
   * @memberof CustomVideoEvent
   */
  custom: { [key: string]: any };
  /**
   * The type of event, "custom" in this case
   * @type {string}
   * @memberof CustomVideoEvent
   */
  type: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CustomVideoEvent
   */
  user: UserResponse;
}
/**
 *
 * @export
 * @interface DailyAggregateCallDurationReportResponse
 */
export interface DailyAggregateCallDurationReportResponse {
  /**
   *
   * @type {string}
   * @memberof DailyAggregateCallDurationReportResponse
   */
  date: string;
  /**
   *
   * @type {CallDurationReport}
   * @memberof DailyAggregateCallDurationReportResponse
   */
  report: CallDurationReport;
}
/**
 *
 * @export
 * @interface DailyAggregateCallParticipantCountReportResponse
 */
export interface DailyAggregateCallParticipantCountReportResponse {
  /**
   *
   * @type {string}
   * @memberof DailyAggregateCallParticipantCountReportResponse
   */
  date: string;
  /**
   *
   * @type {CallParticipantCountReport}
   * @memberof DailyAggregateCallParticipantCountReportResponse
   */
  report: CallParticipantCountReport;
}
/**
 *
 * @export
 * @interface DailyAggregateCallsPerDayReportResponse
 */
export interface DailyAggregateCallsPerDayReportResponse {
  /**
   *
   * @type {string}
   * @memberof DailyAggregateCallsPerDayReportResponse
   */
  date: string;
  /**
   *
   * @type {CallsPerDayReport}
   * @memberof DailyAggregateCallsPerDayReportResponse
   */
  report: CallsPerDayReport;
}
/**
 *
 * @export
 * @interface DailyAggregateQualityScoreReportResponse
 */
export interface DailyAggregateQualityScoreReportResponse {
  /**
   *
   * @type {string}
   * @memberof DailyAggregateQualityScoreReportResponse
   */
  date: string;
  /**
   *
   * @type {QualityScoreReport}
   * @memberof DailyAggregateQualityScoreReportResponse
   */
  report: QualityScoreReport;
}
/**
 *
 * @export
 * @interface DailyAggregateSDKUsageReportResponse
 */
export interface DailyAggregateSDKUsageReportResponse {
  /**
   *
   * @type {string}
   * @memberof DailyAggregateSDKUsageReportResponse
   */
  date: string;
  /**
   *
   * @type {SDKUsageReport}
   * @memberof DailyAggregateSDKUsageReportResponse
   */
  report: SDKUsageReport;
}
/**
 *
 * @export
 * @interface DailyAggregateUserFeedbackReportResponse
 */
export interface DailyAggregateUserFeedbackReportResponse {
  /**
   *
   * @type {string}
   * @memberof DailyAggregateUserFeedbackReportResponse
   */
  date: string;
  /**
   *
   * @type {UserFeedbackReport}
   * @memberof DailyAggregateUserFeedbackReportResponse
   */
  report: UserFeedbackReport;
}
/**
 * DeleteCallRequest is the payload for deleting a call.
 * @export
 * @interface DeleteCallRequest
 */
export interface DeleteCallRequest {
  /**
   * if true the call will be hard deleted along with all related data
   * @type {boolean}
   * @memberof DeleteCallRequest
   */
  hard?: boolean;
}
/**
 * DeleteCallResponse is the payload for deleting a call.
 * @export
 * @interface DeleteCallResponse
 */
export interface DeleteCallResponse {
  /**
   *
   * @type {CallResponse}
   * @memberof DeleteCallResponse
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof DeleteCallResponse
   */
  duration: string;
  /**
   *
   * @type {string}
   * @memberof DeleteCallResponse
   */
  task_id?: string;
}
/**
 * Response for DeleteRecording
 * @export
 * @interface DeleteRecordingResponse
 */
export interface DeleteRecordingResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof DeleteRecordingResponse
   */
  duration: string;
}
/**
 * DeleteTranscriptionResponse is the payload for deleting a transcription.
 * @export
 * @interface DeleteTranscriptionResponse
 */
export interface DeleteTranscriptionResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof DeleteTranscriptionResponse
   */
  duration: string;
}
/**
 * Response for Device
 * @export
 * @interface DeviceResponse
 */
export interface DeviceResponse {
  /**
   * Date/time of creation
   * @type {string}
   * @memberof DeviceResponse
   */
  created_at: string;
  /**
   * Whether device is disabled or not
   * @type {boolean}
   * @memberof DeviceResponse
   */
  disabled?: boolean;
  /**
   * Reason explaining why device had been disabled
   * @type {string}
   * @memberof DeviceResponse
   */
  disabled_reason?: string;
  /**
   * Device ID
   * @type {string}
   * @memberof DeviceResponse
   */
  id: string;
  /**
   * Push provider
   * @type {string}
   * @memberof DeviceResponse
   */
  push_provider: string;
  /**
   * Push provider name
   * @type {string}
   * @memberof DeviceResponse
   */
  push_provider_name?: string;
  /**
   * User ID
   * @type {string}
   * @memberof DeviceResponse
   */
  user_id: string;
  /**
   * When true the token is for Apple VoIP push notifications
   * @type {boolean}
   * @memberof DeviceResponse
   */
  voip?: boolean;
}
/**
 *
 * @export
 * @interface EdgeResponse
 */
export interface EdgeResponse {
  /**
   *
   * @type {string}
   * @memberof EdgeResponse
   */
  continent_code: string;
  /**
   *
   * @type {string}
   * @memberof EdgeResponse
   */
  country_iso_code: string;
  /**
   *
   * @type {number}
   * @memberof EdgeResponse
   */
  green: number;
  /**
   *
   * @type {string}
   * @memberof EdgeResponse
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof EdgeResponse
   */
  latency_test_url: string;
  /**
   *
   * @type {number}
   * @memberof EdgeResponse
   */
  latitude: number;
  /**
   *
   * @type {number}
   * @memberof EdgeResponse
   */
  longitude: number;
  /**
   *
   * @type {number}
   * @memberof EdgeResponse
   */
  red: number;
  /**
   *
   * @type {string}
   * @memberof EdgeResponse
   */
  subdivision_iso_code: string;
  /**
   *
   * @type {number}
   * @memberof EdgeResponse
   */
  yellow: number;
}
/**
 *
 * @export
 * @interface EgressHLSResponse
 */
export interface EgressHLSResponse {
  /**
   *
   * @type {string}
   * @memberof EgressHLSResponse
   */
  playlist_url: string;
  /**
   *
   * @type {string}
   * @memberof EgressHLSResponse
   */
  status: string;
}
/**
 *
 * @export
 * @interface EgressRTMPResponse
 */
export interface EgressRTMPResponse {
  /**
   *
   * @type {string}
   * @memberof EgressRTMPResponse
   */
  name: string;
  /**
   *
   * @type {string}
   * @memberof EgressRTMPResponse
   */
  started_at: string;
  /**
   *
   * @type {string}
   * @memberof EgressRTMPResponse
   */
  stream_key?: string;
  /**
   *
   * @type {string}
   * @memberof EgressRTMPResponse
   */
  stream_url?: string;
}
/**
 *
 * @export
 * @interface EgressResponse
 */
export interface EgressResponse {
  /**
   *
   * @type {boolean}
   * @memberof EgressResponse
   */
  broadcasting: boolean;
  /**
   *
   * @type {EgressHLSResponse}
   * @memberof EgressResponse
   */
  hls?: EgressHLSResponse;
  /**
   *
   * @type {Array<EgressRTMPResponse>}
   * @memberof EgressResponse
   */
  rtmps: Array<EgressRTMPResponse>;
}
/**
 * Response for ending a call
 * @export
 * @interface EndCallResponse
 */
export interface EndCallResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof EndCallResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface FrameRecordingSettingsRequest
 */
export interface FrameRecordingSettingsRequest {
  /**
   *
   * @type {number}
   * @memberof FrameRecordingSettingsRequest
   */
  capture_interval_in_seconds: number;
  /**
   *
   * @type {string}
   * @memberof FrameRecordingSettingsRequest
   */
  mode: FrameRecordingSettingsRequestModeEnum;
  /**
   *
   * @type {string}
   * @memberof FrameRecordingSettingsRequest
   */
  quality?: string;
}

/**
 * @export
 */
export const FrameRecordingSettingsRequestModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type FrameRecordingSettingsRequestModeEnum =
  (typeof FrameRecordingSettingsRequestModeEnum)[keyof typeof FrameRecordingSettingsRequestModeEnum];

/**
 *
 * @export
 * @interface FrameRecordingSettingsResponse
 */
export interface FrameRecordingSettingsResponse {
  /**
   *
   * @type {number}
   * @memberof FrameRecordingSettingsResponse
   */
  capture_interval_in_seconds: number;
  /**
   *
   * @type {string}
   * @memberof FrameRecordingSettingsResponse
   */
  mode: FrameRecordingSettingsResponseModeEnum;
  /**
   *
   * @type {string}
   * @memberof FrameRecordingSettingsResponse
   */
  quality?: string;
}

/**
 * @export
 */
export const FrameRecordingSettingsResponseModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type FrameRecordingSettingsResponseModeEnum =
  (typeof FrameRecordingSettingsResponseModeEnum)[keyof typeof FrameRecordingSettingsResponseModeEnum];

/**
 *
 * @export
 * @interface GeofenceSettingsRequest
 */
export interface GeofenceSettingsRequest {
  /**
   *
   * @type {Array<string>}
   * @memberof GeofenceSettingsRequest
   */
  names?: Array<string>;
}
/**
 *
 * @export
 * @interface GeofenceSettingsResponse
 */
export interface GeofenceSettingsResponse {
  /**
   *
   * @type {Array<string>}
   * @memberof GeofenceSettingsResponse
   */
  names: Array<string>;
}
/**
 *
 * @export
 * @interface GeolocationResult
 */
export interface GeolocationResult {
  /**
   *
   * @type {number}
   * @memberof GeolocationResult
   */
  accuracy_radius: number;
  /**
   *
   * @type {string}
   * @memberof GeolocationResult
   */
  city: string;
  /**
   *
   * @type {string}
   * @memberof GeolocationResult
   */
  continent: string;
  /**
   *
   * @type {string}
   * @memberof GeolocationResult
   */
  continent_code: string;
  /**
   *
   * @type {string}
   * @memberof GeolocationResult
   */
  country: string;
  /**
   *
   * @type {string}
   * @memberof GeolocationResult
   */
  country_iso_code: string;
  /**
   *
   * @type {number}
   * @memberof GeolocationResult
   */
  latitude: number;
  /**
   *
   * @type {number}
   * @memberof GeolocationResult
   */
  longitude: number;
  /**
   *
   * @type {string}
   * @memberof GeolocationResult
   */
  subdivision: string;
  /**
   *
   * @type {string}
   * @memberof GeolocationResult
   */
  subdivision_iso_code: string;
}
/**
 *
 * @export
 * @interface GetCallResponse
 */
export interface GetCallResponse {
  /**
   *
   * @type {CallResponse}
   * @memberof GetCallResponse
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof GetCallResponse
   */
  duration: string;
  /**
   *
   * @type {Array<MemberResponse>}
   * @memberof GetCallResponse
   */
  members: Array<MemberResponse>;
  /**
   *
   * @type {MemberResponse}
   * @memberof GetCallResponse
   */
  membership?: MemberResponse;
  /**
   *
   * @type {Array<OwnCapability>}
   * @memberof GetCallResponse
   */
  own_capabilities: Array<OwnCapability>;
}
/**
 * Basic response information
 * @export
 * @interface GetCallStatsResponse
 */
export interface GetCallStatsResponse {
  /**
   *
   * @type {AggregatedStats}
   * @memberof GetCallStatsResponse
   */
  aggregated?: AggregatedStats;
  /**
   *
   * @type {number}
   * @memberof GetCallStatsResponse
   */
  average_connection_time?: number;
  /**
   *
   * @type {number}
   * @memberof GetCallStatsResponse
   */
  call_duration_seconds: number;
  /**
   *
   * @type {string}
   * @memberof GetCallStatsResponse
   */
  call_status: string;
  /**
   *
   * @type {CallTimeline}
   * @memberof GetCallStatsResponse
   */
  call_timeline?: CallTimeline;
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof GetCallStatsResponse
   */
  duration: string;
  /**
   *
   * @type {TimeStats}
   * @memberof GetCallStatsResponse
   */
  jitter?: TimeStats;
  /**
   *
   * @type {TimeStats}
   * @memberof GetCallStatsResponse
   */
  latency?: TimeStats;
  /**
   *
   * @type {number}
   * @memberof GetCallStatsResponse
   */
  max_freezes_duration_seconds: number;
  /**
   *
   * @type {number}
   * @memberof GetCallStatsResponse
   */
  max_participants: number;
  /**
   *
   * @type {number}
   * @memberof GetCallStatsResponse
   */
  max_total_quality_limitation_duration_seconds: number;
  /**
   *
   * @type {Array<UserStats>}
   * @memberof GetCallStatsResponse
   */
  participant_report: Array<UserStats>;
  /**
   *
   * @type {number}
   * @memberof GetCallStatsResponse
   */
  publishing_participants: number;
  /**
   *
   * @type {number}
   * @memberof GetCallStatsResponse
   */
  quality_score: number;
  /**
   *
   * @type {number}
   * @memberof GetCallStatsResponse
   */
  sfu_count: number;
  /**
   *
   * @type {Array<SFULocationResponse>}
   * @memberof GetCallStatsResponse
   */
  sfus: Array<SFULocationResponse>;
}
/**
 * Basic response information
 * @export
 * @interface GetEdgesResponse
 */
export interface GetEdgesResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof GetEdgesResponse
   */
  duration: string;
  /**
   *
   * @type {Array<EdgeResponse>}
   * @memberof GetEdgesResponse
   */
  edges: Array<EdgeResponse>;
}
/**
 *
 * @export
 * @interface GetOrCreateCallRequest
 */
export interface GetOrCreateCallRequest {
  /**
   *
   * @type {CallRequest}
   * @memberof GetOrCreateCallRequest
   */
  data?: CallRequest;
  /**
   *
   * @type {number}
   * @memberof GetOrCreateCallRequest
   */
  members_limit?: number;
  /**
   * if provided it sends a notification event to the members for this call
   * @type {boolean}
   * @memberof GetOrCreateCallRequest
   */
  notify?: boolean;
  /**
   * if provided it sends a ring event to the members for this call
   * @type {boolean}
   * @memberof GetOrCreateCallRequest
   */
  ring?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof GetOrCreateCallRequest
   */
  video?: boolean;
}
/**
 *
 * @export
 * @interface GetOrCreateCallResponse
 */
export interface GetOrCreateCallResponse {
  /**
   *
   * @type {CallResponse}
   * @memberof GetOrCreateCallResponse
   */
  call: CallResponse;
  /**
   *
   * @type {boolean}
   * @memberof GetOrCreateCallResponse
   */
  created: boolean;
  /**
   *
   * @type {string}
   * @memberof GetOrCreateCallResponse
   */
  duration: string;
  /**
   *
   * @type {Array<MemberResponse>}
   * @memberof GetOrCreateCallResponse
   */
  members: Array<MemberResponse>;
  /**
   *
   * @type {MemberResponse}
   * @memberof GetOrCreateCallResponse
   */
  membership?: MemberResponse;
  /**
   *
   * @type {Array<OwnCapability>}
   * @memberof GetOrCreateCallResponse
   */
  own_capabilities: Array<OwnCapability>;
}
/**
 *
 * @export
 * @interface GoLiveRequest
 */
export interface GoLiveRequest {
  /**
   *
   * @type {string}
   * @memberof GoLiveRequest
   */
  recording_storage_name?: string;
  /**
   *
   * @type {boolean}
   * @memberof GoLiveRequest
   */
  start_closed_caption?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof GoLiveRequest
   */
  start_hls?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof GoLiveRequest
   */
  start_recording?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof GoLiveRequest
   */
  start_rtmp_broadcasts?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof GoLiveRequest
   */
  start_transcription?: boolean;
  /**
   *
   * @type {string}
   * @memberof GoLiveRequest
   */
  transcription_storage_name?: string;
}
/**
 * Basic response information
 * @export
 * @interface GoLiveResponse
 */
export interface GoLiveResponse {
  /**
   *
   * @type {CallResponse}
   * @memberof GoLiveResponse
   */
  call: CallResponse;
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof GoLiveResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface HLSSettingsRequest
 */
export interface HLSSettingsRequest {
  /**
   *
   * @type {boolean}
   * @memberof HLSSettingsRequest
   */
  auto_on?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof HLSSettingsRequest
   */
  enabled?: boolean;
  /**
   *
   * @type {Array<string>}
   * @memberof HLSSettingsRequest
   */
  quality_tracks: Array<string>;
}
/**
 * HLSSettings is the payload for HLS settings
 * @export
 * @interface HLSSettingsResponse
 */
export interface HLSSettingsResponse {
  /**
   *
   * @type {boolean}
   * @memberof HLSSettingsResponse
   */
  auto_on: boolean;
  /**
   *
   * @type {boolean}
   * @memberof HLSSettingsResponse
   */
  enabled: boolean;
  /**
   *
   * @type {Array<string>}
   * @memberof HLSSettingsResponse
   */
  quality_tracks: Array<string>;
}
/**
 *
 * @export
 * @interface HealthCheckEvent
 */
export interface HealthCheckEvent {
  /**
   *
   * @type {string}
   * @memberof HealthCheckEvent
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof HealthCheckEvent
   */
  connection_id: string;
  /**
   *
   * @type {string}
   * @memberof HealthCheckEvent
   */
  created_at: string;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof HealthCheckEvent
   */
  custom: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof HealthCheckEvent
   */
  received_at?: string;
  /**
   *
   * @type {string}
   * @memberof HealthCheckEvent
   */
  type: string;
}
/**
 *
 * @export
 * @interface ICEServer
 */
export interface ICEServer {
  /**
   *
   * @type {string}
   * @memberof ICEServer
   */
  password: string;
  /**
   *
   * @type {Array<string>}
   * @memberof ICEServer
   */
  urls: Array<string>;
  /**
   *
   * @type {string}
   * @memberof ICEServer
   */
  username: string;
}
/**
 *
 * @export
 * @interface JoinCallRequest
 */
export interface JoinCallRequest {
  /**
   * if true the call will be created if it doesn't exist
   * @type {boolean}
   * @memberof JoinCallRequest
   */
  create?: boolean;
  /**
   *
   * @type {CallRequest}
   * @memberof JoinCallRequest
   */
  data?: CallRequest;
  /**
   *
   * @type {string}
   * @memberof JoinCallRequest
   */
  location: string;
  /**
   *
   * @type {number}
   * @memberof JoinCallRequest
   */
  members_limit?: number;
  /**
   * If the participant is migrating from another SFU, then this is the ID of the previous SFU
   * @type {string}
   * @memberof JoinCallRequest
   */
  migrating_from?: string;
  /**
   *
   * @type {boolean}
   * @memberof JoinCallRequest
   */
  notify?: boolean;
  /**
   * if true and the call is created, the notification will include ring=true
   * @type {boolean}
   * @memberof JoinCallRequest
   */
  ring?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof JoinCallRequest
   */
  video?: boolean;
}
/**
 *
 * @export
 * @interface JoinCallResponse
 */
export interface JoinCallResponse {
  /**
   *
   * @type {CallResponse}
   * @memberof JoinCallResponse
   */
  call: CallResponse;
  /**
   *
   * @type {boolean}
   * @memberof JoinCallResponse
   */
  created: boolean;
  /**
   *
   * @type {Credentials}
   * @memberof JoinCallResponse
   */
  credentials: Credentials;
  /**
   *
   * @type {string}
   * @memberof JoinCallResponse
   */
  duration: string;
  /**
   *
   * @type {Array<MemberResponse>}
   * @memberof JoinCallResponse
   */
  members: Array<MemberResponse>;
  /**
   *
   * @type {MemberResponse}
   * @memberof JoinCallResponse
   */
  membership?: MemberResponse;
  /**
   *
   * @type {Array<OwnCapability>}
   * @memberof JoinCallResponse
   */
  own_capabilities: Array<OwnCapability>;
  /**
   *
   * @type {StatsOptions}
   * @memberof JoinCallResponse
   */
  stats_options: StatsOptions;
}
/**
 *
 * @export
 * @interface LayoutSettingsRequest
 */
export interface LayoutSettingsRequest {
  /**
   *
   * @type {boolean}
   * @memberof LayoutSettingsRequest
   */
  detect_orientation?: boolean;
  /**
   *
   * @type {string}
   * @memberof LayoutSettingsRequest
   */
  external_app_url?: string;
  /**
   *
   * @type {string}
   * @memberof LayoutSettingsRequest
   */
  external_css_url?: string;
  /**
   *
   * @type {string}
   * @memberof LayoutSettingsRequest
   */
  name: LayoutSettingsRequestNameEnum;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof LayoutSettingsRequest
   */
  options?: { [key: string]: any };
}

/**
 * @export
 */
export const LayoutSettingsRequestNameEnum = {
  SPOTLIGHT: 'spotlight',
  GRID: 'grid',
  SINGLE_PARTICIPANT: 'single-participant',
  MOBILE: 'mobile',
  CUSTOM: 'custom',
} as const;
export type LayoutSettingsRequestNameEnum =
  (typeof LayoutSettingsRequestNameEnum)[keyof typeof LayoutSettingsRequestNameEnum];

/**
 *
 * @export
 * @interface LimitsSettingsRequest
 */
export interface LimitsSettingsRequest {
  /**
   *
   * @type {number}
   * @memberof LimitsSettingsRequest
   */
  max_duration_seconds?: number;
  /**
   *
   * @type {number}
   * @memberof LimitsSettingsRequest
   */
  max_participants?: number;
}
/**
 *
 * @export
 * @interface LimitsSettingsResponse
 */
export interface LimitsSettingsResponse {
  /**
   *
   * @type {number}
   * @memberof LimitsSettingsResponse
   */
  max_duration_seconds?: number;
  /**
   *
   * @type {number}
   * @memberof LimitsSettingsResponse
   */
  max_participants?: number;
}
/**
 * List devices response
 * @export
 * @interface ListDevicesResponse
 */
export interface ListDevicesResponse {
  /**
   * List of devices
   * @type {Array<DeviceResponse>}
   * @memberof ListDevicesResponse
   */
  devices: Array<DeviceResponse>;
  /**
   *
   * @type {string}
   * @memberof ListDevicesResponse
   */
  duration: string;
}
/**
 * Response for listing recordings
 * @export
 * @interface ListRecordingsResponse
 */
export interface ListRecordingsResponse {
  /**
   *
   * @type {string}
   * @memberof ListRecordingsResponse
   */
  duration: string;
  /**
   *
   * @type {Array<CallRecording>}
   * @memberof ListRecordingsResponse
   */
  recordings: Array<CallRecording>;
}
/**
 *
 * @export
 * @interface ListTranscriptionsResponse
 */
export interface ListTranscriptionsResponse {
  /**
   *
   * @type {string}
   * @memberof ListTranscriptionsResponse
   */
  duration: string;
  /**
   * List of transcriptions for the call
   * @type {Array<CallTranscription>}
   * @memberof ListTranscriptionsResponse
   */
  transcriptions: Array<CallTranscription>;
}
/**
 *
 * @export
 * @interface Location
 */
export interface Location {
  /**
   *
   * @type {string}
   * @memberof Location
   */
  continent_code: string;
  /**
   *
   * @type {string}
   * @memberof Location
   */
  country_iso_code: string;
  /**
   *
   * @type {string}
   * @memberof Location
   */
  subdivision_iso_code: string;
}
/**
 *
 * @export
 * @interface MediaPubSubHint
 */
export interface MediaPubSubHint {
  /**
   *
   * @type {boolean}
   * @memberof MediaPubSubHint
   */
  audio_published: boolean;
  /**
   *
   * @type {boolean}
   * @memberof MediaPubSubHint
   */
  audio_subscribed: boolean;
  /**
   *
   * @type {boolean}
   * @memberof MediaPubSubHint
   */
  video_published: boolean;
  /**
   *
   * @type {boolean}
   * @memberof MediaPubSubHint
   */
  video_subscribed: boolean;
}
/**
 * MemberRequest is the payload for adding a member to a call.
 * @export
 * @interface MemberRequest
 */
export interface MemberRequest {
  /**
   * Custom data for this object
   * @type {{ [key: string]: any; }}
   * @memberof MemberRequest
   */
  custom?: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof MemberRequest
   */
  role?: string;
  /**
   *
   * @type {string}
   * @memberof MemberRequest
   */
  user_id: string;
}
/**
 * MemberResponse is the payload for a member of a call.
 * @export
 * @interface MemberResponse
 */
export interface MemberResponse {
  /**
   * Date/time of creation
   * @type {string}
   * @memberof MemberResponse
   */
  created_at: string;
  /**
   * Custom member response data
   * @type {{ [key: string]: any; }}
   * @memberof MemberResponse
   */
  custom: { [key: string]: any };
  /**
   * Date/time of deletion
   * @type {string}
   * @memberof MemberResponse
   */
  deleted_at?: string;
  /**
   *
   * @type {string}
   * @memberof MemberResponse
   */
  role?: string;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof MemberResponse
   */
  updated_at: string;
  /**
   *
   * @type {UserResponse}
   * @memberof MemberResponse
   */
  user: UserResponse;
  /**
   *
   * @type {string}
   * @memberof MemberResponse
   */
  user_id: string;
}
/**
 *
 * @export
 * @interface MuteUsersRequest
 */
export interface MuteUsersRequest {
  /**
   *
   * @type {boolean}
   * @memberof MuteUsersRequest
   */
  audio?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof MuteUsersRequest
   */
  mute_all_users?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof MuteUsersRequest
   */
  screenshare?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof MuteUsersRequest
   */
  screenshare_audio?: boolean;
  /**
   *
   * @type {Array<string>}
   * @memberof MuteUsersRequest
   */
  user_ids?: Array<string>;
  /**
   *
   * @type {boolean}
   * @memberof MuteUsersRequest
   */
  video?: boolean;
}
/**
 * MuteUsersResponse is the response payload for the mute users endpoint.
 * @export
 * @interface MuteUsersResponse
 */
export interface MuteUsersResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof MuteUsersResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface NetworkMetricsReportResponse
 */
export interface NetworkMetricsReportResponse {
  /**
   *
   * @type {number}
   * @memberof NetworkMetricsReportResponse
   */
  average_connection_time?: number;
  /**
   *
   * @type {number}
   * @memberof NetworkMetricsReportResponse
   */
  average_jitter?: number;
  /**
   *
   * @type {number}
   * @memberof NetworkMetricsReportResponse
   */
  average_latency?: number;
  /**
   *
   * @type {number}
   * @memberof NetworkMetricsReportResponse
   */
  average_time_to_reconnect?: number;
}
/**
 *
 * @export
 * @interface NoiseCancellationSettings
 */
export interface NoiseCancellationSettings {
  /**
   *
   * @type {string}
   * @memberof NoiseCancellationSettings
   */
  mode: NoiseCancellationSettingsModeEnum;
}

/**
 * @export
 */
export const NoiseCancellationSettingsModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type NoiseCancellationSettingsModeEnum =
  (typeof NoiseCancellationSettingsModeEnum)[keyof typeof NoiseCancellationSettingsModeEnum];

/**
 * All possibility of string to use
 * @export
 */
export const OwnCapability = {
  BLOCK_USERS: 'block-users',
  CHANGE_MAX_DURATION: 'change-max-duration',
  CREATE_CALL: 'create-call',
  CREATE_REACTION: 'create-reaction',
  ENABLE_NOISE_CANCELLATION: 'enable-noise-cancellation',
  END_CALL: 'end-call',
  JOIN_BACKSTAGE: 'join-backstage',
  JOIN_CALL: 'join-call',
  JOIN_ENDED_CALL: 'join-ended-call',
  MUTE_USERS: 'mute-users',
  PIN_FOR_EVERYONE: 'pin-for-everyone',
  READ_CALL: 'read-call',
  REMOVE_CALL_MEMBER: 'remove-call-member',
  SCREENSHARE: 'screenshare',
  SEND_AUDIO: 'send-audio',
  SEND_VIDEO: 'send-video',
  START_BROADCAST_CALL: 'start-broadcast-call',
  START_CLOSED_CAPTIONS_CALL: 'start-closed-captions-call',
  START_FRAME_RECORD_CALL: 'start-frame-record-call',
  START_RECORD_CALL: 'start-record-call',
  START_TRANSCRIPTION_CALL: 'start-transcription-call',
  STOP_BROADCAST_CALL: 'stop-broadcast-call',
  STOP_CLOSED_CAPTIONS_CALL: 'stop-closed-captions-call',
  STOP_FRAME_RECORD_CALL: 'stop-frame-record-call',
  STOP_RECORD_CALL: 'stop-record-call',
  STOP_TRANSCRIPTION_CALL: 'stop-transcription-call',
  UPDATE_CALL: 'update-call',
  UPDATE_CALL_MEMBER: 'update-call-member',
  UPDATE_CALL_PERMISSIONS: 'update-call-permissions',
  UPDATE_CALL_SETTINGS: 'update-call-settings',
} as const;
export type OwnCapability = (typeof OwnCapability)[keyof typeof OwnCapability];

/**
 *
 * @export
 * @interface OwnUserResponse
 */
export interface OwnUserResponse {
  /**
   *
   * @type {Array<string>}
   * @memberof OwnUserResponse
   */
  blocked_user_ids?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof OwnUserResponse
   */
  created_at: string;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof OwnUserResponse
   */
  custom: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof OwnUserResponse
   */
  deactivated_at?: string;
  /**
   *
   * @type {string}
   * @memberof OwnUserResponse
   */
  deleted_at?: string;
  /**
   *
   * @type {Array<DeviceResponse>}
   * @memberof OwnUserResponse
   */
  devices: Array<DeviceResponse>;
  /**
   *
   * @type {string}
   * @memberof OwnUserResponse
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof OwnUserResponse
   */
  image?: string;
  /**
   *
   * @type {string}
   * @memberof OwnUserResponse
   */
  language: string;
  /**
   *
   * @type {string}
   * @memberof OwnUserResponse
   */
  last_active?: string;
  /**
   *
   * @type {string}
   * @memberof OwnUserResponse
   */
  name?: string;
  /**
   *
   * @type {object}
   * @memberof OwnUserResponse
   */
  privacy_settings?: object;
  /**
   *
   * @type {PushPreferences}
   * @memberof OwnUserResponse
   */
  push_preferences?: PushPreferences;
  /**
   *
   * @type {string}
   * @memberof OwnUserResponse
   */
  revoke_tokens_issued_before?: string;
  /**
   *
   * @type {string}
   * @memberof OwnUserResponse
   */
  role: string;
  /**
   *
   * @type {Array<string>}
   * @memberof OwnUserResponse
   */
  teams: Array<string>;
  /**
   *
   * @type {string}
   * @memberof OwnUserResponse
   */
  updated_at: string;
}
/**
 *
 * @export
 * @interface PerSDKUsageReport
 */
export interface PerSDKUsageReport {
  /**
   *
   * @type {{ [key: string]: number; }}
   * @memberof PerSDKUsageReport
   */
  by_version: { [key: string]: number };
  /**
   *
   * @type {number}
   * @memberof PerSDKUsageReport
   */
  total: number;
}
/**
 * This event is sent when a user requests access to a feature on a call,
 * clients receiving this event should display a permission request to the user
 * @export
 * @interface PermissionRequestEvent
 */
export interface PermissionRequestEvent {
  /**
   *
   * @type {string}
   * @memberof PermissionRequestEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof PermissionRequestEvent
   */
  created_at: string;
  /**
   * The list of permissions requested by the user
   * @type {Array<string>}
   * @memberof PermissionRequestEvent
   */
  permissions: Array<string>;
  /**
   * The type of event: "call.permission_request" in this case
   * @type {string}
   * @memberof PermissionRequestEvent
   */
  type: string;
  /**
   *
   * @type {UserResponse}
   * @memberof PermissionRequestEvent
   */
  user: UserResponse;
}
/**
 * PinRequest is the payload for pinning a message.
 * @export
 * @interface PinRequest
 */
export interface PinRequest {
  /**
   * the session ID of the user who pinned the message
   * @type {string}
   * @memberof PinRequest
   */
  session_id: string;
  /**
   * the user ID of the user who pinned the message
   * @type {string}
   * @memberof PinRequest
   */
  user_id: string;
}
/**
 * Basic response information
 * @export
 * @interface PinResponse
 */
export interface PinResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof PinResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface PublishedTrackInfo
 */
export interface PublishedTrackInfo {
  /**
   *
   * @type {string}
   * @memberof PublishedTrackInfo
   */
  codec_mime_type?: string;
  /**
   *
   * @type {number}
   * @memberof PublishedTrackInfo
   */
  duration_seconds?: number;
  /**
   *
   * @type {string}
   * @memberof PublishedTrackInfo
   */
  track_type?: string;
}
/**
 *
 * @export
 * @interface PublisherAggregateStats
 */
export interface PublisherAggregateStats {
  /**
   *
   * @type {{ [key: string]: Count; }}
   * @memberof PublisherAggregateStats
   */
  by_track_type?: { [key: string]: Count };
  /**
   *
   * @type {Count}
   * @memberof PublisherAggregateStats
   */
  total?: Count;
}
/**
 *
 * @export
 * @interface PushPreferences
 */
export interface PushPreferences {
  /**
   *
   * @type {string}
   * @memberof PushPreferences
   */
  call_level?: string;
  /**
   *
   * @type {string}
   * @memberof PushPreferences
   */
  chat_level?: string;
  /**
   *
   * @type {string}
   * @memberof PushPreferences
   */
  disabled_until?: string;
}
/**
 *
 * @export
 * @interface QualityScoreReport
 */
export interface QualityScoreReport {
  /**
   *
   * @type {Array<ReportByHistogramBucket>}
   * @memberof QualityScoreReport
   */
  histogram: Array<ReportByHistogramBucket>;
}
/**
 *
 * @export
 * @interface QualityScoreReportResponse
 */
export interface QualityScoreReportResponse {
  /**
   *
   * @type {Array<DailyAggregateQualityScoreReportResponse>}
   * @memberof QualityScoreReportResponse
   */
  daily: Array<DailyAggregateQualityScoreReportResponse>;
}
/**
 *
 * @export
 * @interface QueryAggregateCallStatsRequest
 */
export interface QueryAggregateCallStatsRequest {
  /**
   *
   * @type {string}
   * @memberof QueryAggregateCallStatsRequest
   */
  from?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof QueryAggregateCallStatsRequest
   */
  report_types?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof QueryAggregateCallStatsRequest
   */
  to?: string;
}
/**
 * Basic response information
 * @export
 * @interface QueryAggregateCallStatsResponse
 */
export interface QueryAggregateCallStatsResponse {
  /**
   *
   * @type {CallDurationReportResponse}
   * @memberof QueryAggregateCallStatsResponse
   */
  call_duration_report?: CallDurationReportResponse;
  /**
   *
   * @type {CallParticipantCountReportResponse}
   * @memberof QueryAggregateCallStatsResponse
   */
  call_participant_count_report?: CallParticipantCountReportResponse;
  /**
   *
   * @type {CallsPerDayReportResponse}
   * @memberof QueryAggregateCallStatsResponse
   */
  calls_per_day_report?: CallsPerDayReportResponse;
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof QueryAggregateCallStatsResponse
   */
  duration: string;
  /**
   *
   * @type {NetworkMetricsReportResponse}
   * @memberof QueryAggregateCallStatsResponse
   */
  network_metrics_report?: NetworkMetricsReportResponse;
  /**
   *
   * @type {QualityScoreReportResponse}
   * @memberof QueryAggregateCallStatsResponse
   */
  quality_score_report?: QualityScoreReportResponse;
  /**
   *
   * @type {SDKUsageReportResponse}
   * @memberof QueryAggregateCallStatsResponse
   */
  sdk_usage_report?: SDKUsageReportResponse;
  /**
   *
   * @type {UserFeedbackReportResponse}
   * @memberof QueryAggregateCallStatsResponse
   */
  user_feedback_report?: UserFeedbackReportResponse;
}
/**
 *
 * @export
 * @interface QueryCallMembersRequest
 */
export interface QueryCallMembersRequest {
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof QueryCallMembersRequest
   */
  filter_conditions?: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof QueryCallMembersRequest
   */
  id: string;
  /**
   *
   * @type {number}
   * @memberof QueryCallMembersRequest
   */
  limit?: number;
  /**
   *
   * @type {string}
   * @memberof QueryCallMembersRequest
   */
  next?: string;
  /**
   *
   * @type {string}
   * @memberof QueryCallMembersRequest
   */
  prev?: string;
  /**
   *
   * @type {Array<SortParamRequest>}
   * @memberof QueryCallMembersRequest
   */
  sort?: Array<SortParamRequest>;
  /**
   *
   * @type {string}
   * @memberof QueryCallMembersRequest
   */
  type: string;
}
/**
 * Basic response information
 * @export
 * @interface QueryCallMembersResponse
 */
export interface QueryCallMembersResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof QueryCallMembersResponse
   */
  duration: string;
  /**
   *
   * @type {Array<MemberResponse>}
   * @memberof QueryCallMembersResponse
   */
  members: Array<MemberResponse>;
  /**
   *
   * @type {string}
   * @memberof QueryCallMembersResponse
   */
  next?: string;
  /**
   *
   * @type {string}
   * @memberof QueryCallMembersResponse
   */
  prev?: string;
}
/**
 *
 * @export
 * @interface QueryCallStatsRequest
 */
export interface QueryCallStatsRequest {
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof QueryCallStatsRequest
   */
  filter_conditions?: { [key: string]: any };
  /**
   *
   * @type {number}
   * @memberof QueryCallStatsRequest
   */
  limit?: number;
  /**
   *
   * @type {string}
   * @memberof QueryCallStatsRequest
   */
  next?: string;
  /**
   *
   * @type {string}
   * @memberof QueryCallStatsRequest
   */
  prev?: string;
  /**
   *
   * @type {Array<SortParamRequest>}
   * @memberof QueryCallStatsRequest
   */
  sort?: Array<SortParamRequest>;
}
/**
 * Basic response information
 * @export
 * @interface QueryCallStatsResponse
 */
export interface QueryCallStatsResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof QueryCallStatsResponse
   */
  duration: string;
  /**
   *
   * @type {string}
   * @memberof QueryCallStatsResponse
   */
  next?: string;
  /**
   *
   * @type {string}
   * @memberof QueryCallStatsResponse
   */
  prev?: string;
  /**
   *
   * @type {Array<CallStatsReportSummaryResponse>}
   * @memberof QueryCallStatsResponse
   */
  reports: Array<CallStatsReportSummaryResponse>;
}
/**
 *
 * @export
 * @interface QueryCallsRequest
 */
export interface QueryCallsRequest {
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof QueryCallsRequest
   */
  filter_conditions?: { [key: string]: any };
  /**
   *
   * @type {number}
   * @memberof QueryCallsRequest
   */
  limit?: number;
  /**
   *
   * @type {string}
   * @memberof QueryCallsRequest
   */
  next?: string;
  /**
   *
   * @type {string}
   * @memberof QueryCallsRequest
   */
  prev?: string;
  /**
   * Array of sort parameters
   * @type {Array<SortParamRequest>}
   * @memberof QueryCallsRequest
   */
  sort?: Array<SortParamRequest>;
  /**
   *
   * @type {boolean}
   * @memberof QueryCallsRequest
   */
  watch?: boolean;
}
/**
 *
 * @export
 * @interface QueryCallsResponse
 */
export interface QueryCallsResponse {
  /**
   *
   * @type {Array<CallStateResponseFields>}
   * @memberof QueryCallsResponse
   */
  calls: Array<CallStateResponseFields>;
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof QueryCallsResponse
   */
  duration: string;
  /**
   *
   * @type {string}
   * @memberof QueryCallsResponse
   */
  next?: string;
  /**
   *
   * @type {string}
   * @memberof QueryCallsResponse
   */
  prev?: string;
}
/**
 * RTMPBroadcastRequest is the payload for starting an RTMP broadcast.
 * @export
 * @interface RTMPBroadcastRequest
 */
export interface RTMPBroadcastRequest {
  /**
   *
   * @type {LayoutSettingsRequest}
   * @memberof RTMPBroadcastRequest
   */
  layout?: LayoutSettingsRequest;
  /**
   * Name identifier for RTMP broadcast, must be unique in call
   * @type {string}
   * @memberof RTMPBroadcastRequest
   */
  name: string;
  /**
   * If provided, will override the call's RTMP settings quality
   * @type {string}
   * @memberof RTMPBroadcastRequest
   */
  quality?: RTMPBroadcastRequestQualityEnum;
  /**
   * If provided, will be appended at the end of stream_url
   * @type {string}
   * @memberof RTMPBroadcastRequest
   */
  stream_key?: string;
  /**
   * URL for the RTMP server to send the call to
   * @type {string}
   * @memberof RTMPBroadcastRequest
   */
  stream_url: string;
}

/**
 * @export
 */
export const RTMPBroadcastRequestQualityEnum = {
  _360P: '360p',
  _480P: '480p',
  _720P: '720p',
  _1080P: '1080p',
  _1440P: '1440p',
  PORTRAIT_360X640: 'portrait-360x640',
  PORTRAIT_480X854: 'portrait-480x854',
  PORTRAIT_720X1280: 'portrait-720x1280',
  PORTRAIT_1080X1920: 'portrait-1080x1920',
  PORTRAIT_1440X2560: 'portrait-1440x2560',
} as const;
export type RTMPBroadcastRequestQualityEnum =
  (typeof RTMPBroadcastRequestQualityEnum)[keyof typeof RTMPBroadcastRequestQualityEnum];

/**
 * RTMP input settings
 * @export
 * @interface RTMPIngress
 */
export interface RTMPIngress {
  /**
   *
   * @type {string}
   * @memberof RTMPIngress
   */
  address: string;
}
/**
 *
 * @export
 * @interface RTMPSettingsRequest
 */
export interface RTMPSettingsRequest {
  /**
   *
   * @type {boolean}
   * @memberof RTMPSettingsRequest
   */
  enabled?: boolean;
  /**
   * Resolution to set for the RTMP stream
   * @type {string}
   * @memberof RTMPSettingsRequest
   */
  quality?: RTMPSettingsRequestQualityEnum;
}

/**
 * @export
 */
export const RTMPSettingsRequestQualityEnum = {
  _360P: '360p',
  _480P: '480p',
  _720P: '720p',
  _1080P: '1080p',
  _1440P: '1440p',
  PORTRAIT_360X640: 'portrait-360x640',
  PORTRAIT_480X854: 'portrait-480x854',
  PORTRAIT_720X1280: 'portrait-720x1280',
  PORTRAIT_1080X1920: 'portrait-1080x1920',
  PORTRAIT_1440X2560: 'portrait-1440x2560',
} as const;
export type RTMPSettingsRequestQualityEnum =
  (typeof RTMPSettingsRequestQualityEnum)[keyof typeof RTMPSettingsRequestQualityEnum];

/**
 * RTMPSettingsResponse is the payload for RTMP settings
 * @export
 * @interface RTMPSettingsResponse
 */
export interface RTMPSettingsResponse {
  /**
   *
   * @type {boolean}
   * @memberof RTMPSettingsResponse
   */
  enabled: boolean;
  /**
   *
   * @type {string}
   * @memberof RTMPSettingsResponse
   */
  quality: string;
}
/**
 *
 * @export
 * @interface ReactionResponse
 */
export interface ReactionResponse {
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof ReactionResponse
   */
  custom?: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof ReactionResponse
   */
  emoji_code?: string;
  /**
   *
   * @type {string}
   * @memberof ReactionResponse
   */
  type: string;
  /**
   *
   * @type {UserResponse}
   * @memberof ReactionResponse
   */
  user: UserResponse;
}
/**
 *
 * @export
 * @interface RecordSettingsRequest
 */
export interface RecordSettingsRequest {
  /**
   *
   * @type {boolean}
   * @memberof RecordSettingsRequest
   */
  audio_only?: boolean;
  /**
   *
   * @type {string}
   * @memberof RecordSettingsRequest
   */
  mode: RecordSettingsRequestModeEnum;
  /**
   *
   * @type {string}
   * @memberof RecordSettingsRequest
   */
  quality?: RecordSettingsRequestQualityEnum;
}

/**
 * @export
 */
export const RecordSettingsRequestModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type RecordSettingsRequestModeEnum =
  (typeof RecordSettingsRequestModeEnum)[keyof typeof RecordSettingsRequestModeEnum];

/**
 * @export
 */
export const RecordSettingsRequestQualityEnum = {
  _360P: '360p',
  _480P: '480p',
  _720P: '720p',
  _1080P: '1080p',
  _1440P: '1440p',
  PORTRAIT_360X640: 'portrait-360x640',
  PORTRAIT_480X854: 'portrait-480x854',
  PORTRAIT_720X1280: 'portrait-720x1280',
  PORTRAIT_1080X1920: 'portrait-1080x1920',
  PORTRAIT_1440X2560: 'portrait-1440x2560',
} as const;
export type RecordSettingsRequestQualityEnum =
  (typeof RecordSettingsRequestQualityEnum)[keyof typeof RecordSettingsRequestQualityEnum];

/**
 * RecordSettings is the payload for recording settings
 * @export
 * @interface RecordSettingsResponse
 */
export interface RecordSettingsResponse {
  /**
   *
   * @type {boolean}
   * @memberof RecordSettingsResponse
   */
  audio_only: boolean;
  /**
   *
   * @type {string}
   * @memberof RecordSettingsResponse
   */
  mode: string;
  /**
   *
   * @type {string}
   * @memberof RecordSettingsResponse
   */
  quality: string;
}
/**
 *
 * @export
 * @interface RejectCallRequest
 */
export interface RejectCallRequest {
  /**
   * Reason for rejecting the call
   * @type {string}
   * @memberof RejectCallRequest
   */
  reason?: string;
}
/**
 *
 * @export
 * @interface RejectCallResponse
 */
export interface RejectCallResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof RejectCallResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface ReportByHistogramBucket
 */
export interface ReportByHistogramBucket {
  /**
   *
   * @type {string}
   * @memberof ReportByHistogramBucket
   */
  category: string;
  /**
   *
   * @type {number}
   * @memberof ReportByHistogramBucket
   */
  count: number;
  /**
   *
   * @type {Bound}
   * @memberof ReportByHistogramBucket
   */
  lower_bound?: Bound;
  /**
   *
   * @type {number}
   * @memberof ReportByHistogramBucket
   */
  sum: number;
  /**
   *
   * @type {Bound}
   * @memberof ReportByHistogramBucket
   */
  upper_bound?: Bound;
}
/**
 *
 * @export
 * @interface RequestPermissionRequest
 */
export interface RequestPermissionRequest {
  /**
   *
   * @type {Array<string>}
   * @memberof RequestPermissionRequest
   */
  permissions: Array<string>;
}
/**
 *
 * @export
 * @interface RequestPermissionResponse
 */
export interface RequestPermissionResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof RequestPermissionResponse
   */
  duration: string;
}
/**
 * Basic response information
 * @export
 * @interface Response
 */
export interface Response {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof Response
   */
  duration: string;
}
/**
 *
 * @export
 * @interface RingSettingsRequest
 */
export interface RingSettingsRequest {
  /**
   *
   * @type {number}
   * @memberof RingSettingsRequest
   */
  auto_cancel_timeout_ms: number;
  /**
   *
   * @type {number}
   * @memberof RingSettingsRequest
   */
  incoming_call_timeout_ms: number;
  /**
   *
   * @type {number}
   * @memberof RingSettingsRequest
   */
  missed_call_timeout_ms?: number;
}
/**
 *
 * @export
 * @interface RingSettingsResponse
 */
export interface RingSettingsResponse {
  /**
   *
   * @type {number}
   * @memberof RingSettingsResponse
   */
  auto_cancel_timeout_ms: number;
  /**
   *
   * @type {number}
   * @memberof RingSettingsResponse
   */
  incoming_call_timeout_ms: number;
  /**
   *
   * @type {number}
   * @memberof RingSettingsResponse
   */
  missed_call_timeout_ms: number;
}
/**
 *
 * @export
 * @interface SDKUsageReport
 */
export interface SDKUsageReport {
  /**
   *
   * @type {{ [key: string]: PerSDKUsageReport; }}
   * @memberof SDKUsageReport
   */
  per_sdk_usage: { [key: string]: PerSDKUsageReport };
}
/**
 *
 * @export
 * @interface SDKUsageReportResponse
 */
export interface SDKUsageReportResponse {
  /**
   *
   * @type {Array<DailyAggregateSDKUsageReportResponse>}
   * @memberof SDKUsageReportResponse
   */
  daily: Array<DailyAggregateSDKUsageReportResponse>;
}
/**
 *
 * @export
 * @interface SFULocationResponse
 */
export interface SFULocationResponse {
  /**
   *
   * @type {Coordinates}
   * @memberof SFULocationResponse
   */
  coordinates: Coordinates;
  /**
   *
   * @type {string}
   * @memberof SFULocationResponse
   */
  datacenter: string;
  /**
   *
   * @type {string}
   * @memberof SFULocationResponse
   */
  id: string;
  /**
   *
   * @type {Location}
   * @memberof SFULocationResponse
   */
  location: Location;
}
/**
 *
 * @export
 * @interface SFUResponse
 */
export interface SFUResponse {
  /**
   *
   * @type {string}
   * @memberof SFUResponse
   */
  edge_name: string;
  /**
   *
   * @type {string}
   * @memberof SFUResponse
   */
  url: string;
  /**
   *
   * @type {string}
   * @memberof SFUResponse
   */
  ws_endpoint: string;
}
/**
 *
 * @export
 * @interface ScreensharingSettingsRequest
 */
export interface ScreensharingSettingsRequest {
  /**
   *
   * @type {boolean}
   * @memberof ScreensharingSettingsRequest
   */
  access_request_enabled?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ScreensharingSettingsRequest
   */
  enabled?: boolean;
  /**
   *
   * @type {TargetResolution}
   * @memberof ScreensharingSettingsRequest
   */
  target_resolution?: TargetResolution;
}
/**
 *
 * @export
 * @interface ScreensharingSettingsResponse
 */
export interface ScreensharingSettingsResponse {
  /**
   *
   * @type {boolean}
   * @memberof ScreensharingSettingsResponse
   */
  access_request_enabled: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ScreensharingSettingsResponse
   */
  enabled: boolean;
  /**
   *
   * @type {TargetResolution}
   * @memberof ScreensharingSettingsResponse
   */
  target_resolution?: TargetResolution;
}
/**
 * Send a call event to the other user
 * @export
 * @interface SendCallEventRequest
 */
export interface SendCallEventRequest {
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof SendCallEventRequest
   */
  custom?: { [key: string]: any };
}
/**
 *
 * @export
 * @interface SendCallEventResponse
 */
export interface SendCallEventResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof SendCallEventResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface SendReactionRequest
 */
export interface SendReactionRequest {
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof SendReactionRequest
   */
  custom?: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof SendReactionRequest
   */
  emoji_code?: string;
  /**
   *
   * @type {string}
   * @memberof SendReactionRequest
   */
  type: string;
}
/**
 * Basic response information
 * @export
 * @interface SendReactionResponse
 */
export interface SendReactionResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof SendReactionResponse
   */
  duration: string;
  /**
   *
   * @type {ReactionResponse}
   * @memberof SendReactionResponse
   */
  reaction: ReactionResponse;
}
/**
 *
 * @export
 * @interface SessionSettingsRequest
 */
export interface SessionSettingsRequest {
  /**
   *
   * @type {number}
   * @memberof SessionSettingsRequest
   */
  inactivity_timeout_seconds: number;
}
/**
 *
 * @export
 * @interface SessionSettingsResponse
 */
export interface SessionSettingsResponse {
  /**
   *
   * @type {number}
   * @memberof SessionSettingsResponse
   */
  inactivity_timeout_seconds: number;
}
/**
 *
 * @export
 * @interface SortParamRequest
 */
export interface SortParamRequest {
  /**
   * Direction of sorting, 1 for Ascending, -1 for Descending, default is 1
   * @type {number}
   * @memberof SortParamRequest
   */
  direction?: number;
  /**
   * Name of field to sort by
   * @type {string}
   * @memberof SortParamRequest
   */
  field?: string;
}
/**
 *
 * @export
 * @interface StartClosedCaptionsRequest
 */
export interface StartClosedCaptionsRequest {
  /**
   * Enable transcriptions along with closed captions
   * @type {boolean}
   * @memberof StartClosedCaptionsRequest
   */
  enable_transcription?: boolean;
  /**
   * Which external storage to use for transcriptions (only applicable if enable_transcription is true)
   * @type {string}
   * @memberof StartClosedCaptionsRequest
   */
  external_storage?: string;
  /**
   * The spoken language in the call, if not provided the language defined in the transcription settings will be used
   * @type {string}
   * @memberof StartClosedCaptionsRequest
   */
  language?: string;
}
/**
 *
 * @export
 * @interface StartClosedCaptionsResponse
 */
export interface StartClosedCaptionsResponse {
  /**
   *
   * @type {string}
   * @memberof StartClosedCaptionsResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface StartFrameRecordingRequest
 */
export interface StartFrameRecordingRequest {
  /**
   *
   * @type {string}
   * @memberof StartFrameRecordingRequest
   */
  recording_external_storage?: string;
}
/**
 * StartFrameRecordingResponse is the response payload for the start frame recording endpoint.
 * @export
 * @interface StartFrameRecordingResponse
 */
export interface StartFrameRecordingResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof StartFrameRecordingResponse
   */
  duration: string;
}
/**
 * StartHLSBroadcastingResponse is the payload for starting an HLS broadcasting.
 * @export
 * @interface StartHLSBroadcastingResponse
 */
export interface StartHLSBroadcastingResponse {
  /**
   *
   * @type {string}
   * @memberof StartHLSBroadcastingResponse
   */
  duration: string;
  /**
   * the URL of the HLS playlist
   * @type {string}
   * @memberof StartHLSBroadcastingResponse
   */
  playlist_url: string;
}
/**
 * StartRTMPBroadcastsRequest is the payload for starting RTMP broadcasts.
 * @export
 * @interface StartRTMPBroadcastsRequest
 */
export interface StartRTMPBroadcastsRequest {
  /**
   * List of broadcasts to start
   * @type {Array<RTMPBroadcastRequest>}
   * @memberof StartRTMPBroadcastsRequest
   */
  broadcasts: Array<RTMPBroadcastRequest>;
}
/**
 * StartRTMPBroadcastsResponse is the payload for starting an RTMP broadcast.
 * @export
 * @interface StartRTMPBroadcastsResponse
 */
export interface StartRTMPBroadcastsResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof StartRTMPBroadcastsResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface StartRecordingRequest
 */
export interface StartRecordingRequest {
  /**
   *
   * @type {string}
   * @memberof StartRecordingRequest
   */
  recording_external_storage?: string;
}
/**
 * StartRecordingResponse is the response payload for the start recording endpoint.
 * @export
 * @interface StartRecordingResponse
 */
export interface StartRecordingResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof StartRecordingResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface StartTranscriptionRequest
 */
export interface StartTranscriptionRequest {
  /**
   * Enable closed captions along with transcriptions
   * @type {boolean}
   * @memberof StartTranscriptionRequest
   */
  enable_closed_captions?: boolean;
  /**
   * The spoken language in the call, if not provided the language defined in the transcription settings will be used
   * @type {string}
   * @memberof StartTranscriptionRequest
   */
  language?: string;
  /**
   * Store transcriptions in this external storage
   * @type {string}
   * @memberof StartTranscriptionRequest
   */
  transcription_external_storage?: string;
}
/**
 *
 * @export
 * @interface StartTranscriptionResponse
 */
export interface StartTranscriptionResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof StartTranscriptionResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface StatsOptions
 */
export interface StatsOptions {
  /**
   *
   * @type {number}
   * @memberof StatsOptions
   */
  reporting_interval_ms: number;
}
/**
 *
 * @export
 * @interface StopAllRTMPBroadcastsResponse
 */
export interface StopAllRTMPBroadcastsResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof StopAllRTMPBroadcastsResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface StopClosedCaptionsRequest
 */
export interface StopClosedCaptionsRequest {
  /**
   *
   * @type {boolean}
   * @memberof StopClosedCaptionsRequest
   */
  stop_transcription?: boolean;
}
/**
 * Basic response information
 * @export
 * @interface StopClosedCaptionsResponse
 */
export interface StopClosedCaptionsResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof StopClosedCaptionsResponse
   */
  duration: string;
}
/**
 * Basic response information
 * @export
 * @interface StopFrameRecordingResponse
 */
export interface StopFrameRecordingResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof StopFrameRecordingResponse
   */
  duration: string;
}
/**
 * Basic response information
 * @export
 * @interface StopHLSBroadcastingResponse
 */
export interface StopHLSBroadcastingResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof StopHLSBroadcastingResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface StopLiveRequest
 */
export interface StopLiveRequest {
  /**
   *
   * @type {boolean}
   * @memberof StopLiveRequest
   */
  continue_closed_caption?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof StopLiveRequest
   */
  continue_hls?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof StopLiveRequest
   */
  continue_recording?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof StopLiveRequest
   */
  continue_rtmp_broadcasts?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof StopLiveRequest
   */
  continue_transcription?: boolean;
}
/**
 *
 * @export
 * @interface StopLiveResponse
 */
export interface StopLiveResponse {
  /**
   *
   * @type {CallResponse}
   * @memberof StopLiveResponse
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof StopLiveResponse
   */
  duration: string;
}
/**
 * Basic response information
 * @export
 * @interface StopRTMPBroadcastsResponse
 */
export interface StopRTMPBroadcastsResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof StopRTMPBroadcastsResponse
   */
  duration: string;
}
/**
 * Basic response information
 * @export
 * @interface StopRecordingResponse
 */
export interface StopRecordingResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof StopRecordingResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface StopTranscriptionRequest
 */
export interface StopTranscriptionRequest {
  /**
   *
   * @type {boolean}
   * @memberof StopTranscriptionRequest
   */
  stop_closed_captions?: boolean;
}
/**
 * Basic response information
 * @export
 * @interface StopTranscriptionResponse
 */
export interface StopTranscriptionResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof StopTranscriptionResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface Subsession
 */
export interface Subsession {
  /**
   *
   * @type {number}
   * @memberof Subsession
   */
  ended_at: number;
  /**
   *
   * @type {number}
   * @memberof Subsession
   */
  joined_at: number;
  /**
   *
   * @type {MediaPubSubHint}
   * @memberof Subsession
   */
  pub_sub_hint?: MediaPubSubHint;
  /**
   *
   * @type {string}
   * @memberof Subsession
   */
  sfu_id: string;
}
/**
 *
 * @export
 * @interface TURNAggregatedStats
 */
export interface TURNAggregatedStats {
  /**
   *
   * @type {Count}
   * @memberof TURNAggregatedStats
   */
  tcp?: Count;
  /**
   *
   * @type {Count}
   * @memberof TURNAggregatedStats
   */
  total?: Count;
}
/**
 *
 * @export
 * @interface TargetResolution
 */
export interface TargetResolution {
  /**
   *
   * @type {number}
   * @memberof TargetResolution
   */
  bitrate?: number;
  /**
   *
   * @type {number}
   * @memberof TargetResolution
   */
  height: number;
  /**
   *
   * @type {number}
   * @memberof TargetResolution
   */
  width: number;
}
/**
 *
 * @export
 * @interface ThumbnailResponse
 */
export interface ThumbnailResponse {
  /**
   *
   * @type {string}
   * @memberof ThumbnailResponse
   */
  image_url: string;
}
/**
 *
 * @export
 * @interface ThumbnailsSettingsRequest
 */
export interface ThumbnailsSettingsRequest {
  /**
   *
   * @type {boolean}
   * @memberof ThumbnailsSettingsRequest
   */
  enabled?: boolean;
}
/**
 *
 * @export
 * @interface ThumbnailsSettingsResponse
 */
export interface ThumbnailsSettingsResponse {
  /**
   *
   * @type {boolean}
   * @memberof ThumbnailsSettingsResponse
   */
  enabled: boolean;
}
/**
 *
 * @export
 * @interface TimeStats
 */
export interface TimeStats {
  /**
   *
   * @type {number}
   * @memberof TimeStats
   */
  average_seconds: number;
  /**
   *
   * @type {number}
   * @memberof TimeStats
   */
  max_seconds: number;
}
/**
 *
 * @export
 * @interface TranscriptionSettingsRequest
 */
export interface TranscriptionSettingsRequest {
  /**
   *
   * @type {string}
   * @memberof TranscriptionSettingsRequest
   */
  closed_caption_mode?: TranscriptionSettingsRequestClosedCaptionModeEnum;
  /**
   *
   * @type {string}
   * @memberof TranscriptionSettingsRequest
   */
  language?: TranscriptionSettingsRequestLanguageEnum;
  /**
   *
   * @type {string}
   * @memberof TranscriptionSettingsRequest
   */
  mode: TranscriptionSettingsRequestModeEnum;
}

/**
 * @export
 */
export const TranscriptionSettingsRequestClosedCaptionModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type TranscriptionSettingsRequestClosedCaptionModeEnum =
  (typeof TranscriptionSettingsRequestClosedCaptionModeEnum)[keyof typeof TranscriptionSettingsRequestClosedCaptionModeEnum];

/**
 * @export
 */
export const TranscriptionSettingsRequestLanguageEnum = {
  AUTO: 'auto',
  EN: 'en',
  FR: 'fr',
  ES: 'es',
  DE: 'de',
  IT: 'it',
  NL: 'nl',
  PT: 'pt',
  PL: 'pl',
  CA: 'ca',
  CS: 'cs',
  DA: 'da',
  EL: 'el',
  FI: 'fi',
  ID: 'id',
  JA: 'ja',
  RU: 'ru',
  SV: 'sv',
  TA: 'ta',
  TH: 'th',
  TR: 'tr',
  HU: 'hu',
  RO: 'ro',
  ZH: 'zh',
  AR: 'ar',
  TL: 'tl',
  HE: 'he',
  HI: 'hi',
  HR: 'hr',
  KO: 'ko',
  MS: 'ms',
  NO: 'no',
  UK: 'uk',
} as const;
export type TranscriptionSettingsRequestLanguageEnum =
  (typeof TranscriptionSettingsRequestLanguageEnum)[keyof typeof TranscriptionSettingsRequestLanguageEnum];

/**
 * @export
 */
export const TranscriptionSettingsRequestModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type TranscriptionSettingsRequestModeEnum =
  (typeof TranscriptionSettingsRequestModeEnum)[keyof typeof TranscriptionSettingsRequestModeEnum];

/**
 *
 * @export
 * @interface TranscriptionSettingsResponse
 */
export interface TranscriptionSettingsResponse {
  /**
   *
   * @type {string}
   * @memberof TranscriptionSettingsResponse
   */
  closed_caption_mode: TranscriptionSettingsResponseClosedCaptionModeEnum;
  /**
   *
   * @type {string}
   * @memberof TranscriptionSettingsResponse
   */
  language: TranscriptionSettingsResponseLanguageEnum;
  /**
   *
   * @type {string}
   * @memberof TranscriptionSettingsResponse
   */
  mode: TranscriptionSettingsResponseModeEnum;
}

/**
 * @export
 */
export const TranscriptionSettingsResponseClosedCaptionModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type TranscriptionSettingsResponseClosedCaptionModeEnum =
  (typeof TranscriptionSettingsResponseClosedCaptionModeEnum)[keyof typeof TranscriptionSettingsResponseClosedCaptionModeEnum];

/**
 * @export
 */
export const TranscriptionSettingsResponseLanguageEnum = {
  AUTO: 'auto',
  EN: 'en',
  FR: 'fr',
  ES: 'es',
  DE: 'de',
  IT: 'it',
  NL: 'nl',
  PT: 'pt',
  PL: 'pl',
  CA: 'ca',
  CS: 'cs',
  DA: 'da',
  EL: 'el',
  FI: 'fi',
  ID: 'id',
  JA: 'ja',
  RU: 'ru',
  SV: 'sv',
  TA: 'ta',
  TH: 'th',
  TR: 'tr',
  HU: 'hu',
  RO: 'ro',
  ZH: 'zh',
  AR: 'ar',
  TL: 'tl',
  HE: 'he',
  HI: 'hi',
  HR: 'hr',
  KO: 'ko',
  MS: 'ms',
  NO: 'no',
  UK: 'uk',
} as const;
export type TranscriptionSettingsResponseLanguageEnum =
  (typeof TranscriptionSettingsResponseLanguageEnum)[keyof typeof TranscriptionSettingsResponseLanguageEnum];

/**
 * @export
 */
export const TranscriptionSettingsResponseModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type TranscriptionSettingsResponseModeEnum =
  (typeof TranscriptionSettingsResponseModeEnum)[keyof typeof TranscriptionSettingsResponseModeEnum];

/**
 * UnblockUserRequest is the payload for unblocking a user.
 * @export
 * @interface UnblockUserRequest
 */
export interface UnblockUserRequest {
  /**
   * the user to unblock
   * @type {string}
   * @memberof UnblockUserRequest
   */
  user_id: string;
}
/**
 * UnblockUserResponse is the payload for unblocking a user.
 * @export
 * @interface UnblockUserResponse
 */
export interface UnblockUserResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof UnblockUserResponse
   */
  duration: string;
}
/**
 * This event is sent when a user is unblocked on a call,
 * this can be useful to notify the user that they can now join the call again
 * @export
 * @interface UnblockedUserEvent
 */
export interface UnblockedUserEvent {
  /**
   *
   * @type {string}
   * @memberof UnblockedUserEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof UnblockedUserEvent
   */
  created_at: string;
  /**
   * The type of event: "call.unblocked_user" in this case
   * @type {string}
   * @memberof UnblockedUserEvent
   */
  type: string;
  /**
   *
   * @type {UserResponse}
   * @memberof UnblockedUserEvent
   */
  user: UserResponse;
}
/**
 * UnpinRequest is the payload for unpinning a message.
 * @export
 * @interface UnpinRequest
 */
export interface UnpinRequest {
  /**
   * the session ID of the user who pinned the message
   * @type {string}
   * @memberof UnpinRequest
   */
  session_id: string;
  /**
   * the user ID of the user who pinned the message
   * @type {string}
   * @memberof UnpinRequest
   */
  user_id: string;
}
/**
 * UnpinResponse is the payload for unpinning a message.
 * @export
 * @interface UnpinResponse
 */
export interface UnpinResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof UnpinResponse
   */
  duration: string;
}
/**
 * Update call members
 * @export
 * @interface UpdateCallMembersRequest
 */
export interface UpdateCallMembersRequest {
  /**
   * List of userID to remove
   * @type {Array<string>}
   * @memberof UpdateCallMembersRequest
   */
  remove_members?: Array<string>;
  /**
   * List of members to update or insert
   * @type {Array<MemberRequest>}
   * @memberof UpdateCallMembersRequest
   */
  update_members?: Array<MemberRequest>;
}
/**
 * Basic response information
 * @export
 * @interface UpdateCallMembersResponse
 */
export interface UpdateCallMembersResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof UpdateCallMembersResponse
   */
  duration: string;
  /**
   *
   * @type {Array<MemberResponse>}
   * @memberof UpdateCallMembersResponse
   */
  members: Array<MemberResponse>;
}
/**
 * Request for updating a call
 * @export
 * @interface UpdateCallRequest
 */
export interface UpdateCallRequest {
  /**
   * Custom data for this object
   * @type {{ [key: string]: any; }}
   * @memberof UpdateCallRequest
   */
  custom?: { [key: string]: any };
  /**
   *
   * @type {CallSettingsRequest}
   * @memberof UpdateCallRequest
   */
  settings_override?: CallSettingsRequest;
  /**
   * the time the call is scheduled to start
   * @type {string}
   * @memberof UpdateCallRequest
   */
  starts_at?: string;
}
/**
 * Response for updating a call
 * @export
 * @interface UpdateCallResponse
 */
export interface UpdateCallResponse {
  /**
   *
   * @type {CallResponse}
   * @memberof UpdateCallResponse
   */
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof UpdateCallResponse
   */
  duration: string;
  /**
   *
   * @type {Array<MemberResponse>}
   * @memberof UpdateCallResponse
   */
  members: Array<MemberResponse>;
  /**
   *
   * @type {MemberResponse}
   * @memberof UpdateCallResponse
   */
  membership?: MemberResponse;
  /**
   *
   * @type {Array<OwnCapability>}
   * @memberof UpdateCallResponse
   */
  own_capabilities: Array<OwnCapability>;
}
/**
 *
 * @export
 * @interface UpdateUserPermissionsRequest
 */
export interface UpdateUserPermissionsRequest {
  /**
   *
   * @type {Array<string>}
   * @memberof UpdateUserPermissionsRequest
   */
  grant_permissions?: Array<string>;
  /**
   *
   * @type {Array<string>}
   * @memberof UpdateUserPermissionsRequest
   */
  revoke_permissions?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof UpdateUserPermissionsRequest
   */
  user_id: string;
}
/**
 * Basic response information
 * @export
 * @interface UpdateUserPermissionsResponse
 */
export interface UpdateUserPermissionsResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof UpdateUserPermissionsResponse
   */
  duration: string;
}
/**
 * This event is sent to notify about permission changes for a user, clients receiving this event should update their UI accordingly
 * @export
 * @interface UpdatedCallPermissionsEvent
 */
export interface UpdatedCallPermissionsEvent {
  /**
   *
   * @type {string}
   * @memberof UpdatedCallPermissionsEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof UpdatedCallPermissionsEvent
   */
  created_at: string;
  /**
   * The capabilities of the current user
   * @type {Array<OwnCapability>}
   * @memberof UpdatedCallPermissionsEvent
   */
  own_capabilities: Array<OwnCapability>;
  /**
   * The type of event: "call.permissions_updated" in this case
   * @type {string}
   * @memberof UpdatedCallPermissionsEvent
   */
  type: string;
  /**
   *
   * @type {UserResponse}
   * @memberof UpdatedCallPermissionsEvent
   */
  user: UserResponse;
}
/**
 *
 * @export
 * @interface UserFeedbackReport
 */
export interface UserFeedbackReport {
  /**
   *
   * @type {{ [key: string]: number; }}
   * @memberof UserFeedbackReport
   */
  count_by_rating: { [key: string]: number };
  /**
   *
   * @type {number}
   * @memberof UserFeedbackReport
   */
  unreported_count: number;
}
/**
 *
 * @export
 * @interface UserFeedbackReportResponse
 */
export interface UserFeedbackReportResponse {
  /**
   *
   * @type {Array<DailyAggregateUserFeedbackReportResponse>}
   * @memberof UserFeedbackReportResponse
   */
  daily: Array<DailyAggregateUserFeedbackReportResponse>;
}
/**
 *
 * @export
 * @interface UserInfoResponse
 */
export interface UserInfoResponse {
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof UserInfoResponse
   */
  custom: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof UserInfoResponse
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof UserInfoResponse
   */
  image: string;
  /**
   *
   * @type {string}
   * @memberof UserInfoResponse
   */
  name: string;
  /**
   *
   * @type {Array<string>}
   * @memberof UserInfoResponse
   */
  roles: Array<string>;
}
/**
 * User request object
 * @export
 * @interface UserRequest
 */
export interface UserRequest {
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof UserRequest
   */
  custom?: { [key: string]: any };
  /**
   * User ID
   * @type {string}
   * @memberof UserRequest
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof UserRequest
   */
  image?: string;
  /**
   *
   * @type {boolean}
   * @memberof UserRequest
   */
  invisible?: boolean;
  /**
   *
   * @type {string}
   * @memberof UserRequest
   */
  language?: string;
  /**
   * Optional name of user
   * @type {string}
   * @memberof UserRequest
   */
  name?: string;
  /**
   *
   * @type {object}
   * @memberof UserRequest
   */
  privacy_settings?: object;
}
/**
 * User response object
 * @export
 * @interface UserResponse
 */
export interface UserResponse {
  /**
   *
   * @type {Array<string>}
   * @memberof UserResponse
   */
  blocked_user_ids: Array<string>;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof UserResponse
   */
  created_at: string;
  /**
   * Custom data for this object
   * @type {{ [key: string]: any; }}
   * @memberof UserResponse
   */
  custom: { [key: string]: any };
  /**
   * Date of deactivation
   * @type {string}
   * @memberof UserResponse
   */
  deactivated_at?: string;
  /**
   * Date/time of deletion
   * @type {string}
   * @memberof UserResponse
   */
  deleted_at?: string;
  /**
   * Unique user identifier
   * @type {string}
   * @memberof UserResponse
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof UserResponse
   */
  image?: string;
  /**
   * Preferred language of a user
   * @type {string}
   * @memberof UserResponse
   */
  language: string;
  /**
   * Date of last activity
   * @type {string}
   * @memberof UserResponse
   */
  last_active?: string;
  /**
   * Optional name of user
   * @type {string}
   * @memberof UserResponse
   */
  name?: string;
  /**
   * Revocation date for tokens
   * @type {string}
   * @memberof UserResponse
   */
  revoke_tokens_issued_before?: string;
  /**
   * Determines the set of user permissions
   * @type {string}
   * @memberof UserResponse
   */
  role: string;
  /**
   * List of teams user is a part of
   * @type {Array<string>}
   * @memberof UserResponse
   */
  teams: Array<string>;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof UserResponse
   */
  updated_at: string;
}
/**
 *
 * @export
 * @interface UserResponsePrivacyFields
 */
export interface UserResponsePrivacyFields {
  /**
   *
   * @type {Array<string>}
   * @memberof UserResponsePrivacyFields
   */
  blocked_user_ids: Array<string>;
  /**
   *
   * @type {string}
   * @memberof UserResponsePrivacyFields
   */
  created_at: string;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof UserResponsePrivacyFields
   */
  custom: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof UserResponsePrivacyFields
   */
  deactivated_at?: string;
  /**
   *
   * @type {string}
   * @memberof UserResponsePrivacyFields
   */
  deleted_at?: string;
  /**
   *
   * @type {string}
   * @memberof UserResponsePrivacyFields
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof UserResponsePrivacyFields
   */
  image?: string;
  /**
   *
   * @type {boolean}
   * @memberof UserResponsePrivacyFields
   */
  invisible?: boolean;
  /**
   *
   * @type {string}
   * @memberof UserResponsePrivacyFields
   */
  language: string;
  /**
   *
   * @type {string}
   * @memberof UserResponsePrivacyFields
   */
  last_active?: string;
  /**
   *
   * @type {string}
   * @memberof UserResponsePrivacyFields
   */
  name?: string;
  /**
   *
   * @type {object}
   * @memberof UserResponsePrivacyFields
   */
  privacy_settings?: object;
  /**
   *
   * @type {string}
   * @memberof UserResponsePrivacyFields
   */
  revoke_tokens_issued_before?: string;
  /**
   *
   * @type {string}
   * @memberof UserResponsePrivacyFields
   */
  role: string;
  /**
   *
   * @type {Array<string>}
   * @memberof UserResponsePrivacyFields
   */
  teams: Array<string>;
  /**
   *
   * @type {string}
   * @memberof UserResponsePrivacyFields
   */
  updated_at: string;
}
/**
 *
 * @export
 * @interface UserSessionStats
 */
export interface UserSessionStats {
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  average_connection_time?: number;
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  browser?: string;
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  browser_version?: string;
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  current_ip?: string;
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  current_sfu?: string;
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  device_model?: string;
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  device_version?: string;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  distance_to_sfu_kilometers?: number;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  freeze_duration_seconds: number;
  /**
   *
   * @type {GeolocationResult}
   * @memberof UserSessionStats
   */
  geolocation?: GeolocationResult;
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  group: string;
  /**
   *
   * @type {TimeStats}
   * @memberof UserSessionStats
   */
  jitter?: TimeStats;
  /**
   *
   * @type {TimeStats}
   * @memberof UserSessionStats
   */
  latency?: TimeStats;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  max_fir_per_second?: number;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  max_freeze_fraction: number;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  max_freezes_duration_seconds: number;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  max_freezes_per_second?: number;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  max_nack_per_second?: number;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  max_pli_per_second?: number;
  /**
   *
   * @type {VideoQuality}
   * @memberof UserSessionStats
   */
  max_publishing_video_quality?: VideoQuality;
  /**
   *
   * @type {VideoQuality}
   * @memberof UserSessionStats
   */
  max_receiving_video_quality?: VideoQuality;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  min_event_ts: number;
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  os?: string;
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  os_version?: string;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  packet_loss_fraction: number;
  /**
   *
   * @type {MediaPubSubHint}
   * @memberof UserSessionStats
   */
  pub_sub_hints?: MediaPubSubHint;
  /**
   *
   * @type {Array<PublishedTrackInfo>}
   * @memberof UserSessionStats
   */
  published_tracks?: Array<PublishedTrackInfo>;
  /**
   *
   * @type {TimeStats}
   * @memberof UserSessionStats
   */
  publisher_jitter?: TimeStats;
  /**
   *
   * @type {TimeStats}
   * @memberof UserSessionStats
   */
  publisher_latency?: TimeStats;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  publisher_noise_cancellation_seconds?: number;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  publisher_packet_loss_fraction: number;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  publisher_quality_limitation_fraction?: number;
  /**
   *
   * @type {{ [key: string]: number; }}
   * @memberof UserSessionStats
   */
  publisher_video_quality_limitation_duration_seconds?: {
    [key: string]: number;
  };
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  publishing_audio_codec?: string;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  publishing_duration_seconds: number;
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  publishing_video_codec?: string;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  quality_score: number;
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  receiving_audio_codec?: string;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  receiving_duration_seconds: number;
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  receiving_video_codec?: string;
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  sdk?: string;
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  sdk_version?: string;
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  session_id: string;
  /**
   *
   * @type {TimeStats}
   * @memberof UserSessionStats
   */
  subscriber_jitter?: TimeStats;
  /**
   *
   * @type {TimeStats}
   * @memberof UserSessionStats
   */
  subscriber_latency?: TimeStats;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  subscriber_video_quality_throttled_duration_seconds?: number;
  /**
   *
   * @type {Array<Subsession>}
   * @memberof UserSessionStats
   */
  subsessions?: Array<Subsession>;
  /**
   *
   * @type {CallTimeline}
   * @memberof UserSessionStats
   */
  timeline?: CallTimeline;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  total_pixels_in: number;
  /**
   *
   * @type {number}
   * @memberof UserSessionStats
   */
  total_pixels_out: number;
  /**
   *
   * @type {boolean}
   * @memberof UserSessionStats
   */
  truncated?: boolean;
  /**
   *
   * @type {string}
   * @memberof UserSessionStats
   */
  webrtc_version?: string;
}
/**
 *
 * @export
 * @interface UserStats
 */
export interface UserStats {
  /**
   *
   * @type {UserInfoResponse}
   * @memberof UserStats
   */
  info: UserInfoResponse;
  /**
   *
   * @type {number}
   * @memberof UserStats
   */
  min_event_ts: number;
  /**
   *
   * @type {number}
   * @memberof UserStats
   */
  rating?: number;
  /**
   *
   * @type {Array<UserSessionStats>}
   * @memberof UserStats
   */
  session_stats: Array<UserSessionStats>;
}
/**
 * This event is sent when a user gets updated. The event contains information about the updated user.
 * @export
 * @interface UserUpdatedEvent
 */
export interface UserUpdatedEvent {
  /**
   * Date/time of creation
   * @type {string}
   * @memberof UserUpdatedEvent
   */
  created_at: string;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof UserUpdatedEvent
   */
  custom: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof UserUpdatedEvent
   */
  received_at?: string;
  /**
   * The type of event: "user.updated" in this case
   * @type {string}
   * @memberof UserUpdatedEvent
   */
  type: string;
  /**
   *
   * @type {UserResponsePrivacyFields}
   * @memberof UserUpdatedEvent
   */
  user: UserResponsePrivacyFields;
}
/**
 *
 * @export
 * @interface VideoDimension
 */
export interface VideoDimension {
  /**
   *
   * @type {number}
   * @memberof VideoDimension
   */
  height: number;
  /**
   *
   * @type {number}
   * @memberof VideoDimension
   */
  width: number;
}
/**
 * @type VideoEvent
 * The discriminator object for all websocket events, it maps events' payload to the final type
 * @export
 */
export type VideoEvent =
  | ({ type: 'call.accepted' } & CallAcceptedEvent)
  | ({ type: 'call.blocked_user' } & BlockedUserEvent)
  | ({ type: 'call.closed_caption' } & ClosedCaptionEvent)
  | ({ type: 'call.closed_captions_failed' } & CallClosedCaptionsFailedEvent)
  | ({ type: 'call.closed_captions_started' } & CallClosedCaptionsStartedEvent)
  | ({ type: 'call.closed_captions_stopped' } & CallClosedCaptionsStoppedEvent)
  | ({ type: 'call.created' } & CallCreatedEvent)
  | ({ type: 'call.deleted' } & CallDeletedEvent)
  | ({ type: 'call.ended' } & CallEndedEvent)
  | ({ type: 'call.hls_broadcasting_failed' } & CallHLSBroadcastingFailedEvent)
  | ({
      type: 'call.hls_broadcasting_started';
    } & CallHLSBroadcastingStartedEvent)
  | ({
      type: 'call.hls_broadcasting_stopped';
    } & CallHLSBroadcastingStoppedEvent)
  | ({ type: 'call.live_started' } & CallLiveStartedEvent)
  | ({ type: 'call.member_added' } & CallMemberAddedEvent)
  | ({ type: 'call.member_removed' } & CallMemberRemovedEvent)
  | ({ type: 'call.member_updated' } & CallMemberUpdatedEvent)
  | ({
      type: 'call.member_updated_permission';
    } & CallMemberUpdatedPermissionEvent)
  | ({ type: 'call.missed' } & CallMissedEvent)
  | ({ type: 'call.notification' } & CallNotificationEvent)
  | ({ type: 'call.permission_request' } & PermissionRequestEvent)
  | ({ type: 'call.permissions_updated' } & UpdatedCallPermissionsEvent)
  | ({ type: 'call.reaction_new' } & CallReactionEvent)
  | ({ type: 'call.recording_failed' } & CallRecordingFailedEvent)
  | ({ type: 'call.recording_ready' } & CallRecordingReadyEvent)
  | ({ type: 'call.recording_started' } & CallRecordingStartedEvent)
  | ({ type: 'call.recording_stopped' } & CallRecordingStoppedEvent)
  | ({ type: 'call.rejected' } & CallRejectedEvent)
  | ({ type: 'call.ring' } & CallRingEvent)
  | ({ type: 'call.rtmp_broadcast_failed' } & CallRtmpBroadcastFailedEvent)
  | ({ type: 'call.rtmp_broadcast_started' } & CallRtmpBroadcastStartedEvent)
  | ({ type: 'call.rtmp_broadcast_stopped' } & CallRtmpBroadcastStoppedEvent)
  | ({ type: 'call.session_ended' } & CallSessionEndedEvent)
  | ({
      type: 'call.session_participant_count_updated';
    } & CallSessionParticipantCountsUpdatedEvent)
  | ({
      type: 'call.session_participant_joined';
    } & CallSessionParticipantJoinedEvent)
  | ({
      type: 'call.session_participant_left';
    } & CallSessionParticipantLeftEvent)
  | ({ type: 'call.session_started' } & CallSessionStartedEvent)
  | ({ type: 'call.transcription_failed' } & CallTranscriptionFailedEvent)
  | ({ type: 'call.transcription_ready' } & CallTranscriptionReadyEvent)
  | ({ type: 'call.transcription_started' } & CallTranscriptionStartedEvent)
  | ({ type: 'call.transcription_stopped' } & CallTranscriptionStoppedEvent)
  | ({ type: 'call.unblocked_user' } & UnblockedUserEvent)
  | ({ type: 'call.updated' } & CallUpdatedEvent)
  | ({ type: 'call.user_muted' } & CallUserMutedEvent)
  | ({ type: 'connection.error' } & ConnectionErrorEvent)
  | ({ type: 'connection.ok' } & ConnectedEvent)
  | ({ type: 'custom' } & CustomVideoEvent)
  | ({ type: 'health.check' } & HealthCheckEvent)
  | ({ type: 'user.updated' } & UserUpdatedEvent);
/**
 *
 * @export
 * @interface VideoQuality
 */
export interface VideoQuality {
  /**
   *
   * @type {VideoDimension}
   * @memberof VideoQuality
   */
  resolution?: VideoDimension;
  /**
   *
   * @type {string}
   * @memberof VideoQuality
   */
  usage_type?: string;
}
/**
 *
 * @export
 * @interface VideoSettingsRequest
 */
export interface VideoSettingsRequest {
  /**
   *
   * @type {boolean}
   * @memberof VideoSettingsRequest
   */
  access_request_enabled?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof VideoSettingsRequest
   */
  camera_default_on?: boolean;
  /**
   *
   * @type {string}
   * @memberof VideoSettingsRequest
   */
  camera_facing?: VideoSettingsRequestCameraFacingEnum;
  /**
   *
   * @type {boolean}
   * @memberof VideoSettingsRequest
   */
  enabled?: boolean;
  /**
   *
   * @type {TargetResolution}
   * @memberof VideoSettingsRequest
   */
  target_resolution?: TargetResolution;
}

/**
 * @export
 */
export const VideoSettingsRequestCameraFacingEnum = {
  FRONT: 'front',
  BACK: 'back',
  EXTERNAL: 'external',
} as const;
export type VideoSettingsRequestCameraFacingEnum =
  (typeof VideoSettingsRequestCameraFacingEnum)[keyof typeof VideoSettingsRequestCameraFacingEnum];

/**
 *
 * @export
 * @interface VideoSettingsResponse
 */
export interface VideoSettingsResponse {
  /**
   *
   * @type {boolean}
   * @memberof VideoSettingsResponse
   */
  access_request_enabled: boolean;
  /**
   *
   * @type {boolean}
   * @memberof VideoSettingsResponse
   */
  camera_default_on: boolean;
  /**
   *
   * @type {string}
   * @memberof VideoSettingsResponse
   */
  camera_facing: VideoSettingsResponseCameraFacingEnum;
  /**
   *
   * @type {boolean}
   * @memberof VideoSettingsResponse
   */
  enabled: boolean;
  /**
   *
   * @type {TargetResolution}
   * @memberof VideoSettingsResponse
   */
  target_resolution: TargetResolution;
}

/**
 * @export
 */
export const VideoSettingsResponseCameraFacingEnum = {
  FRONT: 'front',
  BACK: 'back',
  EXTERNAL: 'external',
} as const;
export type VideoSettingsResponseCameraFacingEnum =
  (typeof VideoSettingsResponseCameraFacingEnum)[keyof typeof VideoSettingsResponseCameraFacingEnum];

/**
 * Websocket auth message
 * @export
 * @interface WSAuthMessage
 */
export interface WSAuthMessage {
  /**
   *
   * @type {Array<string>}
   * @memberof WSAuthMessage
   */
  products?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof WSAuthMessage
   */
  token: string;
  /**
   *
   * @type {ConnectUserDetailsRequest}
   * @memberof WSAuthMessage
   */
  user_details: ConnectUserDetailsRequest;
}

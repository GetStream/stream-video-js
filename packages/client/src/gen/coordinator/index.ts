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
}
/**
 *
 * @export
 * @interface AcceptCallResponse
 */
export interface AcceptCallResponse {
  /**
   *
   * @type {string}
   * @memberof AcceptCallResponse
   */
  duration: string;
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
 *
 * @export
 * @interface BlockListOptions
 */
export interface BlockListOptions {
  /**
   *
   * @type {string}
   * @memberof BlockListOptions
   */
  behavior: BlockListOptionsBehaviorEnum;
  /**
   *
   * @type {string}
   * @memberof BlockListOptions
   */
  blocklist: string;
}

/**
 * @export
 */
export const BlockListOptionsBehaviorEnum = {
  FLAG: 'flag',
  BLOCK: 'block',
  SHADOW_BLOCK: 'shadow_block',
} as const;
export type BlockListOptionsBehaviorEnum =
  (typeof BlockListOptionsBehaviorEnum)[keyof typeof BlockListOptionsBehaviorEnum];

/**
 *
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
 *
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
}
/**
 *
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
  description: string;
  /**
   *
   * @type {number}
   * @memberof CallEvent
   */
  end_timestamp: number;
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
 *
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
 *
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
 *
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
 * @interface ChannelConfigWithInfo
 */
export interface ChannelConfigWithInfo {
  /**
   *
   * @type {Array<string>}
   * @memberof ChannelConfigWithInfo
   */
  allowed_flag_reasons?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof ChannelConfigWithInfo
   */
  automod: ChannelConfigWithInfoAutomodEnum;
  /**
   *
   * @type {string}
   * @memberof ChannelConfigWithInfo
   */
  automod_behavior: ChannelConfigWithInfoAutomodBehaviorEnum;
  /**
   *
   * @type {Thresholds}
   * @memberof ChannelConfigWithInfo
   */
  automod_thresholds?: Thresholds;
  /**
   *
   * @type {string}
   * @memberof ChannelConfigWithInfo
   */
  blocklist?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelConfigWithInfo
   */
  blocklist_behavior?: ChannelConfigWithInfoBlocklistBehaviorEnum;
  /**
   *
   * @type {Array<BlockListOptions>}
   * @memberof ChannelConfigWithInfo
   */
  blocklists?: Array<BlockListOptions>;
  /**
   *
   * @type {Array<Command>}
   * @memberof ChannelConfigWithInfo
   */
  commands: Array<Command>;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  connect_events: boolean;
  /**
   *
   * @type {string}
   * @memberof ChannelConfigWithInfo
   */
  created_at: string;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  custom_events: boolean;
  /**
   *
   * @type {{ [key: string]: Array<string>; }}
   * @memberof ChannelConfigWithInfo
   */
  grants?: { [key: string]: Array<string> };
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  mark_messages_pending: boolean;
  /**
   *
   * @type {number}
   * @memberof ChannelConfigWithInfo
   */
  max_message_length: number;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  mutes: boolean;
  /**
   *
   * @type {string}
   * @memberof ChannelConfigWithInfo
   */
  name: string;
  /**
   *
   * @type {number}
   * @memberof ChannelConfigWithInfo
   */
  partition_size?: number;
  /**
   *
   * @type {number}
   * @memberof ChannelConfigWithInfo
   */
  partition_ttl?: number;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  polls: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  push_notifications: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  quotes: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  reactions: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  read_events: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  reminders: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  replies: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  search: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  typing_events: boolean;
  /**
   *
   * @type {string}
   * @memberof ChannelConfigWithInfo
   */
  updated_at: string;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  uploads: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  url_enrichment: boolean;
}

/**
 * @export
 */
export const ChannelConfigWithInfoAutomodEnum = {
  DISABLED: 'disabled',
  SIMPLE: 'simple',
  AI: 'AI',
} as const;
export type ChannelConfigWithInfoAutomodEnum =
  (typeof ChannelConfigWithInfoAutomodEnum)[keyof typeof ChannelConfigWithInfoAutomodEnum];

/**
 * @export
 */
export const ChannelConfigWithInfoAutomodBehaviorEnum = {
  FLAG: 'flag',
  BLOCK: 'block',
  SHADOW_BLOCK: 'shadow_block',
} as const;
export type ChannelConfigWithInfoAutomodBehaviorEnum =
  (typeof ChannelConfigWithInfoAutomodBehaviorEnum)[keyof typeof ChannelConfigWithInfoAutomodBehaviorEnum];

/**
 * @export
 */
export const ChannelConfigWithInfoBlocklistBehaviorEnum = {
  FLAG: 'flag',
  BLOCK: 'block',
  SHADOW_BLOCK: 'shadow_block',
} as const;
export type ChannelConfigWithInfoBlocklistBehaviorEnum =
  (typeof ChannelConfigWithInfoBlocklistBehaviorEnum)[keyof typeof ChannelConfigWithInfoBlocklistBehaviorEnum];

/**
 *
 * @export
 * @interface ChannelMember
 */
export interface ChannelMember {
  /**
   * Expiration date of the ban
   * @type {string}
   * @memberof ChannelMember
   */
  ban_expires?: string;
  /**
   * Whether member is banned this channel or not
   * @type {boolean}
   * @memberof ChannelMember
   */
  banned: boolean;
  /**
   * Role of the member in the channel
   * @type {string}
   * @memberof ChannelMember
   */
  channel_role: string;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof ChannelMember
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof ChannelMember
   */
  deleted_at?: string;
  /**
   * Date when invite was accepted
   * @type {string}
   * @memberof ChannelMember
   */
  invite_accepted_at?: string;
  /**
   * Date when invite was rejected
   * @type {string}
   * @memberof ChannelMember
   */
  invite_rejected_at?: string;
  /**
   * Whether member was invited or not
   * @type {boolean}
   * @memberof ChannelMember
   */
  invited?: boolean;
  /**
   * Whether member is channel moderator or not
   * @type {boolean}
   * @memberof ChannelMember
   */
  is_moderator?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelMember
   */
  notifications_muted: boolean;
  /**
   * Whether member is shadow banned in this channel or not
   * @type {boolean}
   * @memberof ChannelMember
   */
  shadow_banned: boolean;
  /**
   *
   * @type {string}
   * @memberof ChannelMember
   */
  status?: string;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof ChannelMember
   */
  updated_at: string;
  /**
   *
   * @type {UserObject}
   * @memberof ChannelMember
   */
  user?: UserObject;
  /**
   *
   * @type {string}
   * @memberof ChannelMember
   */
  user_id?: string;
}
/**
 *
 * @export
 * @interface ChannelMute
 */
export interface ChannelMute {
  /**
   *
   * @type {ChannelResponse}
   * @memberof ChannelMute
   */
  channel?: ChannelResponse;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof ChannelMute
   */
  created_at: string;
  /**
   * Date/time of mute expiration
   * @type {string}
   * @memberof ChannelMute
   */
  expires?: string;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof ChannelMute
   */
  updated_at: string;
  /**
   *
   * @type {UserObject}
   * @memberof ChannelMute
   */
  user?: UserObject;
}
/**
 * Represents channel in chat
 * @export
 * @interface ChannelResponse
 */
export interface ChannelResponse {
  /**
   * Whether auto translation is enabled or not
   * @type {boolean}
   * @memberof ChannelResponse
   */
  auto_translation_enabled?: boolean;
  /**
   * Language to translate to when auto translation is active
   * @type {string}
   * @memberof ChannelResponse
   */
  auto_translation_language?: string;
  /**
   * Channel CID (<type>:<id>)
   * @type {string}
   * @memberof ChannelResponse
   */
  cid: string;
  /**
   *
   * @type {ChannelConfigWithInfo}
   * @memberof ChannelResponse
   */
  config?: ChannelConfigWithInfo;
  /**
   * Cooldown period after sending each message
   * @type {number}
   * @memberof ChannelResponse
   */
  cooldown?: number;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof ChannelResponse
   */
  created_at: string;
  /**
   *
   * @type {UserObject}
   * @memberof ChannelResponse
   */
  created_by?: UserObject;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof ChannelResponse
   */
  custom: { [key: string]: any };
  /**
   * Date/time of deletion
   * @type {string}
   * @memberof ChannelResponse
   */
  deleted_at?: string;
  /**
   *
   * @type {boolean}
   * @memberof ChannelResponse
   */
  disabled: boolean;
  /**
   * Whether channel is frozen or not
   * @type {boolean}
   * @memberof ChannelResponse
   */
  frozen: boolean;
  /**
   * Whether this channel is hidden by current user or not
   * @type {boolean}
   * @memberof ChannelResponse
   */
  hidden?: boolean;
  /**
   * Date since when the message history is accessible
   * @type {string}
   * @memberof ChannelResponse
   */
  hide_messages_before?: string;
  /**
   * Channel unique ID
   * @type {string}
   * @memberof ChannelResponse
   */
  id: string;
  /**
   * Date of the last message sent
   * @type {string}
   * @memberof ChannelResponse
   */
  last_message_at?: string;
  /**
   * Number of members in the channel
   * @type {number}
   * @memberof ChannelResponse
   */
  member_count?: number;
  /**
   * List of channel members (max 100)
   * @type {Array<ChannelMember>}
   * @memberof ChannelResponse
   */
  members?: Array<ChannelMember>;
  /**
   * Date of mute expiration
   * @type {string}
   * @memberof ChannelResponse
   */
  mute_expires_at?: string;
  /**
   * Whether this channel is muted or not
   * @type {boolean}
   * @memberof ChannelResponse
   */
  muted?: boolean;
  /**
   * List of channel capabilities of authenticated user
   * @type {Array<string>}
   * @memberof ChannelResponse
   */
  own_capabilities?: Array<string>;
  /**
   * Team the channel belongs to (multi-tenant only)
   * @type {string}
   * @memberof ChannelResponse
   */
  team?: string;
  /**
   * Date of the latest truncation of the channel
   * @type {string}
   * @memberof ChannelResponse
   */
  truncated_at?: string;
  /**
   *
   * @type {UserObject}
   * @memberof ChannelResponse
   */
  truncated_by?: UserObject;
  /**
   * Type of the channel
   * @type {string}
   * @memberof ChannelResponse
   */
  type: string;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof ChannelResponse
   */
  updated_at: string;
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
  user_session_id: string;
}
/**
 *
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
 * Represents custom chat command
 * @export
 * @interface Command
 */
export interface Command {
  /**
   * Arguments help text, shown in commands auto-completion
   * @type {string}
   * @memberof Command
   */
  args: string;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof Command
   */
  readonly created_at?: string;
  /**
   * Description, shown in commands auto-completion
   * @type {string}
   * @memberof Command
   */
  description: string;
  /**
   * Unique command name
   * @type {string}
   * @memberof Command
   */
  name: string;
  /**
   * Set name used for grouping commands
   * @type {string}
   * @memberof Command
   */
  set: string;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof Command
   */
  readonly updated_at?: string;
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
   * @type {PrivacySettings}
   * @memberof ConnectUserDetailsRequest
   */
  privacy_settings?: PrivacySettings;
  /**
   *
   * @type {PushNotificationSettingsInput}
   * @memberof ConnectUserDetailsRequest
   */
  push_notifications?: PushNotificationSettingsInput;
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
 * @interface DeleteRecordingResponse
 */
export interface DeleteRecordingResponse {
  /**
   *
   * @type {string}
   * @memberof DeleteRecordingResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface DeleteTranscriptionResponse
 */
export interface DeleteTranscriptionResponse {
  /**
   *
   * @type {string}
   * @memberof DeleteTranscriptionResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface Device
 */
export interface Device {
  /**
   * Date/time of creation
   * @type {string}
   * @memberof Device
   */
  created_at: string;
  /**
   * Whether device is disabled or not
   * @type {boolean}
   * @memberof Device
   */
  disabled?: boolean;
  /**
   * Reason explaining why device had been disabled
   * @type {string}
   * @memberof Device
   */
  disabled_reason?: string;
  /**
   * Device ID
   * @type {string}
   * @memberof Device
   */
  id: string;
  /**
   * Push provider
   * @type {string}
   * @memberof Device
   */
  push_provider: string;
  /**
   * Push provider name
   * @type {string}
   * @memberof Device
   */
  push_provider_name?: string;
  /**
   * User ID
   * @type {string}
   * @memberof Device
   */
  user_id: string;
  /**
   * When true the token is for Apple VoIP push notifications
   * @type {boolean}
   * @memberof Device
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
  stream_key: string;
  /**
   *
   * @type {string}
   * @memberof EgressRTMPResponse
   */
  url: string;
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
 *
 * @export
 * @interface EndCallResponse
 */
export interface EndCallResponse {
  /**
   *
   * @type {string}
   * @memberof EndCallResponse
   */
  duration: string;
}
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
 *
 * @export
 * @interface GetCallStatsResponse
 */
export interface GetCallStatsResponse {
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
   * @type {Stats}
   * @memberof GetCallStatsResponse
   */
  jitter?: Stats;
  /**
   *
   * @type {Stats}
   * @memberof GetCallStatsResponse
   */
  latency?: Stats;
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
 *
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
  start_transcription?: boolean;
  /**
   *
   * @type {string}
   * @memberof GoLiveRequest
   */
  transcription_storage_name?: string;
}
/**
 *
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
 *
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
  cid: string;
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
   * @type {OwnUser}
   * @memberof HealthCheckEvent
   */
  me?: OwnUser;
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
 * @interface LabelThresholds
 */
export interface LabelThresholds {
  /**
   * Threshold for automatic message block
   * @type {number}
   * @memberof LabelThresholds
   */
  block?: number;
  /**
   * Threshold for automatic message flag
   * @type {number}
   * @memberof LabelThresholds
   */
  flag?: number;
}
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
 *
 * @export
 * @interface ListDevicesResponse
 */
export interface ListDevicesResponse {
  /**
   * List of devices
   * @type {Array<Device>}
   * @memberof ListDevicesResponse
   */
  devices: Array<Device>;
  /**
   *
   * @type {string}
   * @memberof ListDevicesResponse
   */
  duration: string;
}
/**
 *
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
   *
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
 * @interface MOSStats
 */
export interface MOSStats {
  /**
   *
   * @type {number}
   * @memberof MOSStats
   */
  average_score: number;
  /**
   *
   * @type {Array<number>}
   * @memberof MOSStats
   */
  histogram_duration_seconds: Array<number>;
  /**
   *
   * @type {number}
   * @memberof MOSStats
   */
  max_score: number;
  /**
   *
   * @type {number}
   * @memberof MOSStats
   */
  min_score: number;
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
 *
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
 *
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
 *
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
 *
 * @export
 * @interface NullBool
 */
export interface NullBool {
  /**
   *
   * @type {boolean}
   * @memberof NullBool
   */
  HasValue?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof NullBool
   */
  Value?: boolean;
}
/**
 *
 * @export
 * @interface NullTime
 */
export interface NullTime {
  /**
   *
   * @type {boolean}
   * @memberof NullTime
   */
  HasValue?: boolean;
  /**
   *
   * @type {string}
   * @memberof NullTime
   */
  Value?: string;
}

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
  START_RECORD_CALL: 'start-record-call',
  START_TRANSCRIPTION_CALL: 'start-transcription-call',
  STOP_BROADCAST_CALL: 'stop-broadcast-call',
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
 * @interface OwnUser
 */
export interface OwnUser {
  /**
   *
   * @type {boolean}
   * @memberof OwnUser
   */
  banned: boolean;
  /**
   *
   * @type {Array<string>}
   * @memberof OwnUser
   */
  blocked_user_ids?: Array<string>;
  /**
   *
   * @type {Array<ChannelMute>}
   * @memberof OwnUser
   */
  channel_mutes: Array<ChannelMute>;
  /**
   *
   * @type {string}
   * @memberof OwnUser
   */
  created_at: string;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof OwnUser
   */
  custom: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof OwnUser
   */
  deactivated_at?: string;
  /**
   *
   * @type {string}
   * @memberof OwnUser
   */
  deleted_at?: string;
  /**
   *
   * @type {Array<Device>}
   * @memberof OwnUser
   */
  devices: Array<Device>;
  /**
   *
   * @type {string}
   * @memberof OwnUser
   */
  id: string;
  /**
   *
   * @type {boolean}
   * @memberof OwnUser
   */
  invisible?: boolean;
  /**
   *
   * @type {string}
   * @memberof OwnUser
   */
  language: string;
  /**
   *
   * @type {string}
   * @memberof OwnUser
   */
  last_active?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof OwnUser
   */
  latest_hidden_channels?: Array<string>;
  /**
   *
   * @type {Array<UserMute>}
   * @memberof OwnUser
   */
  mutes: Array<UserMute>;
  /**
   *
   * @type {boolean}
   * @memberof OwnUser
   */
  online: boolean;
  /**
   *
   * @type {PrivacySettings}
   * @memberof OwnUser
   */
  privacy_settings?: PrivacySettings;
  /**
   *
   * @type {PushNotificationSettings}
   * @memberof OwnUser
   */
  push_notifications?: PushNotificationSettings;
  /**
   *
   * @type {string}
   * @memberof OwnUser
   */
  role: string;
  /**
   *
   * @type {Array<string>}
   * @memberof OwnUser
   */
  teams?: Array<string>;
  /**
   *
   * @type {number}
   * @memberof OwnUser
   */
  total_unread_count: number;
  /**
   *
   * @type {number}
   * @memberof OwnUser
   */
  unread_channels: number;
  /**
   *
   * @type {number}
   * @memberof OwnUser
   */
  unread_count: number;
  /**
   *
   * @type {number}
   * @memberof OwnUser
   */
  unread_threads: number;
  /**
   *
   * @type {string}
   * @memberof OwnUser
   */
  updated_at: string;
}
/**
 *
 * @export
 * @interface OwnUserResponse
 */
export interface OwnUserResponse {
  /**
   *
   * @type {boolean}
   * @memberof OwnUserResponse
   */
  banned: boolean;
  /**
   *
   * @type {Array<string>}
   * @memberof OwnUserResponse
   */
  blocked_user_ids?: Array<string>;
  /**
   *
   * @type {Array<ChannelMute>}
   * @memberof OwnUserResponse
   */
  channel_mutes: Array<ChannelMute>;
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
   * @type {Array<Device>}
   * @memberof OwnUserResponse
   */
  devices: Array<Device>;
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
   * @type {boolean}
   * @memberof OwnUserResponse
   */
  invisible: boolean;
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
   * @type {Array<string>}
   * @memberof OwnUserResponse
   */
  latest_hidden_channels?: Array<string>;
  /**
   *
   * @type {Array<UserMuteResponse>}
   * @memberof OwnUserResponse
   */
  mutes: Array<UserMuteResponse>;
  /**
   *
   * @type {string}
   * @memberof OwnUserResponse
   */
  name?: string;
  /**
   *
   * @type {boolean}
   * @memberof OwnUserResponse
   */
  online: boolean;
  /**
   *
   * @type {PrivacySettingsResponse}
   * @memberof OwnUserResponse
   */
  privacy_settings?: PrivacySettingsResponse;
  /**
   *
   * @type {PushNotificationSettingsResponse}
   * @memberof OwnUserResponse
   */
  push_notifications?: PushNotificationSettingsResponse;
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
   * @type {number}
   * @memberof OwnUserResponse
   */
  total_unread_count: number;
  /**
   *
   * @type {number}
   * @memberof OwnUserResponse
   */
  unread_channels: number;
  /**
   *
   * @type {number}
   * @memberof OwnUserResponse
   */
  unread_threads: number;
  /**
   *
   * @type {string}
   * @memberof OwnUserResponse
   */
  updated_at: string;
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
 *
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
 *
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
 * @interface PrivacySettings
 */
export interface PrivacySettings {
  /**
   *
   * @type {ReadReceipts}
   * @memberof PrivacySettings
   */
  read_receipts?: ReadReceipts;
  /**
   *
   * @type {TypingIndicators}
   * @memberof PrivacySettings
   */
  typing_indicators?: TypingIndicators;
}

/**
 *
 * @export
 * @interface PrivacySettingsResponse
 */
export interface PrivacySettingsResponse {
  /**
   *
   * @type {ReadReceipts}
   * @memberof PrivacySettingsResponse
   */
  read_receipts?: ReadReceipts;
  /**
   *
   * @type {TypingIndicators}
   * @memberof PrivacySettingsResponse
   */
  typing_indicators?: TypingIndicators;
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
 * @interface PushNotificationSettings
 */
export interface PushNotificationSettings {
  /**
   *
   * @type {boolean}
   * @memberof PushNotificationSettings
   */
  disabled?: boolean;
  /**
   *
   * @type {string}
   * @memberof PushNotificationSettings
   */
  disabled_until?: string;
}
/**
 *
 * @export
 * @interface PushNotificationSettingsInput
 */
export interface PushNotificationSettingsInput {
  /**
   *
   * @type {NullBool}
   * @memberof PushNotificationSettingsInput
   */
  disabled?: NullBool;
  /**
   *
   * @type {NullTime}
   * @memberof PushNotificationSettingsInput
   */
  disabled_until?: NullTime;
}
/**
 *
 * @export
 * @interface PushNotificationSettingsResponse
 */
export interface PushNotificationSettingsResponse {
  /**
   *
   * @type {boolean}
   * @memberof PushNotificationSettingsResponse
   */
  disabled?: boolean;
  /**
   *
   * @type {string}
   * @memberof PushNotificationSettingsResponse
   */
  disabled_until?: string;
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
 *
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
 *
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
   *
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
 * @interface ReadReceipts
 */
export interface ReadReceipts {
  /**
   *
   * @type {boolean}
   * @memberof ReadReceipts
   */
  enabled?: boolean;
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
 *
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
   *
   * @type {string}
   * @memberof RejectCallResponse
   */
  duration: string;
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
   *
   * @type {string}
   * @memberof RequestPermissionResponse
   */
  duration: string;
}
/**
 *
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
 *
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
   *
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
 *
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
 * @interface StartHLSBroadcastingResponse
 */
export interface StartHLSBroadcastingResponse {
  /**
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof StartHLSBroadcastingResponse
   */
  duration: string;
  /**
   *
   * @type {string}
   * @memberof StartHLSBroadcastingResponse
   */
  playlist_url: string;
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
 *
 * @export
 * @interface StartRecordingResponse
 */
export interface StartRecordingResponse {
  /**
   *
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
   *
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
   *
   * @type {string}
   * @memberof StartTranscriptionResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface Stats
 */
export interface Stats {
  /**
   *
   * @type {number}
   * @memberof Stats
   */
  average_seconds: number;
  /**
   *
   * @type {number}
   * @memberof Stats
   */
  max_seconds: number;
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
   * Duration of the request in milliseconds
   * @type {string}
   * @memberof StopLiveResponse
   */
  duration: string;
}
/**
 *
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
 * Sets thresholds for AI moderation
 * @export
 * @interface Thresholds
 */
export interface Thresholds {
  /**
   *
   * @type {LabelThresholds}
   * @memberof Thresholds
   */
  explicit?: LabelThresholds;
  /**
   *
   * @type {LabelThresholds}
   * @memberof Thresholds
   */
  spam?: LabelThresholds;
  /**
   *
   * @type {LabelThresholds}
   * @memberof Thresholds
   */
  toxic?: LabelThresholds;
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
 * @interface TranscriptionSettingsRequest
 */
export interface TranscriptionSettingsRequest {
  /**
   *
   * @type {string}
   * @memberof TranscriptionSettingsRequest
   */
  closed_caption_mode?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof TranscriptionSettingsRequest
   */
  languages?: Array<string>;
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
  closed_caption_mode: string;
  /**
   *
   * @type {Array<string>}
   * @memberof TranscriptionSettingsResponse
   */
  languages: Array<string>;
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
export const TranscriptionSettingsResponseModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type TranscriptionSettingsResponseModeEnum =
  (typeof TranscriptionSettingsResponseModeEnum)[keyof typeof TranscriptionSettingsResponseModeEnum];

/**
 *
 * @export
 * @interface TypingIndicators
 */
export interface TypingIndicators {
  /**
   *
   * @type {boolean}
   * @memberof TypingIndicators
   */
  enabled?: boolean;
}
/**
 *
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
 *
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
 *
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
 *
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
 *
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
 *
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
 *
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
 * Represents a call
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
 *
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
 * @interface UserBannedEvent
 */
export interface UserBannedEvent {
  /**
   *
   * @type {string}
   * @memberof UserBannedEvent
   */
  channel_id: string;
  /**
   *
   * @type {string}
   * @memberof UserBannedEvent
   */
  channel_type: string;
  /**
   *
   * @type {string}
   * @memberof UserBannedEvent
   */
  cid: string;
  /**
   *
   * @type {string}
   * @memberof UserBannedEvent
   */
  created_at: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserBannedEvent
   */
  created_by: UserObject;
  /**
   *
   * @type {string}
   * @memberof UserBannedEvent
   */
  expiration?: string;
  /**
   *
   * @type {string}
   * @memberof UserBannedEvent
   */
  reason?: string;
  /**
   *
   * @type {boolean}
   * @memberof UserBannedEvent
   */
  shadow: boolean;
  /**
   *
   * @type {string}
   * @memberof UserBannedEvent
   */
  team?: string;
  /**
   *
   * @type {string}
   * @memberof UserBannedEvent
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserBannedEvent
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface UserDeactivatedEvent
 */
export interface UserDeactivatedEvent {
  /**
   *
   * @type {string}
   * @memberof UserDeactivatedEvent
   */
  created_at: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserDeactivatedEvent
   */
  created_by: UserObject;
  /**
   *
   * @type {string}
   * @memberof UserDeactivatedEvent
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserDeactivatedEvent
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface UserDeletedEvent
 */
export interface UserDeletedEvent {
  /**
   *
   * @type {string}
   * @memberof UserDeletedEvent
   */
  created_at: string;
  /**
   *
   * @type {boolean}
   * @memberof UserDeletedEvent
   */
  delete_conversation_channels: boolean;
  /**
   *
   * @type {boolean}
   * @memberof UserDeletedEvent
   */
  hard_delete: boolean;
  /**
   *
   * @type {boolean}
   * @memberof UserDeletedEvent
   */
  mark_messages_deleted: boolean;
  /**
   *
   * @type {string}
   * @memberof UserDeletedEvent
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserDeletedEvent
   */
  user?: UserObject;
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
 *
 * @export
 * @interface UserMute
 */
export interface UserMute {
  /**
   * Date/time of creation
   * @type {string}
   * @memberof UserMute
   */
  created_at: string;
  /**
   * Date/time of mute expiration
   * @type {string}
   * @memberof UserMute
   */
  expires?: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserMute
   */
  target?: UserObject;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof UserMute
   */
  updated_at: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserMute
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface UserMuteResponse
 */
export interface UserMuteResponse {
  /**
   *
   * @type {string}
   * @memberof UserMuteResponse
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof UserMuteResponse
   */
  expires?: string;
  /**
   *
   * @type {UserResponse}
   * @memberof UserMuteResponse
   */
  target?: UserResponse;
  /**
   *
   * @type {string}
   * @memberof UserMuteResponse
   */
  updated_at: string;
  /**
   *
   * @type {UserResponse}
   * @memberof UserMuteResponse
   */
  user?: UserResponse;
}

/**
 *
 * @export
 * @interface UserMutedEvent
 */
export interface UserMutedEvent {
  /**
   *
   * @type {string}
   * @memberof UserMutedEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof UserMutedEvent
   */
  target_user?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof UserMutedEvent
   */
  target_users?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof UserMutedEvent
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserMutedEvent
   */
  user?: UserObject;
}
/**
 * Represents chat user
 * @export
 * @interface UserObject
 */
export interface UserObject {
  /**
   * Expiration date of the ban
   * @type {string}
   * @memberof UserObject
   */
  ban_expires?: string;
  /**
   * Whether a user is banned or not
   * @type {boolean}
   * @memberof UserObject
   */
  banned: boolean;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof UserObject
   */
  readonly created_at?: string;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof UserObject
   */
  custom: { [key: string]: any };
  /**
   * Date of deactivation
   * @type {string}
   * @memberof UserObject
   */
  readonly deactivated_at?: string;
  /**
   * Date/time of deletion
   * @type {string}
   * @memberof UserObject
   */
  readonly deleted_at?: string;
  /**
   * Unique user identifier
   * @type {string}
   * @memberof UserObject
   */
  id: string;
  /**
   *
   * @type {boolean}
   * @memberof UserObject
   */
  invisible?: boolean;
  /**
   * Preferred language of a user
   * @type {string}
   * @memberof UserObject
   */
  language?: string;
  /**
   * Date of last activity
   * @type {string}
   * @memberof UserObject
   */
  readonly last_active?: string;
  /**
   * Whether a user online or not
   * @type {boolean}
   * @memberof UserObject
   */
  readonly online: boolean;
  /**
   *
   * @type {PrivacySettings}
   * @memberof UserObject
   */
  privacy_settings?: PrivacySettings;
  /**
   *
   * @type {PushNotificationSettings}
   * @memberof UserObject
   */
  push_notifications?: PushNotificationSettings;
  /**
   * Revocation date for tokens
   * @type {string}
   * @memberof UserObject
   */
  revoke_tokens_issued_before?: string;
  /**
   * Determines the set of user permissions
   * @type {string}
   * @memberof UserObject
   */
  role: string;
  /**
   * List of teams user is a part of
   * @type {Array<string>}
   * @memberof UserObject
   */
  teams?: Array<string>;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof UserObject
   */
  readonly updated_at?: string;
}
/**
 *
 * @export
 * @interface UserPresenceChangedEvent
 */
export interface UserPresenceChangedEvent {
  /**
   *
   * @type {string}
   * @memberof UserPresenceChangedEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof UserPresenceChangedEvent
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserPresenceChangedEvent
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface UserReactivatedEvent
 */
export interface UserReactivatedEvent {
  /**
   *
   * @type {string}
   * @memberof UserReactivatedEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof UserReactivatedEvent
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserReactivatedEvent
   */
  user?: UserObject;
}
/**
 *
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
   * @type {PrivacySettings}
   * @memberof UserRequest
   */
  privacy_settings?: PrivacySettings;
  /**
   *
   * @type {PushNotificationSettingsInput}
   * @memberof UserRequest
   */
  push_notifications?: PushNotificationSettingsInput;
}
/**
 *
 * @export
 * @interface UserResponse
 */
export interface UserResponse {
  /**
   * Whether a user is banned or not
   * @type {boolean}
   * @memberof UserResponse
   */
  banned: boolean;
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
   * Whether a user online or not
   * @type {boolean}
   * @memberof UserResponse
   */
  online: boolean;
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
 * @interface UserSessionStats
 */
export interface UserSessionStats {
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
   * @type {Stats}
   * @memberof UserSessionStats
   */
  jitter?: Stats;
  /**
   *
   * @type {Stats}
   * @memberof UserSessionStats
   */
  latency?: Stats;
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
   * @type {MOSStats}
   * @memberof UserSessionStats
   */
  publisher_audio_mos?: MOSStats;
  /**
   *
   * @type {Stats}
   * @memberof UserSessionStats
   */
  publisher_jitter?: Stats;
  /**
   *
   * @type {Stats}
   * @memberof UserSessionStats
   */
  publisher_latency?: Stats;
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
   * @type {MOSStats}
   * @memberof UserSessionStats
   */
  subscriber_audio_mos?: MOSStats;
  /**
   *
   * @type {Stats}
   * @memberof UserSessionStats
   */
  subscriber_jitter?: Stats;
  /**
   *
   * @type {Stats}
   * @memberof UserSessionStats
   */
  subscriber_latency?: Stats;
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
 *
 * @export
 * @interface UserUnbannedEvent
 */
export interface UserUnbannedEvent {
  /**
   *
   * @type {string}
   * @memberof UserUnbannedEvent
   */
  channel_id: string;
  /**
   *
   * @type {string}
   * @memberof UserUnbannedEvent
   */
  channel_type: string;
  /**
   *
   * @type {string}
   * @memberof UserUnbannedEvent
   */
  cid: string;
  /**
   *
   * @type {string}
   * @memberof UserUnbannedEvent
   */
  created_at: string;
  /**
   *
   * @type {boolean}
   * @memberof UserUnbannedEvent
   */
  shadow: boolean;
  /**
   *
   * @type {string}
   * @memberof UserUnbannedEvent
   */
  team?: string;
  /**
   *
   * @type {string}
   * @memberof UserUnbannedEvent
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserUnbannedEvent
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface UserUpdatedEvent
 */
export interface UserUpdatedEvent {
  /**
   *
   * @type {string}
   * @memberof UserUpdatedEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof UserUpdatedEvent
   */
  received_at?: string;
  /**
   *
   * @type {string}
   * @memberof UserUpdatedEvent
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserUpdatedEvent
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface VideoQuality
 */
export interface VideoQuality {
  /**
   *
   * @type {VideoResolution}
   * @memberof VideoQuality
   */
  resolution?: VideoResolution;
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
 * @interface VideoResolution
 */
export interface VideoResolution {
  /**
   *
   * @type {number}
   * @memberof VideoResolution
   */
  height: number;
  /**
   *
   * @type {number}
   * @memberof VideoResolution
   */
  width: number;
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
 *
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
/**
 * @type WSEvent
 * The discriminator object for all websocket events, it maps events' payload to the final type
 * @export
 */
export type WSEvent =
  | ({ type: 'call.accepted' } & CallAcceptedEvent)
  | ({ type: 'call.blocked_user' } & BlockedUserEvent)
  | ({ type: 'call.closed_caption' } & ClosedCaptionEvent)
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
  | ({ type: 'user.banned' } & UserBannedEvent)
  | ({ type: 'user.deactivated' } & UserDeactivatedEvent)
  | ({ type: 'user.deleted' } & UserDeletedEvent)
  | ({ type: 'user.muted' } & UserMutedEvent)
  | ({ type: 'user.presence.changed' } & UserPresenceChangedEvent)
  | ({ type: 'user.reactivated' } & UserReactivatedEvent)
  | ({ type: 'user.unbanned' } & UserUnbannedEvent)
  | ({ type: 'user.updated' } & UserUpdatedEvent);

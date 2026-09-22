declare const timestampNsBrand: unique symbol;

/**
 * A unix-nanosecond timestamp, exactly as the server sends it.
 *
 * NOT milliseconds. `new Date(t)` is out of range and yields an Invalid Date, whose
 * `.toISOString()` then throws; `models/timestamp-guard.d.ts` turns that into a
 * compile error. Comparing or sorting two timestamps is fine -- same unit, plain
 * numbers. Everything else should go through this SDK's time helpers:
 *
 *   nsToDate(t)               a Date
 *   convertTimestampToDate(t) a Date, or undefined when the value is absent or NaN
 *   nsToMs(t)                 epoch ms, for arithmetic against Date.now()
 *   nsToRfc3339(t)            an RFC3339 string keeping sub-millisecond precision
 *   dateToNs(d), msToNs(ms)   back to a wire timestamp
 *   nowNs()                   the local clock, wire-comparable
 *
 * A request date field is typed `Date`, not this -- pass `nsToDate(t)` when handing a
 * server-sent timestamp back to the API, or `nsToRfc3339(t)` where precision matters.
 *
 * Values above `Number.MAX_SAFE_INTEGER` are quantised to ~256ns, so ordering holds
 * but exact equality after a JSON round-trip does not.
 */
export type TimestampNS = number & { readonly [timestampNsBrand]: true };

export type Filters<
  FilterConditions extends Record<string, { type: any; operators: string }>,
> = QueryFilters<{
  [Property in keyof FCHelper<FilterConditions>]:
    | RequireOnlyOne<{
        [
          Operator in FCHelper<FilterConditions>[Property]['operators']
        ]: FilterValue<FCHelper<FilterConditions>[Property], Operator>;
      }>
    | ('$eq' extends FCHelper<FilterConditions>[Property]['operators']
        ? FilterValue<FCHelper<FilterConditions>[Property], '$eq'>
        : never);
}>;

// The value an operator takes on one filter key. `valueTypes` carries the
// per-operator overrides the spec publishes and is checked first, so an override
// also suppresses the `| null` the $eq/$ne rule would otherwise add — the backend
// rejects null wherever an override applies. `closedSet` suppresses it for the
// same reason: a key that publishes accepted_values takes those values and
// nothing else, null included. Everything else follows the two universal rules
// ($in/$nin take an array of the key's type, $exists takes a boolean) and finally
// the key's own type.
export type FilterValue<
  Entry extends { type: any },
  Operator extends string,
> = Entry extends { valueTypes: Record<Operator, infer V> }
  ? V
  : Operator extends '$in' | '$nin'
    ? Array<Entry['type']>
    : Operator extends '$exists'
      ? boolean
      : Operator extends '$eq' | '$ne'
        ? Entry extends { closedSet: true }
          ? Entry['type']
          : Entry['type'] | null
        : Entry['type'];

export type FCHelper<
  FilterConditions extends Record<string, { type: any; operators: string }>,
> = FilterConditions extends {
  custom: { type: any; operators: string };
}
  ? Omit<FilterConditions, 'custom'> & CustomHelper<FilterConditions['custom']>
  : FilterConditions;

export type CustomHelper<T extends { type: any; operators: string }> = {
  // string extends string = true
  // string extends "custom-string" = false
  // using this "hack" to omit Record<string, any> types when custom types are not specified
  [
    P in keyof T['type'] as string extends P
      ? never
      : P extends string
        ? `custom.${P}`
        : never
  ]-?: {
    type: NonNullable<T['type'][P]>;
    operators: T['operators'];
  };
} & {
  [x: `custom.${string}`]: {
    type: string | boolean | number | Date;
    operators: T['operators'];
  };
};

export type QueryFilters<Operators> = {
  [Key in keyof Operators]?: Operators[Key];
} & QueryLogicalOperators<Operators>;

export type QueryLogicalOperators<Operators> = {
  $and?: Array<QueryFilters<Operators>>;
  $nor?: Array<QueryFilters<Operators>>;
  $or?: Array<QueryFilters<Operators>>;
};

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Omit<T, Keys> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];
export interface APIError {
  /**
   * API error code
   */
  code: number;
  /**
   * Request duration
   */
  duration: string;
  /**
   * Message describing an error
   */
  message: string;
  /**
   * URL with additional information
   */
  more_info: string;
  /**
   * Response HTTP status code
   */
  status_code: number;
  /**
   * Additional error-specific information
   */
  details: Array<number>;
  /**
   * Flag that indicates if the error is unrecoverable, requests that return unrecoverable errors should not be retried, this error only applies to the request that caused it
   */
  unrecoverable?: boolean;
  /**
   * Additional error info
   */
  exception_fields?: Record<string, string>;
}

export interface AbsentMetric {
  metric: string;
  reason: string;
}

export interface AcceptCallRequest {}

export interface AcceptCallResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface AppEventResponse {
  /**
   * boolean
   */
  auto_translation_enabled: boolean;
  /**
   * string
   */
  name: string;
  /**
   * boolean
   */
  async_url_enrich_enabled?: boolean;
  file_upload_config?: FileUploadConfig;
  image_upload_config?: FileUploadConfig;
}

export interface AppUpdatedEvent {
  /**
   * Date/time of creation
   */
  created_at: TimestampNS;
  app: AppEventResponse;
  custom: Record<string, any>;
  /**
   * The type of event: "app.updated" in this case
   */
  type: string;
  received_at?: TimestampNS;
}

export interface Audience {
  avg_concurrent_viewers: number;
  hours_watched: number;
  peak_concurrent_viewers: number;
  unique_viewers: number;
  viewer_connections: number;
  concurrency_by_minute: Array<ConcurrencyMinute>;
  peak_at?: string;
  ramp_up_min_to_90pct_peak?: number;
  retention_at_90pct_mark?: number;
  retention_at_midpoint?: number;
  shape?: string;
}

export interface AudioSettingsRequest {
  default_device: 'speaker' | 'earpiece';
  access_request_enabled?: boolean;
  hifi_audio_enabled?: boolean;
  mic_default_on?: boolean;
  opus_dtx_enabled?: boolean;
  redundant_coding_enabled?: boolean;
  speaker_default_on?: boolean;
  noise_cancellation?: NoiseCancellationSettings;
}

export interface AudioSettingsResponse {
  access_request_enabled: boolean;
  default_device: 'speaker' | 'earpiece';
  hifi_audio_enabled: boolean;
  mic_default_on: boolean;
  opus_dtx_enabled: boolean;
  redundant_coding_enabled: boolean;
  speaker_default_on: boolean;
  noise_cancellation?: NoiseCancellationSettings;
}

export interface BackstageSettingsRequest {
  enabled?: boolean;
  join_ahead_time_seconds?: number;
}

export interface BackstageSettingsResponse {
  enabled: boolean;
  join_ahead_time_seconds?: number;
}

export interface BlockUserRequest {
  /**
   * the user to block
   */
  user_id: string;
}

export interface BlockUserResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface BlockedUserEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * User response object
   */
  user: UserResponse;
  /**
   * The type of event: "call.blocked_user" in this case
   */
  type: string;
  /**
   * User response object
   */
  blocked_by_user?: UserResponse;
}

export interface Bound {
  inclusive: boolean;
  value: number;
}

export interface BroadcastDigest {
  schema_version: string;
  audience: Audience;
  broadcast: BroadcastInfo;
  coverage: Coverage;
  joins: Joins;
  poor_tail: PoorTail;
  quality: Quality;
  segments: Segments;
  source: SourceHealth;
  viewers: ViewerBehavior;
}

export interface BroadcastInfo {
  app_id: number;
  call_cid: string;
  call_session_id: string;
  call_type: string;
  duration_min: number;
  ended_at: string;
  started_at: string;
  creators: Array<string>;
  source_mode?: string;
}

export interface BroadcastSegment {
  key: string;
  sessions: number;
  avg_quality_score?: number;
  p5_quality_score?: number;
  poor_pct?: number;
  share_pct?: number;
  watch_share_pct?: number;
}

export interface BroadcastSettingsRequest {
  enabled?: boolean;
  hls?: HLSSettingsRequest;
  rtmp?: RTMPSettingsRequest;
}

export interface BroadcastSettingsResponse {
  enabled: boolean;
  /**
   * HLSSettings is the payload for HLS settings
   */
  hls: HLSSettingsResponse;
  /**
   * RTMPSettingsResponse is the payload for RTMP settings
   */
  rtmp: RTMPSettingsResponse;
}

export interface CallAcceptedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * User response object
   */
  user: UserResponse;
  /**
   * The type of event: "call.accepted" in this case
   */
  type: string;
}

export interface CallClosedCaption {
  end_time: TimestampNS;
  id: string;
  language: string;
  speaker_id: string;
  start_time: TimestampNS;
  text: string;
  translated: boolean;
  /**
   * User response object
   */
  user: UserResponse;
  service?: string;
}

export interface CallClosedCaptionsFailedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * The type of event: "call.closed_captions_failed" in this case
   */
  type: string;
}

export interface CallClosedCaptionsStartedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * The type of event: "call.closed_captions_started" in this case
   */
  type: string;
}

export interface CallClosedCaptionsStoppedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * The type of event: "call.transcription_stopped" in this case
   */
  type: string;
}

export interface CallCreatedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * the members added to this call
   */
  members: Array<MemberResponse>;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * The type of event: "call.created" in this case
   */
  type: string;
}

export interface CallDTMFEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * The DTMF digit (0-9, *, #, A-D)
   */
  digit: string;
  /**
   * Duration of the digit press in milliseconds
   */
  duration_ms: number;
  /**
   * Monotonically increasing sequence number for ordering DTMF events within a session
   */
  seq_number: number;
  /**
   * When the digit press ended and was detected
   */
  timestamp: TimestampNS;
  /**
   * User response object
   */
  user: UserResponse;
  /**
   * The type of event: "call.dtmf" in this case
   */
  type: string;
}

export interface CallDeletedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * The type of event: "call.deleted" in this case
   */
  type: string;
}

export interface CallDurationReport {
  histogram: Array<ReportByHistogramBucket>;
}

export interface CallDurationReportResponse {
  daily: Array<DailyAggregateCallDurationReportResponse>;
}

export interface CallEndedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * The type of event: "call.ended" in this case
   */
  type: string;
  /**
   * The reason why the call ended, if available
   */
  reason?: string;
  /**
   * The list of members in the call
   */
  members?: Array<MemberResponse>;
  /**
   * User response object
   */
  user?: UserResponse;
}

export interface CallFrameRecordingFailedEvent {
  call_cid: string;
  created_at: TimestampNS;
  egress_id: string;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * The type of event: "call.frame_recording_failed" in this case
   */
  type: string;
}

export interface CallFrameRecordingFrameReadyEvent {
  call_cid: string;
  /**
   * The time the frame was captured
   */
  captured_at: TimestampNS;
  created_at: TimestampNS;
  egress_id: string;
  /**
   * Call session ID
   */
  session_id: string;
  /**
   * The type of the track frame was captured from (TRACK_TYPE_VIDEO|TRACK_TYPE_SCREEN_SHARE)
   */
  track_type: string;
  /**
   * The URL of the frame
   */
  url: string;
  /**
   * The users in the frame
   */
  users: Record<string, UserResponse>;
  /**
   * The type of event: "call.frame_recording_ready" in this case
   */
  type: string;
}

export interface CallFrameRecordingStartedEvent {
  call_cid: string;
  created_at: TimestampNS;
  egress_id: string;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * The type of event: "call.frame_recording_started" in this case
   */
  type: string;
}

export interface CallFrameRecordingStoppedEvent {
  call_cid: string;
  created_at: TimestampNS;
  egress_id: string;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * The type of event: "call.frame_recording_stopped" in this case
   */
  type: string;
}

export interface CallHLSBroadcastingFailedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * The type of event: "call.hls_broadcasting_failed" in this case
   */
  type: string;
}

export interface CallHLSBroadcastingStartedEvent {
  call_cid: string;
  created_at: TimestampNS;
  hls_playlist_url: string;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * The type of event: "call.hls_broadcasting_started" in this case
   */
  type: string;
}

export interface CallHLSBroadcastingStoppedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * The type of event: "call.hls_broadcasting_stopped" in this case
   */
  type: string;
}

export interface CallIngressResponse {
  /**
   * RTMP input settings
   */
  rtmp: RTMPIngress;
  srt: SRTIngress;
  whip: WHIPIngress;
}

export interface CallLevelEventPayload {
  event_type: string;
  timestamp: number;
  user_id: string;
  payload?: Record<string, any>;
}

export interface CallLiveStartedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * The type of event: "call.live_started" in this case
   */
  type: string;
}

export interface CallMemberAddedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * the members added to this call
   */
  members: Array<MemberResponse>;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * The type of event: "call.member_added" in this case
   */
  type: string;
}

export interface CallMemberRemovedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * the list of member IDs removed from the call
   */
  members: Array<string>;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * The type of event: "call.member_removed" in this case
   */
  type: string;
}

export interface CallMemberUpdatedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * The list of members that were updated
   */
  members: Array<MemberResponse>;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * The type of event: "call.member_updated" in this case
   */
  type: string;
}

export interface CallMemberUpdatedPermissionEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * The list of members that were updated
   */
  members: Array<MemberResponse>;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * The capabilities by role for this call
   */
  capabilities_by_role: Record<string, Array<string>>;
  /**
   * The type of event: "call.member_added" in this case
   */
  type: string;
}

export interface CallMissedEvent {
  call_cid: string;
  created_at: TimestampNS;
  notify_user: boolean;
  /**
   * Call session ID
   */
  session_id: string;
  /**
   * List of members who missed the call
   */
  members: Array<MemberResponse>;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * User response object
   */
  user: UserResponse;
  /**
   * The type of event: "call.notification" in this case
   */
  type: string;
}

export interface CallModerationBlurEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * The user ID whose video stream is being blurred
   */
  user_id: string;
  /**
   * Custom data associated with the moderation action
   */
  custom: Record<string, any>;
  /**
   * The type of event: "call.moderation_blur" in this case
   */
  type: string;
}

export interface CallModerationWarningEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * The warning message
   */
  message: string;
  /**
   * The user ID who is receiving the warning
   */
  user_id: string;
  /**
   * Custom data associated with the moderation action
   */
  custom: Record<string, any>;
  /**
   * The type of event: "call.moderation_warning" in this case
   */
  type: string;
}

export interface CallNotificationEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Call session ID
   */
  session_id: string;
  /**
   * Call members
   */
  members: Array<MemberResponse>;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * User response object
   */
  user: UserResponse;
  /**
   * The type of event: "call.notification" in this case
   */
  type: string;
}

export interface CallParticipantCountReport {
  histogram: Array<ReportByHistogramBucket>;
}

export interface CallParticipantCountReportResponse {
  daily: Array<DailyAggregateCallParticipantCountReportResponse>;
}

export interface CallParticipantResponse {
  joined_at: TimestampNS;
  role: string;
  user_session_id: string;
  /**
   * User response object
   */
  user: UserResponse;
}

export interface CallParticipantTimeline {
  severity: string;
  timestamp: TimestampNS;
  type: string;
  data: Record<string, any>;
}

export interface CallReactionEvent {
  call_cid: string;
  created_at: TimestampNS;
  reaction: VideoReactionResponse;
  /**
   * The type of event: "call.reaction_new" in this case
   */
  type: string;
}

export interface CallRecording {
  end_time: TimestampNS;
  filename: string;
  recording_type: string;
  session_id: string;
  start_time: TimestampNS;
  url: string;
}

export interface CallRecordingFailedEvent {
  call_cid: string;
  created_at: TimestampNS;
  egress_id: string;
  /**
   * The type of recording
   */
  recording_type: 'composite' | 'individual' | 'raw';
  /**
   * The type of event: "call.recording_failed" in this case
   */
  type: string;
}

export interface CallRecordingReadyEvent {
  call_cid: string;
  created_at: TimestampNS;
  egress_id: string;
  /**
   * The type of recording
   */
  recording_type: 'composite' | 'individual' | 'raw';
  /**
   * CallRecording represents a recording of a call.
   */
  call_recording: CallRecording;
  /**
   * The type of event: "call.recording_ready" in this case
   */
  type: string;
}

export interface CallRecordingStartedEvent {
  call_cid: string;
  created_at: TimestampNS;
  egress_id: string;
  /**
   * The type of recording
   */
  recording_type: 'composite' | 'individual' | 'raw';
  /**
   * The type of event: "call.recording_started" in this case
   */
  type: string;
}

export interface CallRecordingStoppedEvent {
  call_cid: string;
  created_at: TimestampNS;
  egress_id: string;
  /**
   * The type of recording
   */
  recording_type: 'composite' | 'individual' | 'raw';
  /**
   * The type of event: "call.recording_stopped" in this case
   */
  type: string;
}

export interface CallRejectedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * User response object
   */
  user: UserResponse;
  /**
   * The type of event: "call.rejected" in this case
   */
  type: string;
  /**
   * Provides information about why the call was rejected. You can provide any value, but the Stream API and SDKs use these default values: rejected, cancel, timeout and busy
   */
  reason?: string;
}

export interface CallReportResponse {
  score: number;
  ended_at?: TimestampNS;
  started_at?: TimestampNS;
}

export interface CallRequest {
  channel_cid?: string;
  starts_at?: Date;
  team?: string;
  video?: boolean;
  members?: Array<MemberRequest>;
  custom?: Record<string, any>;
  settings_override?: CallSettingsRequest;
}

export interface CallResponse {
  backstage: boolean;
  captioning: boolean;
  /**
   * The unique identifier for a call (<type>:<id>)
   */
  cid: string;
  /**
   * Date/time of creation
   */
  created_at: TimestampNS;
  current_session_id: string;
  /**
   * Call ID
   */
  id: string;
  recording: boolean;
  transcribing: boolean;
  translating: boolean;
  /**
   * The type of call
   */
  type: string;
  /**
   * Date/time of the last update
   */
  updated_at: TimestampNS;
  blocked_user_ids: Array<string>;
  /**
   * User response object
   */
  created_by: UserResponse;
  /**
   * Custom data for this object
   */
  custom: Record<string, any>;
  egress: EgressResponse;
  /**
   * CallIngressResponse is the payload for ingress settings
   */
  ingress: CallIngressResponse;
  settings: CallSettingsResponse;
  channel_cid?: string;
  /**
   * Date/time when the call ended
   */
  ended_at?: TimestampNS;
  join_ahead_time_seconds?: number;
  /**
   * 10-digit routing number for SIP routing
   */
  routing_number?: string;
  /**
   * Date/time when the call will start
   */
  starts_at?: TimestampNS;
  team?: string;
  session?: CallSessionResponse;
  thumbnails?: ThumbnailResponse;
}

export interface CallRingEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Call session ID
   */
  session_id: string;
  video: boolean;
  /**
   * Call members
   */
  members: Array<MemberResponse>;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * User response object
   */
  user: UserResponse;
  /**
   * The type of event: "call.notification" in this case
   */
  type: string;
  /**
   * Identifies this ring of the call session
   */
  ring_id?: string;
}

export interface CallRtmpBroadcastFailedEvent {
  /**
   * The unique identifier for a call (<type>:<id>)
   */
  call_cid: string;
  /**
   * Date/time of creation
   */
  created_at: TimestampNS;
  /**
   * Name of the given RTMP broadcast
   */
  name: string;
  /**
   * The type of event: "call.rtmp_broadcast_failed" in this case
   */
  type: string;
}

export interface CallRtmpBroadcastStartedEvent {
  /**
   * The unique identifier for a call (<type>:<id>)
   */
  call_cid: string;
  /**
   * Date/time of creation
   */
  created_at: TimestampNS;
  /**
   * Name of the given RTMP broadcast
   */
  name: string;
  /**
   * The type of event: "call.rtmp_broadcast_started" in this case
   */
  type: string;
}

export interface CallRtmpBroadcastStoppedEvent {
  /**
   * The unique identifier for a call (<type>:<id>)
   */
  call_cid: string;
  /**
   * Date/time of creation
   */
  created_at: TimestampNS;
  /**
   * Name of the given RTMP broadcast
   */
  name: string;
  /**
   * The type of event: "call.rtmp_broadcast_stopped" in this case
   */
  type: string;
}

export interface CallSessionEndedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Call session ID
   */
  session_id: string;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * The type of event: "call.session_ended" in this case
   */
  type: string;
}

export interface CallSessionParticipantCountsUpdatedEvent {
  anonymous_participant_count: number;
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Call session ID
   */
  session_id: string;
  participants_count_by_role: Record<string, number>;
  /**
   * The type of event: "call.session_participant_count_updated" in this case
   */
  type: string;
}

export interface CallSessionParticipantJoinedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Call session ID
   */
  session_id: string;
  participant: CallParticipantResponse;
  /**
   * The type of event: "call.session_participant_joined" in this case
   */
  type: string;
}

export interface CallSessionParticipantLeftEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * The duration participant was in the session in seconds
   */
  duration_seconds: number;
  /**
   * Call session ID
   */
  session_id: string;
  participant: CallParticipantResponse;
  /**
   * The type of event: "call.session_participant_left" in this case
   */
  type: string;
  /**
   * The reason why the participant left the session
   */
  reason?: string;
}

export interface CallSessionResponse {
  anonymous_participant_count: number;
  id: string;
  participants: Array<CallParticipantResponse>;
  accepted_by: Record<string, TimestampNS>;
  missed_by: Record<string, TimestampNS>;
  participants_count_by_role: Record<string, number>;
  rejected_by: Record<string, TimestampNS>;
  ended_at?: TimestampNS;
  live_ended_at?: TimestampNS;
  live_started_at?: TimestampNS;
  started_at?: TimestampNS;
  timer_ends_at?: TimestampNS;
}

export interface CallSessionStartedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Call session ID
   */
  session_id: string;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * The type of event: "call.session_started" in this case
   */
  type: string;
}

export interface CallSettingsRequest {
  audio?: AudioSettingsRequest;
  backstage?: BackstageSettingsRequest;
  broadcasting?: BroadcastSettingsRequest;
  encryption?: EncryptionSettingsRequest;
  frame_recording?: FrameRecordingSettingsRequest;
  geofencing?: GeofenceSettingsRequest;
  individual_recording?: IndividualRecordingSettingsRequest;
  ingress?: IngressSettingsRequest;
  limits?: LimitsSettingsRequest;
  raw_recording?: RawRecordingSettingsRequest;
  recording?: RecordSettingsRequest;
  ring?: RingSettingsRequest;
  screensharing?: ScreensharingSettingsRequest;
  session?: SessionSettingsRequest;
  thumbnails?: ThumbnailsSettingsRequest;
  transcription?: TranscriptionSettingsRequest;
  video?: VideoSettingsRequest;
}

export interface CallSettingsResponse {
  audio: AudioSettingsResponse;
  backstage: BackstageSettingsResponse;
  /**
   * BroadcastSettingsResponse is the payload for broadcasting settings
   */
  broadcasting: BroadcastSettingsResponse;
  /**
   * EncryptionSettings is the payload for end-to-end encryption settings
   */
  encryption: EncryptionSettingsResponse;
  frame_recording: FrameRecordingSettingsResponse;
  geofencing: GeofenceSettingsResponse;
  individual_recording: IndividualRecordingSettingsResponse;
  limits: LimitsSettingsResponse;
  raw_recording: RawRecordingSettingsResponse;
  /**
   * RecordSettings is the payload for recording settings
   */
  recording: RecordSettingsResponse;
  ring: RingSettingsResponse;
  screensharing: ScreensharingSettingsResponse;
  session: SessionSettingsResponse;
  thumbnails: ThumbnailsSettingsResponse;
  transcription: TranscriptionSettingsResponse;
  video: VideoSettingsResponse;
  ingress?: IngressSettingsResponse;
}

export interface CallStateResponseFields {
  /**
   * List of call members
   */
  members: Array<MemberResponse>;
  own_capabilities: Array<OwnCapability>;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * MemberResponse is the payload for a member of a call.
   */
  membership?: MemberResponse;
}

export interface CallStatsLocation {
  accuracy_radius_meters?: number;
  city?: string;
  continent?: string;
  country?: string;
  country_iso_code?: string;
  latitude?: number;
  longitude?: number;
  subdivision?: string;
}

export interface CallStatsMapLocation {
  count: number;
  live_count: number;
  location?: CallStatsLocation;
}

export interface CallStatsMapPublisher {
  is_live: boolean;
  user_id: string;
  user_session_id: string;
  published_tracks: PublishedTrackFlags;
  name?: string;
  publisher_type?: string;
  location?: CallStatsLocation;
}

export interface CallStatsMapPublishers {
  publishers: Array<CallStatsMapPublisher>;
}

export interface CallStatsMapSFUs {
  locations: Array<SFULocationResponse>;
}

export interface CallStatsMapSubscriber {
  is_live: boolean;
  user_id: string;
  user_session_id: string;
  name?: string;
  location?: CallStatsLocation;
}

export interface CallStatsMapSubscribers {
  locations: Array<CallStatsMapLocation>;
  participants?: Array<CallStatsMapSubscriber>;
}

export interface CallStatsParticipant {
  user_id: string;
  sessions: Array<CallStatsParticipantSession>;
  latest_activity_at?: TimestampNS;
  name?: string;
  roles?: Array<string>;
}

export interface CallStatsParticipantCounts {
  live_sessions: number;
  participants: number;
  peak_concurrent_sessions: number;
  peak_concurrent_users: number;
  publishers: number;
  sessions: number;
  sfus_used: number;
  average_jitter_ms?: number;
  average_latency_ms?: number;
  avg_user_rating?: number;
  call_event_count?: number;
  cq_score?: number;
  max_freezes_duration_ms?: number;
  min_user_rating?: number;
  total_participant_duration?: number;
}

export interface CallStatsParticipantSession {
  is_live: boolean;
  user_session_id: string;
  published_tracks: PublishedTrackFlags;
  browser?: string;
  browser_version?: string;
  cq_score?: number;
  current_ip?: string;
  current_sfu?: string;
  distance_to_sfu_kilometers?: number;
  ended_at?: TimestampNS;
  freezes_duration_ms?: number;
  ingress?: string;
  jitter_ms?: number;
  latency_ms?: number;
  os?: string;
  publisher_type?: string;
  sdk?: string;
  sdk_version?: string;
  started_at?: TimestampNS;
  unified_session_id?: string;
  webrtc_version?: string;
  location?: CallStatsLocation;
}

export interface CallStatsReportReadyEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Call session ID
   */
  session_id: string;
  counts: CallStatsParticipantCounts;
  /**
   * The type of event, "call.report_ready" in this case
   */
  type: string;
  /**
   * Whether participants_overview is truncated by the server-side limit
   */
  is_trimmed?: boolean;
  /**
   * Top participant sessions overview
   */
  participants_overview?: Array<CallStatsParticipant>;
}

export interface CallStatsReportSummaryResponse {
  call_cid: string;
  call_duration_seconds: number;
  call_session_id: string;
  call_status: string;
  first_stats_time: TimestampNS;
  created_at?: TimestampNS;
  min_user_rating?: number;
  quality_score?: number;
}

export interface CallStatsSessionResponse {
  call_id: string;
  call_session_id: string;
  call_type: string;
  generated_at: TimestampNS;
  counts: CallStatsParticipantCounts;
  call_ended_at?: TimestampNS;
  call_started_at?: TimestampNS;
}

export interface CallTranscription {
  end_time: TimestampNS;
  filename: string;
  session_id: string;
  start_time: TimestampNS;
  url: string;
}

export interface CallTranscriptionFailedEvent {
  call_cid: string;
  created_at: TimestampNS;
  egress_id: string;
  /**
   * The type of event: "call.transcription_failed" in this case
   */
  type: string;
  /**
   * The error message detailing why transcription failed.
   */
  error?: string;
}

export interface CallTranscriptionReadyEvent {
  call_cid: string;
  created_at: TimestampNS;
  egress_id: string;
  /**
   * CallTranscription represents a transcription of a call.
   */
  call_transcription: CallTranscription;
  /**
   * The type of event: "call.transcription_ready" in this case
   */
  type: string;
}

export interface CallTranscriptionStartedEvent {
  call_cid: string;
  created_at: TimestampNS;
  egress_id: string;
  /**
   * The type of event: "call.transcription_started" in this case
   */
  type: string;
}

export interface CallTranscriptionStoppedEvent {
  call_cid: string;
  created_at: TimestampNS;
  egress_id: string;
  /**
   * The type of event: "call.transcription_stopped" in this case
   */
  type: string;
}

export interface CallUpdatedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * The capabilities by role for this call
   */
  capabilities_by_role: Record<string, Array<string>>;
  /**
   * The type of event: "call.updated" in this case
   */
  type: string;
}

export interface CallUserFeedbackSubmittedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * The rating given by the user (1-5)
   */
  rating: number;
  /**
   * Call session ID
   */
  session_id: string;
  /**
   * User response object
   */
  user: UserResponse;
  /**
   * The type of event, "call.user_feedback" in this case
   */
  type: string;
  /**
   * The reason provided by the user for the rating
   */
  reason?: string;
  sdk?: string;
  sdk_version?: string;
  /**
   * Custom data provided by the user
   */
  custom?: Record<string, any>;
}

export interface CallUserMutedEvent {
  call_cid: string;
  created_at: TimestampNS;
  from_user_id: string;
  reason: string;
  muted_user_ids: Array<string>;
  /**
   * The type of event: "call.user_muted" in this case
   */
  type: string;
}

export interface CallsPerDayReport {
  count: number;
}

export interface CallsPerDayReportResponse {
  daily: Array<DailyAggregateCallsPerDayReportResponse>;
}

export interface ChatActivityStatsResponse {
  messages?: MessageStatsResponse;
}

export interface ChatPreferencesResponse {
  channel_mentions?: string;
  default_preference?: string;
  direct_mentions?: string;
  group_mentions?: string;
  here_mentions?: string;
  role_mentions?: string;
  thread_replies?: string;
}

export interface ClientEvent {
  /**
   * Call session ID associated with the attempt. Required on every event except CoordinatorJoin initiation and CoordinatorJoin failure (where the call session is not yet established); optional on MediaDevicePermission.
   */
  call_session_id?: string;
  /**
   * Camera permission status: INITIATED, FAILED, GRANTED, or NOT_INITIATED. Required on every MediaDevicePermission event.
   */
  camera_permission_status?: string;
  /**
   * UUID generated by the client and shared across every event of the same coordinator connection. Required on every event except JoinInitiated, which is reported before a coordinator connection exists.
   */
  coordinator_connect_id?: string;
  /**
   * Milliseconds elapsed between the stage attempt's initiation and this event.
   */
  elapsed_time?: number;
  /**
   * Whether the event marks the start (initiated) or resolution (completed) of a stage attempt, or another event-specific value
   */
  event_type?: string;
  /**
   * Terminal state of the peer connection. Required on PeerConnectionConnect failure.
   */
  ice_state?: string;
  /**
   * Call ID associated with the event. Required on every stage except CoordinatorWS, where it is optional.
   */
  id?: string;
  /**
   * UUID generated by the client and shared across JoinInitiated and the join-lifecycle events (CoordinatorJoin, WSJoin, PeerConnectionConnect) of the same overall join attempt. Required on every join event except CoordinatorWS, which is reported before a join attempt is established.
   */
  join_attempt_id?: string;
  /**
   * Reason the client initiated the join. Optional on CoordinatorJoin events; empty when not provided.
   */
  join_reason?: string;
  /**
   * Microphone permission status: INITIATED, FAILED, GRANTED, or NOT_INITIATED. Required on every MediaDevicePermission event.
   */
  microphone_permission_status?: string;
  /**
   * Resolution of a completed event: success or failure. Required on completed join events; forbidden on initiated join events.
   */
  outcome?: string;
  /**
   * Which peer connection a PeerConnectionConnect event reports on: publish or subscribe. Required on every PeerConnectionConnect event.
   */
  peer_connection?: string;
  /**
   * UTC timestamp at which the ICE connection was established earlier in the session, when applicable
   */
  previously_connected_timestamp?: Date;
  /**
   * Total in-stage retries the client made before resolving (0–1000). Required on completed join events.
   */
  retry_count_attempt?: number;
  /**
   * Failure code string. Required on CoordinatorJoin, CoordinatorWS, WSJoin, and PeerConnectionConnect failure.
   */
  retry_failure_code?: string;
  /**
   * Failure reason string. Required on CoordinatorJoin, CoordinatorWS, WSJoin, and PeerConnectionConnect failure.
   */
  retry_failure_reason?: string;
  /**
   * Screen-share permission status: INITIATED, FAILED, GRANTED, or NOT_INITIATED. Optional on MediaDevicePermission events.
   */
  screen_share_status?: string;
  /**
   * Version of the client SDK
   */
  sdk_version?: string;
  /**
   * Identifier of the SFU the client was attempting to connect to. Required on WSJoin and PeerConnectionConnect failure, and on FirstAudioFrame and FirstVideoFrame.
   */
  sfu_id?: string;
  /**
   * Source of the coordinator join. Optional on CoordinatorJoin events; omitted when not provided.
   */
  source?: string;
  /**
   * Discriminator identifying the event kind. JoinInitiated marks the start of a join attempt; join-lifecycle events use CoordinatorJoin, CoordinatorWS, WSJoin, or PeerConnectionConnect; media-readiness events use FirstAudioFrame or FirstVideoFrame; MediaDevicePermission reports device permission results; other values denote generic client events.
   */
  stage?: string;
  /**
   * UUID generated by the client at initiation. Identical on the matching completion event. Absent on JoinInitiated.
   */
  stage_id?: string;
  /**
   * UTC timestamp at which the event was recorded
   */
  timestamp?: Date;
  /**
   * Identifier of the media track the frame belongs to. Required on FirstVideoFrame; optional on FirstAudioFrame.
   */
  track_id?: string;
  /**
   * Call type associated with the event. Required on every stage except CoordinatorWS, where it is optional.
   */
  type?: string;
  /**
   * User agent string of the client SDK
   */
  user_agent?: string;
  /**
   * ID of the user the event was recorded for
   */
  user_id?: string;
  /**
   * Whether the ICE connection had been established earlier in the same session. Required on every PeerConnectionConnect event so reconnects can be distinguished from fresh connects.
   */
  was_previously_connected?: boolean;
}

export interface ClosedCaptionEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * CallClosedCaption represents a closed caption of a call.
   */
  closed_caption: CallClosedCaption;
  /**
   * The type of event: "call.closed_caption" in this case
   */
  type: string;
}

export interface CollectUserFeedbackRequest {
  rating: number;
  sdk: string;
  sdk_version: string;
  reason?: string;
  user_session_id?: string;
  custom?: Record<string, any>;
}

export interface CollectUserFeedbackResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface CompositeRecordingResponse {
  status: string;
}

export interface ConcurrencyMinute {
  joins: number;
  leaves: number;
  max: number;
  min: number;
  minute: string;
}

export interface ConnectedEvent {
  /**
   * The connection_id for this client
   */
  connection_id: string;
  created_at: TimestampNS;
  me: OwnUserResponse;
  /**
   * The type of event: "connection.ok" in this case
   */
  type: string;
}

export interface ConnectionErrorEvent {
  connection_id: string;
  created_at: TimestampNS;
  error: APIError;
  /**
   * The type of event: "connection.ok" in this case
   */
  type: string;
}

export interface CoordinatesResponse {
  /**
   * Latitude coordinate
   */
  latitude: number;
  /**
   * Longitude coordinate
   */
  longitude: number;
}

export interface CountByMinuteResponse {
  count: number;
  start_ts: TimestampNS;
}

export interface Coverage {
  publisher_encoding_profiles: number;
  absent: Array<AbsentMetric>;
  metrics_pct: MetricsPct;
}

export interface Credentials {
  token: string;
  ice_servers: Array<ICEServerResponse>;
  server: SFUResponse;
}

export interface CustomVideoEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Custom data for this object
   */
  custom: Record<string, any>;
  /**
   * User response object
   */
  user: UserResponse;
  /**
   * The type of event, "custom" in this case
   */
  type: string;
}

export interface DailyAggregateCallDurationReportResponse {
  date: string;
  report: CallDurationReport;
}

export interface DailyAggregateCallParticipantCountReportResponse {
  date: string;
  report: CallParticipantCountReport;
}

export interface DailyAggregateCallsPerDayReportResponse {
  date: string;
  report: CallsPerDayReport;
}

export interface DailyAggregateQualityScoreReportResponse {
  date: string;
  report: QualityScoreReport;
}

export interface DailyAggregateSDKUsageReportResponse {
  date: string;
  report: SDKUsageReport;
}

export interface DailyAggregateUserFeedbackReportResponse {
  date: string;
  report: UserFeedbackReport;
}

export interface DeleteCallRequest {
  /**
   * if true the call will be hard deleted along with all related data
   */
  hard?: boolean;
}

export interface DeleteCallResponse {
  duration: string;
  /**
   * Represents a call
   */
  call: CallResponse;
  task_id?: string;
}

export interface DeleteRecordingResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface DeleteTranscriptionResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface DeliveryZoneSegment {
  key: string;
  outlier: boolean;
  sessions: number;
  avg_quality_score?: number;
  p5_quality_score?: number;
  poor_pct?: number;
  share_pct?: number;
  watch_share_pct?: number;
}

export interface DeviceResponse {
  /**
   * Date/time of creation
   */
  created_at: TimestampNS;
  /**
   * Device ID
   */
  id: string;
  /**
   * Push provider
   */
  push_provider: string;
  /**
   * User ID
   */
  user_id: string;
  /**
   * Whether device is disabled or not
   */
  disabled?: boolean;
  /**
   * Reason explaining why device had been disabled
   */
  disabled_reason?: string;
  /**
   * Stable physical device identifier used to deduplicate pushes across push providers
   */
  hardware_id?: string;
  /**
   * Push provider name
   */
  push_provider_name?: string;
  /**
   * When true the token is for Apple VoIP push notifications
   */
  voip?: boolean;
}

export interface EdgeResponse {
  continent_code: string;
  country_iso_code: string;
  green: number;
  id: string;
  latency_test_url: string;
  latitude: number;
  longitude: number;
  red: number;
  subdivision_iso_code: string;
  yellow: number;
}

export interface EgressHLSResponse {
  playlist_url: string;
  status: string;
}

export interface EgressRTMPResponse {
  name: string;
  started_at: TimestampNS;
  stream_key?: string;
  stream_url?: string;
}

export interface EgressResponse {
  broadcasting: boolean;
  rtmps: Array<EgressRTMPResponse>;
  composite_recording?: CompositeRecordingResponse;
  frame_recording?: FrameRecordingResponse;
  hls?: EgressHLSResponse;
  individual_recording?: IndividualRecordingResponse;
  raw_recording?: RawRecordingResponse;
}

export interface EncodingProfile {
  getstats_snapshots: number;
  source_file: string;
  svc_modes: Array<string>;
  quality_limitation_durations_s: Record<string, number>;
  quality_limitation_samples: Record<string, number>;
  avg_send_kbps?: number;
  codec?: string;
  encoder_impl?: string;
  fps_p10?: number;
  fps_p50?: number;
  hardware_encode?: boolean;
  ladder_type?: string;
  power_efficient?: boolean;
  resolution?: string;
  simulcast_layers?: number;
}

export interface EncryptionSettingsRequest {
  /**
   * Encryption mode. One of: available, disabled, auto-on
   */
  mode?: 'available' | 'disabled' | 'auto-on';
}

export interface EncryptionSettingsResponse {
  /**
   * the resolved encryption mode for the call
   */
  mode: 'available' | 'disabled' | 'auto-on';
}

export interface EndCallRequest {}

export interface EndCallResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface FeedsPreferencesResponse {
  comment?: string;
  comment_mention?: string;
  comment_reaction?: string;
  comment_reply?: string;
  follow?: string;
  mention?: string;
  reaction?: string;
  custom_activity_types?: Record<string, string>;
}

export interface FileUploadConfig {
  size_limit: number;
  allowed_file_extensions: Array<string>;
  allowed_mime_types: Array<string>;
  blocked_file_extensions: Array<string>;
  blocked_mime_types: Array<string>;
}

export interface FrameRecordingResponse {
  status: string;
}

export interface FrameRecordingSettingsRequest {
  capture_interval_in_seconds: number;
  mode: 'available' | 'disabled' | 'auto-on';
  quality?: '360p' | '480p' | '720p' | '1080p' | '1440p';
}

export interface FrameRecordingSettingsResponse {
  capture_interval_in_seconds: number;
  mode: 'available' | 'disabled' | 'auto-on';
  quality?: string;
}

export interface GeofenceSettingsRequest {
  names?: Array<string>;
}

export interface GeofenceSettingsResponse {
  names: Array<string>;
}

export interface GetCallParticipantSessionMetricsResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
  is_publisher?: boolean;
  is_subscriber?: boolean;
  joined_at?: TimestampNS;
  publisher_type?: string;
  user_id?: string;
  user_session_id?: string;
  published_tracks?: Array<PublishedTrackMetrics>;
  client?: SessionClient;
}

export interface GetCallReportResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
  session_id: string;
  report: ReportResponse;
  video_reactions?: Array<VideoReactionsResponse>;
  chat_activity?: ChatActivityStatsResponse;
  digest?: BroadcastDigest;
  session?: CallSessionResponse;
}

export interface GetCallResponse {
  duration: string;
  members: Array<MemberResponse>;
  own_capabilities: Array<OwnCapability>;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * MemberResponse is the payload for a member of a call.
   */
  membership?: MemberResponse;
}

export interface GetCallRingStateResponse {
  /**
   * The CID of the call
   */
  call_cid: string;
  /**
   * The user that created the call, i.e. the caller
   */
  created_by_user_id: string;
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
  /**
   * The call session this state belongs to, empty when the call has never rung
   */
  session_id: string;
  /**
   * Users that accepted the call, mapped to when they accepted
   */
  accepted_by: Record<string, TimestampNS>;
  /**
   * Users that missed the call, mapped to when they were marked as missed
   */
  missed_by: Record<string, TimestampNS>;
  /**
   * Users that rejected the call, mapped to when they rejected
   */
  rejected_by: Record<string, TimestampNS>;
  /**
   * When the call ended
   */
  call_ended_at?: TimestampNS;
  /**
   * When the call session ended
   */
  session_ended_at?: TimestampNS;
  /**
   * When the call session started
   */
  session_started_at?: TimestampNS;
}

export interface GetCallSessionParticipantStatsDetailsResponse {
  call_id: string;
  call_session_id: string;
  call_type: string;
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
  user_id: string;
  user_session_id: string;
  publisher?: ParticipantSeriesPublisherStats;
  subscriber?: ParticipantSeriesSubscriberStats;
  timeframe?: ParticipantSeriesTimeframe;
  user?: ParticipantSeriesUserStats;
}

export interface GetEdgesResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
  edges: Array<EdgeResponse>;
}

export interface GetOrCreateCallRequest {
  members_limit?: number;
  /**
   * if provided it sends a notification event to the members for this call
   */
  notify?: boolean;
  /**
   * if provided it sends a ring event to the members for this call
   */
  ring?: boolean;
  video?: boolean;
  /**
   * CallRequest is the payload for creating a call.
   */
  data?: CallRequest;
}

export interface GetOrCreateCallResponse {
  created: boolean;
  duration: string;
  members: Array<MemberResponse>;
  own_capabilities: Array<OwnCapability>;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * MemberResponse is the payload for a member of a call.
   */
  membership?: MemberResponse;
}

export interface GoLiveRequest {
  recording_storage_name?: string;
  start_closed_caption?: boolean;
  start_composite_recording?: boolean;
  start_hls?: boolean;
  start_individual_recording?: boolean;
  start_raw_recording?: boolean;
  start_recording?: boolean;
  start_transcription?: boolean;
  transcription_storage_name?: string;
}

export interface GoLiveResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
  /**
   * Represents a call
   */
  call: CallResponse;
}

export interface GroupedStatsResponse {
  name: string;
  unique: number;
}

export interface HLSSettingsRequest {
  /**
   * Quality tracks for HLS. One of: 360p, 480p, 720p, 1080p, 1440p, portrait-360x640, portrait-480x854, portrait-720x1280, portrait-1080x1920, portrait-1440x2560
   */
  quality_tracks: Array<string>;
  /**
   * Whether HLS broadcasting should start automatically
   */
  auto_on?: boolean;
  /**
   * Whether HLS broadcasting is enabled
   */
  enabled?: boolean;
}

export interface HLSSettingsResponse {
  auto_on: boolean;
  enabled: boolean;
  quality_tracks: Array<string>;
}

export interface HealthCheckEvent {
  connection_id: string;
  created_at: TimestampNS;
  custom: Record<string, any>;
  type: string;
  cid?: string;
  received_at?: TimestampNS;
}

export interface ICEServerResponse {
  /**
   * ICE server password
   */
  password: string;
  /**
   * ICE server username
   */
  username: string;
  /**
   * ICE server URLs
   */
  urls: Array<string>;
}

export interface Incident {
  from: string;
  peak_concurrency: number;
  to: string;
  viewers_interrupted: number;
}

export interface IndividualRecordingResponse {
  status: string;
}

export interface IndividualRecordingSettingsRequest {
  /**
   * Recording mode. One of: available, disabled, auto-on
   */
  mode: 'available' | 'disabled' | 'auto-on';
  /**
   * Output types to include: audio_only, video_only, audio_video, screenshare_audio_only, screenshare_video_only, screenshare_audio_video
   */
  output_types?: Array<string>;
}

export interface IndividualRecordingSettingsResponse {
  mode: 'available' | 'disabled' | 'auto-on';
  output_types?: Array<string>;
}

export interface IngressAudioEncodingOptionsRequest {
  bitrate: number;
  channels: '1' | '2';
  enable_dtx?: boolean;
}

export interface IngressAudioEncodingResponse {
  bitrate: number;
  channels: number;
  enable_dtx: boolean;
}

export interface IngressErrorEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Human-readable error message
   */
  error: string;
  /**
   * Unique identifier for the stream
   */
  ingress_stream_id: string;
  /**
   * User who was streaming
   */
  user_id: string;
  /**
   * The type of event: "ingress.error" in this case
   */
  type: string;
  /**
   * Error code
   */
  code?: string;
}

export interface IngressSettingsRequest {
  enabled?: boolean;
  audio_encoding_options?: IngressAudioEncodingOptionsRequest;
  video_encoding_options?: Record<string, IngressVideoEncodingOptionsRequest>;
}

export interface IngressSettingsResponse {
  enabled: boolean;
  audio_encoding_options?: IngressAudioEncodingResponse;
  video_encoding_options?: Record<string, IngressVideoEncodingResponse>;
}

export interface IngressSourceRequest {
  fps: '30' | '60';
  height: number;
  width: number;
}

export interface IngressSourceResponse {
  fps: number;
  height: number;
  width: number;
}

export interface IngressStartedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Unique identifier for this stream
   */
  ingress_stream_id: string;
  /**
   * Streaming protocol (e.g., 'rtmps', 'srt', 'rtmp', 'rtsp')
   */
  publisher_type: string;
  /**
   * User who started the stream
   */
  user_id: string;
  /**
   * The type of event: "ingress.started" in this case
   */
  type: string;
  /**
   * Client IP address
   */
  client_ip?: string;
  /**
   * Streaming client software name (e.g., 'OBS Studio')
   */
  client_name?: string;
  /**
   * Client software version
   */
  version?: string;
}

export interface IngressStoppedEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * Unique identifier for the stream
   */
  ingress_stream_id: string;
  /**
   * User who was streaming
   */
  user_id: string;
  /**
   * The type of event: "ingress.stopped" in this case
   */
  type: string;
}

export interface IngressVideoEncodingOptionsRequest {
  layers: Array<IngressVideoLayerRequest>;
  source: IngressSourceRequest;
}

export interface IngressVideoEncodingResponse {
  layers: Array<IngressVideoLayerResponse>;
  source: IngressSourceResponse;
}

export interface IngressVideoLayerRequest {
  bitrate: number;
  codec: 'h264' | 'vp8';
  frame_rate_limit: number;
  max_dimension: number;
  min_dimension: number;
}

export interface IngressVideoLayerResponse {
  bitrate: number;
  codec: string;
  frame_rate_limit: number;
  max_dimension: number;
  min_dimension: number;
}

export interface JoinCallRequest {
  location: string;
  /**
   * if true the call will be created if it doesn't exist
   */
  create?: boolean;
  /**
   * the encryption mode the client intends to use for this join; the join is rejected if it does not match the call's encryption configuration
   */
  e2ee?: boolean;
  /**
   * if true, the participant will be marked as publsihing to large audience
   */
  hint_high_scale_livestream_publisher?: boolean;
  members_limit?: number;
  /**
   * If the participant is migrating from another SFU, then this is the ID of the previous SFU
   */
  migrating_from?: string;
  notify?: boolean;
  /**
   * if true and the call is created, the notification will include ring=true
   */
  ring?: boolean;
  video?: boolean;
  /**
   * List of SFU IDs to exclude when picking a new SFU for the participant
   */
  migrating_from_list?: Array<string>;
  /**
   * CallRequest is the payload for creating a call.
   */
  data?: CallRequest;
}

export interface JoinCallResponse {
  created: boolean;
  duration: string;
  members: Array<MemberResponse>;
  own_capabilities: Array<OwnCapability>;
  /**
   * Represents a call
   */
  call: CallResponse;
  credentials: Credentials;
  stats_options: StatsOptions;
  /**
   * MemberResponse is the payload for a member of a call.
   */
  membership?: MemberResponse;
}

export interface Joins {
  reason: string;
  disconnect_reasons: Record<string, number>;
  failure_stages: Record<string, number>;
  join_attempts?: number;
  join_success_rate?: number;
}

export interface KickUserRequest {
  /**
   * The user to kick
   */
  user_id: string;
  /**
   * If true, also block the user from rejoining the call
   */
  block?: boolean;
}

export interface KickUserResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface KickedUserEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * User response object
   */
  user: UserResponse;
  /**
   * The type of event: "call.kicked_user" in this case
   */
  type: string;
  /**
   * User response object
   */
  kicked_by_user?: UserResponse;
}

export interface LayoutSettingsRequest {
  name: 'spotlight' | 'grid' | 'single-participant' | 'mobile' | 'custom';
  detect_orientation?: boolean;
  external_app_url?: string;
  external_css_url?: string;
  options?: Record<string, any>;
}

export interface LimitsSettingsRequest {
  max_duration_seconds?: number;
  max_participants?: number;
  max_participants_exclude_owner?: boolean;
  max_participants_exclude_roles?: Array<string>;
}

export interface LimitsSettingsResponse {
  max_participants_exclude_roles: Array<string>;
  max_duration_seconds?: number;
  max_participants?: number;
  max_participants_exclude_owner?: boolean;
}

export interface ListRecordingsResponse {
  duration: string;
  recordings: Array<CallRecording>;
}

export interface ListTranscriptionsResponse {
  duration: string;
  /**
   * List of transcriptions for the call
   */
  transcriptions: Array<CallTranscription>;
}

export interface LocationResponse {
  /**
   * Continent code
   */
  continent_code: string;
  /**
   * Country ISO code
   */
  country_iso_code: string;
  /**
   * Subdivision ISO code
   */
  subdivision_iso_code: string;
}

export interface MemberRequest {
  user_id: string;
  role?: string;
  /**
   * Custom data for this object
   */
  custom?: Record<string, any>;
}

export interface MemberResponse {
  /**
   * Date/time of creation
   */
  created_at: TimestampNS;
  /**
   * Date/time of the last update
   */
  updated_at: TimestampNS;
  user_id: string;
  /**
   * Custom member response data
   */
  custom: Record<string, any>;
  /**
   * User response object
   */
  user: UserResponse;
  /**
   * Date/time of deletion
   */
  deleted_at?: TimestampNS;
  role?: string;
}

export interface MessageStatsResponse {
  count_over_time?: Array<CountByMinuteResponse>;
}

export interface MetricDescriptor {
  label: string;
  description?: string;
  unit?: string;
}

export interface MetricThreshold {
  level: string;
  operator: string;
  value: number;
  value_unit?: string;
  window_seconds?: number;
}

export interface MetricTimeSeries {
  data_points?: Array<Array<number>>;
}

export interface MetricsPct {
  freezes?: number;
  geo?: number;
  jitter?: number;
  latency?: number;
  quality_score?: number;
}

export interface MuteUsersRequest {
  audio?: boolean;
  mute_all_users?: boolean;
  screenshare?: boolean;
  screenshare_audio?: boolean;
  video?: boolean;
  user_ids?: Array<string>;
}

export interface MuteUsersResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface NetworkMetricsReportResponse {
  average_connection_time?: number;
  average_jitter?: number;
  average_latency?: number;
  average_time_to_reconnect?: number;
}

export interface NoiseCancellationSettings {
  mode: 'available' | 'disabled' | 'auto-on';
}

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
  KICK_USER: 'kick-user',
  MUTE_USERS: 'mute-users',
  PIN_FOR_EVERYONE: 'pin-for-everyone',
  READ_CALL: 'read-call',
  REMOVE_CALL_MEMBER: 'remove-call-member',
  SCREENSHARE: 'screenshare',
  SEND_AUDIO: 'send-audio',
  SEND_CLOSED_CAPTIONS_CALL: 'send-closed-captions-call',
  SEND_VIDEO: 'send-video',
  START_BROADCAST_CALL: 'start-broadcast-call',
  START_CLOSED_CAPTIONS_CALL: 'start-closed-captions-call',
  START_FRAME_RECORD_CALL: 'start-frame-record-call',
  START_INDIVIDUAL_RECORD_CALL: 'start-individual-record-call',
  START_RAW_RECORD_CALL: 'start-raw-record-call',
  START_RECORD_CALL: 'start-record-call',
  START_TRANSCRIPTION_CALL: 'start-transcription-call',
  STOP_BROADCAST_CALL: 'stop-broadcast-call',
  STOP_CLOSED_CAPTIONS_CALL: 'stop-closed-captions-call',
  STOP_FRAME_RECORD_CALL: 'stop-frame-record-call',
  STOP_INDIVIDUAL_RECORD_CALL: 'stop-individual-record-call',
  STOP_RAW_RECORD_CALL: 'stop-raw-record-call',
  STOP_RECORD_CALL: 'stop-record-call',
  STOP_TRANSCRIPTION_CALL: 'stop-transcription-call',
  UPDATE_CALL: 'update-call',
  UPDATE_CALL_MEMBER: 'update-call-member',
  UPDATE_CALL_PERMISSIONS: 'update-call-permissions',
  UPDATE_CALL_SETTINGS: 'update-call-settings',
} as const;

export type OwnCapability = (typeof OwnCapability)[keyof typeof OwnCapability];

export interface OwnUserResponse {
  created_at: TimestampNS;
  id: string;
  language: string;
  role: string;
  updated_at: TimestampNS;
  devices: Array<DeviceResponse>;
  teams: Array<string>;
  custom: Record<string, any>;
  avg_response_time?: number;
  deactivated_at?: TimestampNS;
  deleted_at?: TimestampNS;
  image?: string;
  last_active?: TimestampNS;
  name?: string;
  revoke_tokens_issued_before?: TimestampNS;
  blocked_user_ids?: Array<string>;
  privacy_settings?: PrivacySettingsResponse;
  push_preferences?: PushPreferencesResponse;
  teams_role?: Record<string, string>;
}

export interface ParticipantCountByMinuteResponse {
  first: number;
  last: number;
  max: number;
  min: number;
  start_ts: TimestampNS;
}

export interface ParticipantCountOverTimeResponse {
  by_minute?: Array<ParticipantCountByMinuteResponse>;
}

export interface ParticipantReportResponse {
  sum: number;
  unique: number;
  max_concurrent?: number;
  by_browser?: Array<GroupedStatsResponse>;
  by_country?: Array<GroupedStatsResponse>;
  by_device?: Array<GroupedStatsResponse>;
  by_operating_system?: Array<GroupedStatsResponse>;
  count_over_time?: ParticipantCountOverTimeResponse;
  publishers?: PublisherStatsResponse;
  subscribers?: SubscriberStatsResponse;
}

export interface ParticipantSeriesPublisherStats {
  global_metrics_order?: Array<string>;
  global?: Record<string, Array<Array<number>>>;
  global_meta?: Record<string, MetricDescriptor>;
  global_thresholds?: Record<string, Array<MetricThreshold>>;
  tracks?: Record<string, Array<ParticipantSeriesTrackMetrics>>;
}

export interface ParticipantSeriesSubscriberStats {
  global_metrics_order?: Array<string>;
  subscriptions?: Array<ParticipantSeriesSubscriptionTrackMetrics>;
  global?: Record<string, Array<Array<number>>>;
  global_meta?: Record<string, MetricDescriptor>;
  global_thresholds?: Record<string, Array<MetricThreshold>>;
}

export interface ParticipantSeriesSubscriptionTrackMetrics {
  publisher_user_id: string;
  publisher_name?: string;
  publisher_user_session_id?: string;
  tracks?: Record<string, Array<ParticipantSeriesTrackMetrics>>;
}

export interface ParticipantSeriesTimeframe {
  max_points: number;
  since: TimestampNS;
  step_seconds: number;
  until: TimestampNS;
}

export interface ParticipantSeriesTrackMetrics {
  track_id: string;
  codec?: string;
  label?: string;
  rid?: string;
  track_type?: string;
  metrics_order?: Array<string>;
  metrics?: Record<string, Array<Array<number>>>;
  metrics_meta?: Record<string, MetricDescriptor>;
  thresholds?: Record<string, Array<MetricThreshold>>;
}

export interface ParticipantSeriesUserStats {
  metrics_order?: Array<string>;
  metrics?: Record<string, Array<Array<number>>>;
  metrics_meta?: Record<string, MetricDescriptor>;
  thresholds?: Record<string, Array<MetricThreshold>>;
}

export interface ParticipantSessionDetails {
  publisher_type: string;
  user_id: string;
  user_session_id: string;
  roles: Array<string>;
  duration_in_seconds?: number;
  joined_at?: TimestampNS;
  left_at?: TimestampNS;
}

export interface PerSDKUsageReport {
  total: number;
  by_version: Record<string, number>;
}

export interface Percentiles {
  p50?: number;
  p95?: number;
}

export interface PermissionRequestEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * The list of permissions requested by the user
   */
  permissions: Array<string>;
  /**
   * User response object
   */
  user: UserResponse;
  /**
   * The type of event: "call.permission_request" in this case
   */
  type: string;
}

export interface PinRequest {
  /**
   * the session ID of the user who pinned the message
   */
  session_id: string;
  /**
   * the user ID of the user who pinned the message
   */
  user_id: string;
}

export interface PinResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface PoorByCause {
  delivery: number;
  edge: number;
  isolated_local: number;
  source: number;
  unattributed: number;
}

export interface PoorTail {
  healthy_viewers: number;
  note: string;
  poor_total: number;
  poor_by_cause: PoorByCause;
  supporting: Supporting;
  healthy_pct?: number;
}

export interface PrivacySettingsResponse {}

export interface PublishedTrackFlags {
  audio: boolean;
  screenshare: boolean;
  screenshare_audio: boolean;
  video: boolean;
}

export interface PublishedTrackMetrics {
  codec?: string;
  track_id?: string;
  track_type?: string;
  warnings?: Array<SessionWarningResponse>;
  bitrate?: MetricTimeSeries;
  framerate?: MetricTimeSeries;
  resolution?: ResolutionMetricsTimeSeries;
}

export interface PublisherSession {
  duration_min: number;
  started_offset_min: number;
  user_id: string;
  user_session_id: string;
  avg_jitter_ms?: number;
  browser?: string;
  delivery_zone?: string;
  ingest?: string;
  os?: string;
  send_quality_score?: number;
  tool?: string;
  encoding?: EncodingProfile;
}

export interface PublisherStatsResponse {
  total: number;
  unique: number;
  by_track?: Array<TrackStatsResponse>;
}

export interface PushPreferencesResponse {
  call_level?: string;
  chat_level?: string;
  disabled_until?: TimestampNS;
  feeds_level?: string;
  chat_preferences?: ChatPreferencesResponse;
  feeds_preferences?: FeedsPreferencesResponse;
}

export interface Quality {
  viewer_interruption_note: string;
  interruption_incidents: Array<Incident>;
  connection_avg_jitter_ms: Percentiles;
  connection_avg_latency_ms: Percentiles;
  score_bands_by_connection_pct: ScoreBands;
  score_bands_by_watch_time_pct: ScoreBands;
  p50_quality_score?: number;
  p5_quality_score?: number;
  viewer_interruption_rate_pct?: number;
}

export interface QualityScoreReport {
  histogram: Array<ReportByHistogramBucket>;
}

export interface QualityScoreReportResponse {
  daily: Array<DailyAggregateQualityScoreReportResponse>;
}

export interface QueryAggregateCallStatsRequest {
  from?: string;
  to?: string;
  report_types?: Array<string>;
}

export interface QueryAggregateCallStatsResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
  call_duration_report?: CallDurationReportResponse;
  call_participant_count_report?: CallParticipantCountReportResponse;
  calls_per_day_report?: CallsPerDayReportResponse;
  network_metrics_report?: NetworkMetricsReportResponse;
  quality_score_report?: QualityScoreReportResponse;
  sdk_usage_report?: SDKUsageReportResponse;
  user_feedback_report?: UserFeedbackReportResponse;
}

export interface QueryCallMembersRequest {
  id: string;
  type: string;
  limit?: number;
  next?: string;
  prev?: string;
  /**
   * Array of sort parameters
   */
  sort?: Array<SortParamRequest>;
  /**
   * Filter conditions to apply to the query
   */
  filter_conditions?: Filters<{
    call_cid: {
      type: string;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$in' | '$lt' | '$lte';
    };

    created_at: {
      type: Date | string;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$in' | '$lt' | '$lte';
    };

    custom: {
      type: Record<string, any>;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$in' | '$lt' | '$lte';
    };

    role: {
      type: string;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$in' | '$lt' | '$lte';
    };

    updated_at: {
      type: Date | string;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$in' | '$lt' | '$lte';
    };

    user_id: {
      type: string;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$in' | '$lt' | '$lte';
    };
  }>;
}

export interface QueryCallMembersResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
  members: Array<MemberResponse>;
  next?: string;
  prev?: string;
}

export interface QueryCallParticipantSessionsResponse {
  call_id: string;
  call_session_id: string;
  call_type: string;
  /**
   * Duration of the request in milliseconds
   */
  duration: number;
  total_participant_duration: number;
  total_participant_sessions: number;
  participants_sessions: Array<ParticipantSessionDetails>;
  next?: string;
  prev?: string;
  session?: CallSessionResponse;
}

export interface QueryCallParticipantsRequest {
  /**
   * Filter conditions to apply to the query
   */
  filter_conditions?: Filters<{
    published_tracks: {
      type: string;
      operators: '$eq' | '$in';
    };

    user_id: {
      type: string;
      operators: '$eq' | '$in';
    };
  }>;
}

export interface QueryCallParticipantsResponse {
  duration: string;
  total_participants: number;
  members: Array<MemberResponse>;
  own_capabilities: Array<OwnCapability>;
  /**
   * List of call participants
   */
  participants: Array<CallParticipantResponse>;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * MemberResponse is the payload for a member of a call.
   */
  membership?: MemberResponse;
}

export interface QueryCallSessionParticipantStatsResponse {
  call_id: string;
  call_session_id: string;
  call_type: string;
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
  participants: Array<CallStatsParticipant>;
  counts: CallStatsParticipantCounts;
  call_ended_at?: TimestampNS;
  call_started_at?: TimestampNS;
  next?: string;
  prev?: string;
  tmp_data_source?: string;
  call_events?: Array<CallLevelEventPayload>;
}

export interface QueryCallSessionParticipantStatsTimelineResponse {
  call_id: string;
  call_session_id: string;
  call_type: string;
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
  user_id: string;
  user_session_id: string;
  events: Array<CallParticipantTimeline>;
}

export interface QueryCallSessionStatsRequest {
  limit?: number;
  next?: string;
  prev?: string;
  /**
   * Array of sort parameters
   */
  sort?: Array<SortParamRequest>;
  /**
   * Filter conditions to apply to the query
   */
  filter_conditions?: Filters<{
    call_cid: {
      type: string;
      operators: '$eq';
    };

    call_session_id: {
      type: string;
      operators: '$eq';
    };

    'counts.avg_user_rating': {
      type: number;
      operators: '$eq' | '$gt' | '$gte' | '$lt' | '$lte';
    };

    'counts.cq_score': {
      type: number;
      operators: '$eq' | '$gt' | '$gte' | '$lt' | '$lte';
    };

    'counts.min_user_rating': {
      type: number;
      operators: '$eq' | '$gt' | '$gte' | '$lt' | '$lte';
    };

    generated_at: {
      type: Date | string;
      operators: '$eq' | '$gt' | '$gte' | '$lt' | '$lte';
    };

    is_active: {
      type: boolean;
      operators: '$eq';
    };

    session_ended_at: {
      type: Date | string;
      operators: '$eq' | '$gt' | '$gte' | '$lt' | '$lte';
    };

    session_started_at: {
      type: Date | string;
      operators: '$eq' | '$gt' | '$gte' | '$lt' | '$lte';
    };

    updated_at: {
      type: Date | string;
      operators: '$eq' | '$gt' | '$gte' | '$lt' | '$lte';
    };
  }>;
}

export interface QueryCallSessionStatsResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
  call_stats: Array<CallStatsSessionResponse>;
  next?: string;
  prev?: string;
}

export interface QueryCallStatsMapResponse {
  call_id: string;
  call_session_id: string;
  call_type: string;
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
  counts: CallStatsParticipantCounts;
  call_ended_at?: TimestampNS;
  call_started_at?: TimestampNS;
  data_source?: string;
  end_time?: TimestampNS;
  generated_at?: TimestampNS;
  start_time?: TimestampNS;
  publishers?: CallStatsMapPublishers;
  sfus?: CallStatsMapSFUs;
  subscribers?: CallStatsMapSubscribers;
}

export interface QueryCallStatsRequest {
  limit?: number;
  next?: string;
  prev?: string;
  /**
   * Array of sort parameters
   */
  sort?: Array<SortParamRequest>;
  /**
   * Filter conditions to apply to the query
   */
  filter_conditions?: Filters<{
    call_cid: {
      type: string;
      operators: '$eq';
    };

    created_at: {
      type: Date | string;
      operators: '$eq' | '$gt' | '$gte' | '$lt' | '$lte';
    };

    first_stats: {
      type: Date | string;
      operators: '$eq' | '$gt' | '$gte' | '$lt' | '$lte';
    };

    min_user_rating: {
      type: number;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$lt' | '$lte';
    };

    quality_score: {
      type: number;
      operators: '$eq' | '$gt' | '$gte' | '$lt' | '$lte';
    };
  }>;
}

export interface QueryCallStatsResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
  reports: Array<CallStatsReportSummaryResponse>;
  next?: string;
  prev?: string;
}

export interface QueryCallsRequest {
  limit?: number;
  next?: string;
  prev?: string;
  watch?: boolean;
  /**
   * Array of sort parameters
   */
  sort?: Array<SortParamRequest>;
  /**
   * Filter conditions to apply to the query
   */
  filter_conditions?: Filters<{
    backstage: {
      type: boolean;
      operators: '$eq';
    };

    cid: {
      type: string;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$in' | '$lt' | '$lte';
    };

    created_at: {
      type: Date | string;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$in' | '$lt' | '$lte';
    };

    created_by_user_id: {
      type: string;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$in' | '$lt' | '$lte';
    };

    custom: {
      type: Record<string, any>;
      operators:
        | '$autocomplete'
        | '$contains'
        | '$eq'
        | '$exists'
        | '$gt'
        | '$gte'
        | '$in'
        | '$lt'
        | '$lte'
        | '$q';
    };

    ended_at: {
      type: Date | string;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$in' | '$lt' | '$lte';
    };

    id: {
      type: string;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$in' | '$lt' | '$lte';
    };

    members: {
      type: string;
      operators: '$in';
    };

    ongoing: {
      type: boolean;
      operators: '$eq';
    };

    parent_call_cid: {
      type: string;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$in' | '$lt' | '$lte';
    };

    starts_at: {
      type: Date | string;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$in' | '$lt' | '$lte';
    };

    team: {
      type: string;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$in' | '$lt' | '$lte';
    };

    type: {
      type: string;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$in' | '$lt' | '$lte';
    };

    updated_at: {
      type: Date | string;
      operators: '$eq' | '$exists' | '$gt' | '$gte' | '$in' | '$lt' | '$lte';
    };
  }>;
}

export interface QueryCallsResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
  calls: Array<CallStateResponseFields>;
  next?: string;
  prev?: string;
}

export interface RTMPBroadcastRequest {
  /**
   * Name identifier for RTMP broadcast, must be unique in call
   */
  name: string;
  /**
   * URL for the RTMP server to send the call to
   */
  stream_url: string;
  /**
   * If provided, will override the call's RTMP settings quality. One of: 360p, 480p, 720p, 1080p, 1440p, portrait-360x640, portrait-480x854, portrait-720x1280, portrait-1080x1920, portrait-1440x2560
   */
  quality?:
    | '360p'
    | '480p'
    | '720p'
    | '1080p'
    | '1440p'
    | 'portrait-360x640'
    | 'portrait-480x854'
    | 'portrait-720x1280'
    | 'portrait-1080x1920'
    | 'portrait-1440x2560';
  /**
   * If provided, will be appended at the end of stream_url
   */
  stream_key?: string;
  layout?: LayoutSettingsRequest;
}

export interface RTMPIngress {
  address: string;
}

export interface RTMPSettingsRequest {
  /**
   * Whether RTMP broadcasting is enabled
   */
  enabled?: boolean;
  /**
   * Resolution to set for the RTMP stream. One of: 360p, 480p, 720p, 1080p, 1440p, portrait-360x640, portrait-480x854, portrait-720x1280, portrait-1080x1920, portrait-1440x2560
   */
  quality?:
    | '360p'
    | '480p'
    | '720p'
    | '1080p'
    | '1440p'
    | 'portrait-360x640'
    | 'portrait-480x854'
    | 'portrait-720x1280'
    | 'portrait-1080x1920'
    | 'portrait-1440x2560';
}

export interface RTMPSettingsResponse {
  enabled: boolean;
  quality: string;
}

export interface RawRecordingResponse {
  status: string;
}

export interface RawRecordingSettingsRequest {
  /**
   * Recording mode. One of: available, disabled, auto-on
   */
  mode: 'available' | 'disabled' | 'auto-on';
  /**
   * If true, only audio tracks will be recorded
   */
  audio_only?: boolean;
}

export interface RawRecordingSettingsResponse {
  mode: 'available' | 'disabled' | 'auto-on';
  audio_only?: boolean;
}

export interface RecordSettingsRequest {
  /**
   * Recording mode. One of: available, disabled, auto-on
   */
  mode: 'available' | 'disabled' | 'auto-on';
  /**
   * Whether to record audio only
   */
  audio_only?: boolean;
  /**
   * Recording quality. One of: 360p, 480p, 720p, 1080p, 1440p, portrait-360x640, portrait-480x854, portrait-720x1280, portrait-1080x1920, portrait-1440x2560
   */
  quality?:
    | '360p'
    | '480p'
    | '720p'
    | '1080p'
    | '1440p'
    | 'portrait-360x640'
    | 'portrait-480x854'
    | 'portrait-720x1280'
    | 'portrait-1080x1920'
    | 'portrait-1440x2560';
}

export interface RecordSettingsResponse {
  audio_only: boolean;
  mode: string;
  quality: string;
}

export interface RejectCallRequest {
  /**
   * Reason for rejecting the call
   */
  reason?: string;
}

export interface RejectCallResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface ReportByHistogramBucket {
  category: string;
  count: number;
  sum: number;
  lower_bound?: Bound;
  upper_bound?: Bound;
}

export interface ReportClientEventRequest {
  /**
   * Client-side events to report (1-100 per request)
   */
  events: Array<ClientEvent>;
}

export interface ReportClientEventResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface ReportResponse {
  call: CallReportResponse;
  participants: ParticipantReportResponse;
  user_ratings: UserRatingReportResponse;
}

export interface RequestPermissionRequest {
  permissions: Array<string>;
}

export interface RequestPermissionResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface ResolutionMetricsTimeSeries {
  height?: MetricTimeSeries;
  width?: MetricTimeSeries;
}

export interface ResolveSipAuthRequest {
  /**
   * SIP caller number
   */
  sip_caller_number: string;
  /**
   * SIP trunk number to look up
   */
  sip_trunk_number: string;
  /**
   * Host from the SIP From header
   */
  from_host?: string;
  /**
   * Transport-layer source IP address of the SIP request
   */
  source_ip?: string;
}

export interface ResolveSipAuthResponse {
  /**
   * Authentication result: password, accept, or no_trunk_found
   */
  auth_result: string;
  duration: string;
  /**
   * Password for digest authentication (when auth_result is password)
   */
  password?: string;
  /**
   * ID of the matched SIP trunk
   */
  trunk_id?: string;
  /**
   * Username for digest authentication (when auth_result is password)
   */
  username?: string;
}

export interface ResolveSipInboundRequest {
  /**
   * SIP caller number
   */
  sip_caller_number: string;
  /**
   * SIP trunk number to resolve
   */
  sip_trunk_number: string;
  /**
   * Optional routing number for routing number-based call routing (10 digits)
   */
  routing_number?: string;
  /**
   * Optional pre-authenticated trunk ID (from PreAuth no-auth flow)
   */
  trunk_id?: string;
  /**
   * SIP digest challenge authentication data
   */
  challenge?: SIPChallengeRequest;
  /**
   * Optional SIP headers as key-value pairs
   */
  sip_headers?: Record<string, string>;
}

export interface ResolveSipInboundResponse {
  duration: string;
  /**
   * Credentials for SIP inbound call authentication
   */
  credentials: SipInboundCredentials;
  /**
   * SIP Inbound Routing Rule response
   */
  sip_routing_rule?: SIPInboundRoutingRuleResponse;
  /**
   * SIP trunk information
   */
  sip_trunk?: SIPTrunkResponse;
}

export interface RingCallRequest {
  /**
   * Indicate if call should be video
   */
  video?: boolean;
  /**
   * Members that should receive the ring. If no ids are provided, all call members who are not already in the call will receive ring notifications.
   */
  members_ids?: Array<string>;
  /**
   * Opaque context stored on the ring attempt; refs and IDs only
   */
  custom?: Record<string, any>;
}

export interface RingCallResponse {
  duration: string;
  /**
   * List of members ringing notification was sent to
   */
  members_ids: Array<string>;
  /**
   * The ring this call created, for correlating the accept, reject and missed outcomes that follow
   */
  ring_id?: string;
}

export interface RingSettingsRequest {
  /**
   * When none of the callees accept a ring call in this time a rejection will be sent by the caller with reason 'timeout' by the SDKs
   */
  auto_cancel_timeout_ms: number;
  /**
   * When a callee is online but doesn't answer a ring call in this time a rejection will be sent with reason 'timeout' by the SDKs
   */
  incoming_call_timeout_ms: number;
  /**
   * When a callee doesn't accept or reject a ring call in this time a missed call event will be sent
   */
  missed_call_timeout_ms?: number;
}

export interface RingSettingsResponse {
  auto_cancel_timeout_ms: number;
  incoming_call_timeout_ms: number;
  missed_call_timeout_ms: number;
}

export interface SDKUsageReport {
  per_sdk_usage: Record<string, PerSDKUsageReport>;
}

export interface SDKUsageReportResponse {
  daily: Array<DailyAggregateSDKUsageReportResponse>;
}

export interface SFULocationResponse {
  datacenter: string;
  id: string;
  /**
   * Geographic coordinates
   */
  coordinates: CoordinatesResponse;
  /**
   * Geographic location metadata
   */
  location: LocationResponse;
  count?: number;
}

export interface SFUResponse {
  edge_name: string;
  url: string;
  ws_endpoint: string;
}

export interface SIPCallConfigsResponse {
  /**
   * Custom data associated with the call
   */
  custom_data: Record<string, any>;
}

export interface SIPCallerConfigsResponse {
  /**
   * Unique identifier for the caller
   */
  id: string;
  /**
   * Custom data associated with the caller
   */
  custom_data: Record<string, any>;
}

export interface SIPChallengeRequest {
  /**
   * Deprecated: A1 hash for backward compatibility
   */
  a1?: string;
  /**
   * Hash algorithm (e.g., MD5, SHA-256)
   */
  algorithm?: string;
  /**
   * Character set
   */
  charset?: string;
  /**
   * Client nonce for qop=auth
   */
  cnonce?: string;
  /**
   * SIP method (e.g., INVITE)
   */
  method?: string;
  /**
   * Nonce count for qop=auth
   */
  nc?: string;
  /**
   * Server nonce
   */
  nonce?: string;
  /**
   * Opaque value
   */
  opaque?: string;
  /**
   * Authentication realm
   */
  realm?: string;
  /**
   * Digest response hash from client
   */
  response?: string;
  /**
   * Whether the nonce is stale
   */
  stale?: boolean;
  /**
   * Request URI
   */
  uri?: string;
  /**
   * Whether to hash the username
   */
  userhash?: boolean;
  /**
   * Username for authentication
   */
  username?: string;
  /**
   * Domain list
   */
  domain?: Array<string>;
  /**
   * Quality of protection options
   */
  qop?: Array<string>;
}

export interface SIPDirectRoutingRuleCallConfigsResponse {
  /**
   * ID of the call
   */
  call_id: string;
  /**
   * Type of the call
   */
  call_type: string;
}

export interface SIPInboundRoutingRulePinConfigsResponse {
  /**
   * Optional webhook URL for custom PIN handling
   */
  custom_webhook_url?: string;
  /**
   * Prompt message for failed PIN attempts
   */
  pin_failed_attempt_prompt?: string;
  /**
   * Prompt message for hangup after PIN input
   */
  pin_hangup_prompt?: string;
  /**
   * Prompt message for PIN input
   */
  pin_prompt?: string;
  /**
   * Prompt message for successful PIN input
   */
  pin_success_prompt?: string;
}

export interface SIPInboundRoutingRuleResponse {
  /**
   * Creation timestamp
   */
  created_at: TimestampNS;
  duration: string;
  /**
   * Unique identifier of the SIP Inbound Routing Rule
   */
  id: string;
  /**
   * Name of the SIP Inbound Routing Rule
   */
  name: string;
  /**
   * Last update timestamp
   */
  updated_at: TimestampNS;
  /**
   * List of called numbers
   */
  called_numbers: Array<string>;
  /**
   * List of SIP trunk IDs
   */
  trunk_ids: Array<string>;
  /**
   * List of caller numbers
   */
  caller_numbers?: Array<string>;
  /**
   * SIP call configuration response
   */
  call_configs?: SIPCallConfigsResponse;
  /**
   * SIP caller configuration response
   */
  caller_configs?: SIPCallerConfigsResponse;
  /**
   * Direct routing rule call configuration response
   */
  direct_routing_configs?: SIPDirectRoutingRuleCallConfigsResponse;
  /**
   * PIN protection configuration response
   */
  pin_protection_configs?: SIPPinProtectionConfigsResponse;
  /**
   * PIN routing rule call configuration response
   */
  pin_routing_configs?: SIPInboundRoutingRulePinConfigsResponse;
}

export interface SIPPinProtectionConfigsResponse {
  /**
   * Whether PIN protection is enabled
   */
  enabled: boolean;
  /**
   * Default PIN to use if there is no PIN set on the call object
   */
  default_pin?: string;
  /**
   * Maximum number of PIN attempts allowed
   */
  max_attempts?: number;
  /**
   * Number of digits required for the PIN
   */
  required_pin_digits?: number;
}

export interface SIPTrunkResponse {
  /**
   * Creation timestamp
   */
  created_at: TimestampNS;
  /**
   * Unique identifier for the SIP trunk
   */
  id: string;
  /**
   * Name of the SIP trunk
   */
  name: string;
  /**
   * Password for SIP trunk authentication
   */
  password: string;
  /**
   * Last update timestamp
   */
  updated_at: TimestampNS;
  /**
   * The URI for the SIP trunk
   */
  uri: string;
  /**
   * Username for SIP trunk authentication
   */
  username: string;
  /**
   * Allowed IPv4/IPv6 addresses or CIDR blocks
   */
  allowed_ips: Array<string>;
  /**
   * Phone numbers associated with this SIP trunk
   */
  numbers: Array<string>;
}

export interface SRTIngress {
  address: string;
}

export interface ScoreBands {
  good?: number;
  ok?: number;
  poor?: number;
}

export interface ScreensharingSettingsRequest {
  access_request_enabled?: boolean;
  enabled?: boolean;
  target_resolution?: TargetResolution;
}

export interface ScreensharingSettingsResponse {
  access_request_enabled: boolean;
  enabled: boolean;
  target_resolution?: TargetResolution;
}

export interface Segments {
  by_country_reason: string;
  by_browser: Array<BroadcastSegment>;
  by_country: Array<BroadcastSegment>;
  by_delivery_zone: Array<DeliveryZoneSegment>;
  by_os: Array<BroadcastSegment>;
  by_sdk: Array<BroadcastSegment>;
}

export interface SendCallEventRequest {
  custom?: Record<string, any>;
}

export interface SendCallEventResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface SendVideoReactionRequest {
  type: string;
  emoji_code?: string;
  custom?: Record<string, any>;
}

export interface SendVideoReactionResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
  reaction: VideoReactionResponse;
}

export interface SessionClient {
  ip?: string;
  name?: string;
  network_type?: string;
  version?: string;
  location?: CallStatsLocation;
}

export interface SessionSettingsRequest {
  inactivity_timeout_seconds: number;
}

export interface SessionSettingsResponse {
  inactivity_timeout_seconds: number;
}

export interface SessionWarningResponse {
  code: string;
  warning: string;
  time?: TimestampNS;
}

export interface SipInboundCredentials {
  /**
   * API key for the application
   */
  api_key: string;
  /**
   * ID of the call
   */
  call_id: string;
  /**
   * Type of the call
   */
  call_type: string;
  /**
   * Authentication token for the call
   */
  token: string;
  /**
   * User ID for the call
   */
  user_id: string;
  /**
   * Custom data associated with the call
   */
  call_custom_data: Record<string, any>;
  /**
   * Custom data associated with the user
   */
  user_custom_data: Record<string, any>;
}

export interface SortParamRequest {
  /**
   * Direction of sorting, 1 for Ascending, -1 for Descending, default is 1. One of: -1, 1
   */
  direction?: number;
  /**
   * Name of field to sort by
   */
  field?: string;
  /**
   * Type of field to sort by. Empty string or omitted means string type (default). One of: number, boolean
   */
  type?: string;
}

export interface SourceHealth {
  co_host_peak: number;
  dead_air_s: number;
  interruptions: Array<SourceInterruption>;
  publisher_sessions: Array<PublisherSession>;
}

export interface SourceInterruption {
  at_offset_min: number;
  dead_air_s: number;
  kind: string;
  seamless?: boolean;
}

export interface SpeechSegmentConfig {
  max_speech_caption_ms?: number;
  silence_duration_ms?: number;
}

export interface StartClosedCaptionsRequest {
  /**
   * Enable transcriptions along with closed captions
   */
  enable_transcription?: boolean;
  /**
   * Which external storage to use for transcriptions (only applicable if enable_transcription is true)
   */
  external_storage?: string;
  /**
   * The spoken language in the call, if not provided the language defined in the transcription settings will be used. One of: auto, ar, bg, ca, cs, da, de, el, en, es, et, fi, fr, he, hi, hr, hu, id, it, ja, ko, ms, nl, no, pl, pt, ro, ru, sk, sl, sv, ta, th, tl, tr, uk, zh
   */
  language?:
    | 'auto'
    | 'en'
    | 'fr'
    | 'es'
    | 'de'
    | 'it'
    | 'nl'
    | 'pt'
    | 'pl'
    | 'ca'
    | 'cs'
    | 'da'
    | 'el'
    | 'fi'
    | 'id'
    | 'ja'
    | 'ru'
    | 'sv'
    | 'ta'
    | 'th'
    | 'tr'
    | 'hu'
    | 'ro'
    | 'zh'
    | 'ar'
    | 'tl'
    | 'he'
    | 'hi'
    | 'hr'
    | 'ko'
    | 'ms'
    | 'no'
    | 'uk'
    | 'bg'
    | 'et'
    | 'sl'
    | 'sk';
  speech_segment_config?: SpeechSegmentConfig;
}

export interface StartClosedCaptionsResponse {
  duration: string;
}

export interface StartFrameRecordingRequest {
  recording_external_storage?: string;
}

export interface StartFrameRecordingResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface StartHLSBroadcastingRequest {}

export interface StartHLSBroadcastingResponse {
  duration: string;
  /**
   * the URL of the HLS playlist
   */
  playlist_url: string;
}

export interface StartRTMPBroadcastsRequest {
  /**
   * List of broadcasts to start
   */
  broadcasts: Array<RTMPBroadcastRequest>;
}

export interface StartRTMPBroadcastsResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface StartRecordingRequest {
  recording_external_storage?: string;
}

export interface StartRecordingResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface StartTranscriptionRequest {
  /**
   * Enable closed captions along with transcriptions
   */
  enable_closed_captions?: boolean;
  /**
   * The spoken language in the call, if not provided the language defined in the transcription settings will be used. One of: auto, ar, bg, ca, cs, da, de, el, en, es, et, fi, fr, he, hi, hr, hu, id, it, ja, ko, ms, nl, no, pl, pt, ro, ru, sk, sl, sv, ta, th, tl, tr, uk, zh
   */
  language?:
    | 'auto'
    | 'en'
    | 'fr'
    | 'es'
    | 'de'
    | 'it'
    | 'nl'
    | 'pt'
    | 'pl'
    | 'ca'
    | 'cs'
    | 'da'
    | 'el'
    | 'fi'
    | 'id'
    | 'ja'
    | 'ru'
    | 'sv'
    | 'ta'
    | 'th'
    | 'tr'
    | 'hu'
    | 'ro'
    | 'zh'
    | 'ar'
    | 'tl'
    | 'he'
    | 'hi'
    | 'hr'
    | 'ko'
    | 'ms'
    | 'no'
    | 'uk'
    | 'bg'
    | 'et'
    | 'sl'
    | 'sk';
  /**
   * Store transcriptions in this external storage
   */
  transcription_external_storage?: string;
}

export interface StartTranscriptionResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface StatsOptions {
  enable_rtc_stats: boolean;
  reporting_interval_ms: number;
}

export interface StopAllRTMPBroadcastsRequest {}

export interface StopAllRTMPBroadcastsResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface StopClosedCaptionsRequest {
  stop_transcription?: boolean;
}

export interface StopClosedCaptionsResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface StopFrameRecordingRequest {}

export interface StopFrameRecordingResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface StopHLSBroadcastingRequest {}

export interface StopHLSBroadcastingResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface StopLiveRequest {
  continue_closed_caption?: boolean;
  continue_composite_recording?: boolean;
  continue_hls?: boolean;
  continue_individual_recording?: boolean;
  continue_raw_recording?: boolean;
  continue_recording?: boolean;
  continue_rtmp_broadcasts?: boolean;
  continue_transcription?: boolean;
}

export interface StopLiveResponse {
  duration: string;
  /**
   * Represents a call
   */
  call: CallResponse;
}

export interface StopRTMPBroadcastsRequest {}

export interface StopRTMPBroadcastsResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface StopRecordingRequest {}

export interface StopRecordingResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface StopTranscriptionRequest {
  stop_closed_captions?: boolean;
}

export interface StopTranscriptionResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface SubscriberStatsResponse {
  total: number;
  total_subscribed_duration_seconds: number;
  unique: number;
}

export interface Supporting {
  delivery_incident_windows: Array<Incident>;
  edge_outlier_zones: Array<string>;
  source_drop_windows: Array<TimeWindow>;
}

export interface TargetResolution {
  height: number;
  width: number;
  bitrate?: number;
}

export interface ThumbnailResponse {
  image_url: string;
}

export interface ThumbnailsSettingsRequest {
  enabled?: boolean;
}

export interface ThumbnailsSettingsResponse {
  enabled: boolean;
}

export interface TimeWindow {
  from: string;
  to: string;
}

export interface TrackStatsResponse {
  duration_seconds: number;
  track_type: string;
}

export interface TranscriptionSettingsRequest {
  closed_caption_mode?: 'available' | 'disabled' | 'auto-on';
  language?:
    | 'auto'
    | 'en'
    | 'fr'
    | 'es'
    | 'de'
    | 'it'
    | 'nl'
    | 'pt'
    | 'pl'
    | 'ca'
    | 'cs'
    | 'da'
    | 'el'
    | 'fi'
    | 'id'
    | 'ja'
    | 'ru'
    | 'sv'
    | 'ta'
    | 'th'
    | 'tr'
    | 'hu'
    | 'ro'
    | 'zh'
    | 'ar'
    | 'tl'
    | 'he'
    | 'hi'
    | 'hr'
    | 'ko'
    | 'ms'
    | 'no'
    | 'uk'
    | 'bg'
    | 'et'
    | 'sl'
    | 'sk';
  mode?: 'available' | 'disabled' | 'auto-on';
  speech_segment_config?: SpeechSegmentConfig;
  translation?: TranslationSettings;
}

export interface TranscriptionSettingsResponse {
  closed_caption_mode: 'available' | 'disabled' | 'auto-on';
  language:
    | 'auto'
    | 'en'
    | 'fr'
    | 'es'
    | 'de'
    | 'it'
    | 'nl'
    | 'pt'
    | 'pl'
    | 'ca'
    | 'cs'
    | 'da'
    | 'el'
    | 'fi'
    | 'id'
    | 'ja'
    | 'ru'
    | 'sv'
    | 'ta'
    | 'th'
    | 'tr'
    | 'hu'
    | 'ro'
    | 'zh'
    | 'ar'
    | 'tl'
    | 'he'
    | 'hi'
    | 'hr'
    | 'ko'
    | 'ms'
    | 'no'
    | 'uk'
    | 'bg'
    | 'et'
    | 'sl'
    | 'sk';
  mode: 'available' | 'disabled' | 'auto-on';
  speech_segment_config?: SpeechSegmentConfig;
  translation?: TranslationSettings;
}

export interface TranslationSettings {
  enabled?: boolean;
  languages?: Array<string>;
}

export interface UnblockUserRequest {
  /**
   * the user to unblock
   */
  user_id: string;
}

export interface UnblockUserResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface UnblockedUserEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * User response object
   */
  user: UserResponse;
  /**
   * The type of event: "call.unblocked_user" in this case
   */
  type: string;
}

export interface UnpinRequest {
  /**
   * the session ID of the user who pinned the message
   */
  session_id: string;
  /**
   * the user ID of the user who pinned the message
   */
  user_id: string;
}

export interface UnpinResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface UpdateCallMembersRequest {
  /**
   * List of userID to remove
   */
  remove_members?: Array<string>;
  /**
   * List of members to update or insert
   */
  update_members?: Array<MemberRequest>;
}

export interface UpdateCallMembersResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
  members: Array<MemberResponse>;
}

export interface UpdateCallRequest {
  /**
   * the time the call is scheduled to start
   */
  starts_at?: Date;
  /**
   * Custom data for this object
   */
  custom?: Record<string, any>;
  settings_override?: CallSettingsRequest;
}

export interface UpdateCallResponse {
  duration: string;
  members: Array<MemberResponse>;
  own_capabilities: Array<OwnCapability>;
  /**
   * Represents a call
   */
  call: CallResponse;
  /**
   * MemberResponse is the payload for a member of a call.
   */
  membership?: MemberResponse;
}

export interface UpdateUserPermissionsRequest {
  user_id: string;
  grant_permissions?: Array<string>;
  revoke_permissions?: Array<string>;
}

export interface UpdateUserPermissionsResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface UpdatedCallPermissionsEvent {
  call_cid: string;
  created_at: TimestampNS;
  /**
   * The capabilities of the current user
   */
  own_capabilities: Array<OwnCapability>;
  /**
   * User response object
   */
  user: UserResponse;
  /**
   * The type of event: "call.permissions_updated" in this case
   */
  type: string;
}

export interface UserBannedEvent {
  /**
   * Date/time of creation
   */
  created_at: TimestampNS;
  custom: Record<string, any>;
  user: UserResponseCommonFields;
  /**
   * The type of event: "user.banned" in this case
   */
  type: string;
  /**
   * The ID of the channel where the target user was banned
   */
  channel_id?: string;
  channel_member_count?: number;
  channel_message_count?: number;
  /**
   * The type of the channel where the target user was banned
   */
  channel_type?: string;
  /**
   * The CID of the channel where the target user was banned
   */
  cid?: string;
  /**
   * The expiration date of the ban
   */
  expiration?: TimestampNS;
  /**
   * The reason for the ban
   */
  reason?: string;
  received_at?: TimestampNS;
  /**
   * ID of the review queue item (flagged message) that triggered the ban, if the ban was applied from the moderation review queue
   */
  review_queue_item_id?: string;
  /**
   * Whether the user was shadow banned
   */
  shadow?: boolean;
  /**
   * The team of the channel where the target user was banned
   */
  team?: string;
  total_bans?: number;
  channel_custom?: Record<string, any>;
  created_by?: UserResponseCommonFields;
}

export interface UserDeactivatedEvent {
  /**
   * Date/time of creation
   */
  created_at: TimestampNS;
  custom: Record<string, any>;
  user: UserResponseCommonFields;
  /**
   * The type of event: "user.deactivated" in this case
   */
  type: string;
  received_at?: TimestampNS;
  created_by?: UserResponseCommonFields;
}

export interface UserDeletedEvent {
  /**
   * Date/time of creation
   */
  created_at: TimestampNS;
  /**
   * The type of deletion that was used for the user's conversations. One of: hard, soft, pruning, (empty string)
   */
  delete_conversation: string;
  /**
   * Whether the user's conversation channels were deleted
   */
  delete_conversation_channels: boolean;
  /**
   * The type of deletion that was used for the user's messages. One of: hard, soft, pruning, (empty string)
   */
  delete_messages: string;
  /**
   * The type of deletion that was used for the user. One of: hard, soft, pruning, (empty string)
   */
  delete_user: string;
  /**
   * Whether the user was hard deleted
   */
  hard_delete: boolean;
  /**
   * Whether the user's messages were marked as deleted
   */
  mark_messages_deleted: boolean;
  custom: Record<string, any>;
  user: UserResponseCommonFields;
  /**
   * The type of event: "user.deleted" in this case
   */
  type: string;
  received_at?: TimestampNS;
}

export interface UserFeedbackReport {
  unreported_count: number;
  count_by_rating: Record<string, number>;
}

export interface UserFeedbackReportResponse {
  daily: Array<DailyAggregateUserFeedbackReportResponse>;
}

export interface UserPresenceChangedEvent {
  /**
   * Date/time of creation
   */
  created_at: TimestampNS;
  custom: Record<string, any>;
  user: UserResponseCommonFields;
  /**
   * The type of event: "user.presence.changed" in this case
   */
  type: string;
  received_at?: TimestampNS;
}

export interface UserRatingReportResponse {
  average: number;
  count: number;
}

export interface UserReactivatedEvent {
  /**
   * Date/time of creation
   */
  created_at: TimestampNS;
  custom: Record<string, any>;
  user: UserResponseCommonFields;
  /**
   * The type of event: "user.reactivated" in this case
   */
  type: string;
  received_at?: TimestampNS;
  created_by?: UserResponseCommonFields;
}

export interface UserResponse {
  /**
   * Date/time of creation
   */
  created_at: TimestampNS;
  /**
   * Unique user identifier
   */
  id: string;
  /**
   * Preferred language of a user
   */
  language: string;
  /**
   * Determines the set of user permissions
   */
  role: string;
  /**
   * Date/time of the last update
   */
  updated_at: TimestampNS;
  blocked_user_ids: Array<string>;
  /**
   * List of teams user is a part of
   */
  teams: Array<string>;
  /**
   * Custom data for this object
   */
  custom: Record<string, any>;
  avg_response_time?: number;
  /**
   * Date of deactivation
   */
  deactivated_at?: TimestampNS;
  /**
   * Date/time of deletion
   */
  deleted_at?: TimestampNS;
  image?: string;
  /**
   * Date of last activity
   */
  last_active?: TimestampNS;
  /**
   * Optional name of user
   */
  name?: string;
  /**
   * Revocation date for tokens
   */
  revoke_tokens_issued_before?: TimestampNS;
  teams_role?: Record<string, string>;
}

export interface UserResponseCommonFields {
  created_at: TimestampNS;
  id: string;
  language: string;
  role: string;
  updated_at: TimestampNS;
  blocked_user_ids: Array<string>;
  teams: Array<string>;
  custom: Record<string, any>;
  avg_response_time?: number;
  deactivated_at?: TimestampNS;
  deleted_at?: TimestampNS;
  image?: string;
  last_active?: TimestampNS;
  name?: string;
  revoke_tokens_issued_before?: TimestampNS;
  teams_role?: Record<string, string>;
}

export interface UserResponsePrivacyFields {
  created_at: TimestampNS;
  id: string;
  language: string;
  role: string;
  updated_at: TimestampNS;
  blocked_user_ids: Array<string>;
  teams: Array<string>;
  custom: Record<string, any>;
  avg_response_time?: number;
  deactivated_at?: TimestampNS;
  deleted_at?: TimestampNS;
  image?: string;
  invisible?: boolean;
  last_active?: TimestampNS;
  name?: string;
  revoke_tokens_issued_before?: TimestampNS;
  privacy_settings?: PrivacySettingsResponse;
  teams_role?: Record<string, string>;
}

export interface UserUnbannedEvent {
  /**
   * Date/time of creation
   */
  created_at: TimestampNS;
  custom: Record<string, any>;
  user: UserResponseCommonFields;
  /**
   * The type of event: "user.unbanned" in this case
   */
  type: string;
  /**
   * The ID of the channel where the target user was unbanned
   */
  channel_id?: string;
  channel_member_count?: number;
  channel_message_count?: number;
  /**
   * The type of the channel where the target user was unbanned
   */
  channel_type?: string;
  /**
   * The CID of the channel where the target user was unbanned
   */
  cid?: string;
  received_at?: TimestampNS;
  /**
   * Whether the target user was shadow unbanned
   */
  shadow?: boolean;
  /**
   * The team of the channel where the target user was unbanned
   */
  team?: string;
  channel_custom?: Record<string, any>;
  created_by?: UserResponseCommonFields;
}

export interface UserUpdatedEvent {
  /**
   * Date/time of creation
   */
  created_at: TimestampNS;
  custom: Record<string, any>;
  user: UserResponsePrivacyFields;
  /**
   * The type of event: "user.updated" in this case
   */
  type: string;
  received_at?: TimestampNS;
}

export type VideoEvent =
  | ({ type: 'app.updated' } & AppUpdatedEvent)
  | ({ type: 'call.accepted' } & CallAcceptedEvent)
  | ({ type: 'call.blocked_user' } & BlockedUserEvent)
  | ({ type: 'call.closed_caption' } & ClosedCaptionEvent)
  | ({ type: 'call.closed_captions_failed' } & CallClosedCaptionsFailedEvent)
  | ({ type: 'call.closed_captions_started' } & CallClosedCaptionsStartedEvent)
  | ({ type: 'call.closed_captions_stopped' } & CallClosedCaptionsStoppedEvent)
  | ({ type: 'call.created' } & CallCreatedEvent)
  | ({ type: 'call.deleted' } & CallDeletedEvent)
  | ({ type: 'call.dtmf' } & CallDTMFEvent)
  | ({ type: 'call.ended' } & CallEndedEvent)
  | ({ type: 'call.frame_recording_failed' } & CallFrameRecordingFailedEvent)
  | ({ type: 'call.frame_recording_ready' } & CallFrameRecordingFrameReadyEvent)
  | ({ type: 'call.frame_recording_started' } & CallFrameRecordingStartedEvent)
  | ({ type: 'call.frame_recording_stopped' } & CallFrameRecordingStoppedEvent)
  | ({ type: 'call.hls_broadcasting_failed' } & CallHLSBroadcastingFailedEvent)
  | ({
      type: 'call.hls_broadcasting_started';
    } & CallHLSBroadcastingStartedEvent)
  | ({
      type: 'call.hls_broadcasting_stopped';
    } & CallHLSBroadcastingStoppedEvent)
  | ({ type: 'call.kicked_user' } & KickedUserEvent)
  | ({ type: 'call.live_started' } & CallLiveStartedEvent)
  | ({ type: 'call.member_added' } & CallMemberAddedEvent)
  | ({ type: 'call.member_removed' } & CallMemberRemovedEvent)
  | ({ type: 'call.member_updated' } & CallMemberUpdatedEvent)
  | ({
      type: 'call.member_updated_permission';
    } & CallMemberUpdatedPermissionEvent)
  | ({ type: 'call.missed' } & CallMissedEvent)
  | ({ type: 'call.moderation_blur' } & CallModerationBlurEvent)
  | ({ type: 'call.moderation_warning' } & CallModerationWarningEvent)
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
  | ({ type: 'call.stats_report_ready' } & CallStatsReportReadyEvent)
  | ({ type: 'call.transcription_failed' } & CallTranscriptionFailedEvent)
  | ({ type: 'call.transcription_ready' } & CallTranscriptionReadyEvent)
  | ({ type: 'call.transcription_started' } & CallTranscriptionStartedEvent)
  | ({ type: 'call.transcription_stopped' } & CallTranscriptionStoppedEvent)
  | ({ type: 'call.unblocked_user' } & UnblockedUserEvent)
  | ({ type: 'call.updated' } & CallUpdatedEvent)
  | ({ type: 'call.user_feedback_submitted' } & CallUserFeedbackSubmittedEvent)
  | ({ type: 'call.user_muted' } & CallUserMutedEvent)
  | ({ type: 'connection.error' } & ConnectionErrorEvent)
  | ({ type: 'connection.ok' } & ConnectedEvent)
  | ({ type: 'custom' } & CustomVideoEvent)
  | ({ type: 'health.check' } & HealthCheckEvent)
  | ({ type: 'ingress.error' } & IngressErrorEvent)
  | ({ type: 'ingress.started' } & IngressStartedEvent)
  | ({ type: 'ingress.stopped' } & IngressStoppedEvent)
  | ({ type: 'user.banned' } & UserBannedEvent)
  | ({ type: 'user.deactivated' } & UserDeactivatedEvent)
  | ({ type: 'user.deleted' } & UserDeletedEvent)
  | ({ type: 'user.presence.changed' } & UserPresenceChangedEvent)
  | ({ type: 'user.reactivated' } & UserReactivatedEvent)
  | ({ type: 'user.unbanned' } & UserUnbannedEvent)
  | ({ type: 'user.updated' } & UserUpdatedEvent);

export interface VideoReactionOverTimeResponse {
  by_minute?: Array<CountByMinuteResponse>;
}

export interface VideoReactionResponse {
  type: string;
  /**
   * User response object
   */
  user: UserResponse;
  emoji_code?: string;
  custom?: Record<string, any>;
}

export interface VideoReactionsResponse {
  reaction: string;
  count_over_time?: VideoReactionOverTimeResponse;
}

export interface VideoSettingsRequest {
  access_request_enabled?: boolean;
  camera_default_on?: boolean;
  camera_facing?: 'front' | 'back' | 'external';
  enabled?: boolean;
  target_resolution?: TargetResolution;
}

export interface VideoSettingsResponse {
  access_request_enabled: boolean;
  camera_default_on: boolean;
  camera_facing: 'front' | 'back' | 'external';
  enabled: boolean;
  target_resolution: TargetResolution;
}

export interface ViewerBehavior {
  connection_duration_p50_s: number;
  connections_per_viewer_mean: number;
  median_watch_min: number;
  note: string;
  p90_watch_min: number;
  bounce_rate_pct?: number;
  connections_under_30s_pct?: number;
  return_visit_rate_pct?: number;
}

export interface WHIPIngress {
  /**
   * URL for a new whip input, every time a new link is created
   */
  address: string;
}

export type WSCallEvent =
  | ({ type: 'call.dtmf' } & CallDTMFEvent)
  | ({ type: 'ingress.error' } & IngressErrorEvent)
  | ({ type: 'ingress.started' } & IngressStartedEvent)
  | ({ type: 'ingress.stopped' } & IngressStoppedEvent);

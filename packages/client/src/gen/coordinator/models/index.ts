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

export interface AcceptCallRequest {}

export interface AcceptCallResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface Action {
  name: string;

  text: string;

  type: string;

  style?: string;

  value?: string;
}

export interface AddUserGroupMembersRequest {
  /**
   * List of user IDs to add as members
   */
  member_ids: Array<string>;

  /**
   * Whether to add the members as group admins. Defaults to false
   */
  as_admin?: boolean;

  team_id?: string;
}

export interface AddUserGroupMembersResponse {
  duration: string;

  user_group?: UserGroupResponse;
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

export interface AppResponseFields {
  async_url_enrich_enabled: boolean;

  auto_translation_enabled: boolean;

  id: number;

  name: string;

  placement: string;

  file_upload_config: FileUploadConfig;

  image_upload_config: FileUploadConfig;
}

export interface AppUpdatedEvent {
  /**
   * Date/time of creation
   */
  created_at: string;

  app: AppEventResponse;

  custom: Record<string, any>;

  /**
   * The type of event: "app.updated" in this case
   */
  type: string;

  received_at?: string;
}

export interface Attachment {
  custom: Record<string, any>;

  asset_url?: string;

  author_icon?: string;

  author_link?: string;

  author_name?: string;

  color?: string;

  fallback?: string;

  footer?: string;

  footer_icon?: string;

  image_url?: string;

  og_scrape_url?: string;

  original_height?: number;

  original_width?: number;

  pretext?: string;

  text?: string;

  thumb_url?: string;

  title?: string;

  title_link?: string;

  /**
   * Attachment type (e.g. image, video, url)
   */
  type?: string;

  actions?: Array<Action>;

  fields?: Array<Field>;

  giphy?: Images;
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

export interface BlockListOptions {
  /**
   * Blocklist behavior. One of: flag, block, shadow_block
   */

  behavior: 'flag' | 'block' | 'shadow_block';

  /**
   * Blocklist name
   */
  blocklist: string;
}

export interface BlockListResponse {
  is_confusable_folding_enabled: boolean;

  is_leet_check_enabled: boolean;

  is_plural_check_enabled: boolean;

  is_substring_matching_enabled: boolean;

  /**
   * Block list name
   */
  name: string;

  /**
   * Block list type. One of: regex, domain, domain_allowlist, email, email_allowlist, word
   */
  type: string;

  /**
   * List of words to block
   */
  words: Array<string>;

  /**
   * Date/time of creation
   */
  created_at?: string;

  id?: string;

  owner_user_id?: string;

  team?: string;

  /**
   * Date/time of the last update
   */
  updated_at?: string;
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

export interface BlockUsersRequest {
  /**
   * User id to block
   */
  blocked_user_id: string;
}

export interface BlockUsersResponse {
  /**
   * User id who blocked another user
   */
  blocked_by_user_id: string;

  /**
   * User id who got blocked
   */
  blocked_user_id: string;

  /**
   * Timestamp when the user was blocked
   */
  created_at: string;

  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface BlockedUserEvent {
  call_cid: string;

  created_at: string;

  user: UserResponse;

  /**
   * The type of event: "call.blocked_user" in this case
   */
  type: string;

  blocked_by_user?: UserResponse;
}

export interface BlockedUserResponse {
  /**
   * ID of the user who got blocked
   */
  blocked_user_id: string;

  created_at: string;

  /**
   * ID of the user who blocked another user
   */
  user_id: string;

  blocked_user: UserResponse;

  user: UserResponse;
}

export interface Bound {
  inclusive: boolean;

  value: number;
}

export interface BroadcastSettingsRequest {
  enabled?: boolean;

  hls?: HLSSettingsRequest;

  rtmp?: RTMPSettingsRequest;
}

export interface BroadcastSettingsResponse {
  enabled: boolean;

  hls: HLSSettingsResponse;

  rtmp: RTMPSettingsResponse;
}

export interface CallAcceptedEvent {
  call_cid: string;

  created_at: string;

  call: CallResponse;

  user: UserResponse;

  /**
   * The type of event: "call.accepted" in this case
   */
  type: string;
}

export interface CallClosedCaption {
  end_time: string;

  id: string;

  language: string;

  speaker_id: string;

  start_time: string;

  text: string;

  translated: boolean;

  user: UserResponse;

  service?: string;
}

export interface CallClosedCaptionsFailedEvent {
  call_cid: string;

  created_at: string;

  /**
   * The type of event: "call.closed_captions_failed" in this case
   */
  type: string;
}

export interface CallClosedCaptionsStartedEvent {
  call_cid: string;

  created_at: string;

  /**
   * The type of event: "call.closed_captions_started" in this case
   */
  type: string;
}

export interface CallClosedCaptionsStoppedEvent {
  call_cid: string;

  created_at: string;

  /**
   * The type of event: "call.transcription_stopped" in this case
   */
  type: string;
}

export interface CallCreatedEvent {
  call_cid: string;

  created_at: string;

  /**
   * the members added to this call
   */
  members: Array<MemberResponse>;

  call: CallResponse;

  /**
   * The type of event: "call.created" in this case
   */
  type: string;
}

export interface CallDTMFEvent {
  call_cid: string;

  created_at: string;

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
  timestamp: string;

  user: UserResponse;

  /**
   * The type of event: "call.dtmf" in this case
   */
  type: string;
}

export interface CallDeletedEvent {
  call_cid: string;

  created_at: string;

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

  created_at: string;

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

  user?: UserResponse;
}

export interface CallFrameRecordingFailedEvent {
  call_cid: string;

  created_at: string;

  egress_id: string;

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
  captured_at: string;

  created_at: string;

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

  created_at: string;

  egress_id: string;

  call: CallResponse;

  /**
   * The type of event: "call.frame_recording_started" in this case
   */
  type: string;
}

export interface CallFrameRecordingStoppedEvent {
  call_cid: string;

  created_at: string;

  egress_id: string;

  call: CallResponse;

  /**
   * The type of event: "call.frame_recording_stopped" in this case
   */
  type: string;
}

export interface CallHLSBroadcastingFailedEvent {
  call_cid: string;

  created_at: string;

  /**
   * The type of event: "call.hls_broadcasting_failed" in this case
   */
  type: string;
}

export interface CallHLSBroadcastingStartedEvent {
  call_cid: string;

  created_at: string;

  hls_playlist_url: string;

  call: CallResponse;

  /**
   * The type of event: "call.hls_broadcasting_started" in this case
   */
  type: string;
}

export interface CallHLSBroadcastingStoppedEvent {
  call_cid: string;

  created_at: string;

  /**
   * The type of event: "call.hls_broadcasting_stopped" in this case
   */
  type: string;
}

export interface CallIngressResponse {
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

  created_at: string;

  call: CallResponse;

  /**
   * The type of event: "call.live_started" in this case
   */
  type: string;
}

export interface CallMemberAddedEvent {
  call_cid: string;

  created_at: string;

  /**
   * the members added to this call
   */
  members: Array<MemberResponse>;

  call: CallResponse;

  /**
   * The type of event: "call.member_added" in this case
   */
  type: string;
}

export interface CallMemberRemovedEvent {
  call_cid: string;

  created_at: string;

  /**
   * the list of member IDs removed from the call
   */
  members: Array<string>;

  call: CallResponse;

  /**
   * The type of event: "call.member_removed" in this case
   */
  type: string;
}

export interface CallMemberUpdatedEvent {
  call_cid: string;

  created_at: string;

  /**
   * The list of members that were updated
   */
  members: Array<MemberResponse>;

  call: CallResponse;

  /**
   * The type of event: "call.member_updated" in this case
   */
  type: string;
}

export interface CallMemberUpdatedPermissionEvent {
  call_cid: string;

  created_at: string;

  /**
   * The list of members that were updated
   */
  members: Array<MemberResponse>;

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

  created_at: string;

  notify_user: boolean;

  /**
   * Call session ID
   */
  session_id: string;

  /**
   * List of members who missed the call
   */
  members: Array<MemberResponse>;

  call: CallResponse;

  user: UserResponse;

  /**
   * The type of event: "call.notification" in this case
   */
  type: string;
}

export interface CallModerationBlurEvent {
  call_cid: string;

  created_at: string;

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

  created_at: string;

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

  created_at: string;

  /**
   * Call session ID
   */
  session_id: string;

  /**
   * Call members
   */
  members: Array<MemberResponse>;

  call: CallResponse;

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
  joined_at: string;

  role: string;

  user_session_id: string;

  user: UserResponse;
}

export interface CallParticipantTimeline {
  severity: string;

  timestamp: string;

  type: string;

  data: Record<string, any>;
}

export interface CallReactionEvent {
  call_cid: string;

  created_at: string;

  reaction: VideoReactionResponse;

  /**
   * The type of event: "call.reaction_new" in this case
   */
  type: string;
}

export interface CallRecording {
  end_time: string;

  filename: string;

  recording_type: string;

  session_id: string;

  start_time: string;

  url: string;
}

export interface CallRecordingFailedEvent {
  call_cid: string;

  created_at: string;

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

  created_at: string;

  egress_id: string;

  /**
   * The type of recording
   */

  recording_type: 'composite' | 'individual' | 'raw';

  call_recording: CallRecording;

  /**
   * The type of event: "call.recording_ready" in this case
   */
  type: string;
}

export interface CallRecordingStartedEvent {
  call_cid: string;

  created_at: string;

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

  created_at: string;

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

  created_at: string;

  call: CallResponse;

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

  ended_at?: string;

  started_at?: string;
}

export interface CallRequest {
  channel_cid?: string;

  starts_at?: string;

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
  created_at: string;

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
  updated_at: string;

  blocked_user_ids: Array<string>;

  created_by: UserResponse;

  /**
   * Custom data for this object
   */
  custom: Record<string, any>;

  egress: EgressResponse;

  ingress: CallIngressResponse;

  settings: CallSettingsResponse;

  channel_cid?: string;

  /**
   * Date/time when the call ended
   */
  ended_at?: string;

  join_ahead_time_seconds?: number;

  /**
   * 10-digit routing number for SIP routing
   */
  routing_number?: string;

  /**
   * Date/time when the call will start
   */
  starts_at?: string;

  team?: string;

  session?: CallSessionResponse;

  thumbnails?: ThumbnailResponse;
}

export interface CallRingEvent {
  call_cid: string;

  created_at: string;

  /**
   * Call session ID
   */
  session_id: string;

  video: boolean;

  /**
   * Call members
   */
  members: Array<MemberResponse>;

  call: CallResponse;

  user: UserResponse;

  /**
   * The type of event: "call.notification" in this case
   */
  type: string;
}

export interface CallRtmpBroadcastFailedEvent {
  /**
   * The unique identifier for a call (<type>:<id>)
   */
  call_cid: string;

  /**
   * Date/time of creation
   */
  created_at: string;

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
  created_at: string;

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
  created_at: string;

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

  created_at: string;

  /**
   * Call session ID
   */
  session_id: string;

  call: CallResponse;

  /**
   * The type of event: "call.session_ended" in this case
   */
  type: string;
}

export interface CallSessionParticipantCountsUpdatedEvent {
  anonymous_participant_count: number;

  call_cid: string;

  created_at: string;

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

  created_at: string;

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

  created_at: string;

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

  accepted_by: Record<string, string>;

  missed_by: Record<string, string>;

  participants_count_by_role: Record<string, number>;

  rejected_by: Record<string, string>;

  ended_at?: string;

  live_ended_at?: string;

  live_started_at?: string;

  started_at?: string;

  timer_ends_at?: string;
}

export interface CallSessionStartedEvent {
  call_cid: string;

  created_at: string;

  /**
   * Call session ID
   */
  session_id: string;

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

  broadcasting: BroadcastSettingsResponse;

  frame_recording: FrameRecordingSettingsResponse;

  geofencing: GeofenceSettingsResponse;

  individual_recording: IndividualRecordingSettingsResponse;

  limits: LimitsSettingsResponse;

  raw_recording: RawRecordingSettingsResponse;

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

  call: CallResponse;

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

  latest_activity_at?: string;

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

  ended_at?: string;

  freezes_duration_ms?: number;

  ingress?: string;

  jitter_ms?: number;

  latency_ms?: number;

  os?: string;

  publisher_type?: string;

  sdk?: string;

  sdk_version?: string;

  started_at?: string;

  unified_session_id?: string;

  webrtc_version?: string;

  location?: CallStatsLocation;
}

export interface CallStatsReportReadyEvent {
  call_cid: string;

  created_at: string;

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

  first_stats_time: string;

  created_at?: string;

  min_user_rating?: number;

  quality_score?: number;
}

export interface CallStatsSessionResponse {
  call_id: string;

  call_session_id: string;

  call_type: string;

  generated_at: string;

  counts: CallStatsParticipantCounts;

  call_ended_at?: string;

  call_started_at?: string;
}

export interface CallTranscription {
  end_time: string;

  filename: string;

  session_id: string;

  start_time: string;

  url: string;
}

export interface CallTranscriptionFailedEvent {
  call_cid: string;

  created_at: string;

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

  created_at: string;

  egress_id: string;

  call_transcription: CallTranscription;

  /**
   * The type of event: "call.transcription_ready" in this case
   */
  type: string;
}

export interface CallTranscriptionStartedEvent {
  call_cid: string;

  created_at: string;

  egress_id: string;

  /**
   * The type of event: "call.transcription_started" in this case
   */
  type: string;
}

export interface CallTranscriptionStoppedEvent {
  call_cid: string;

  created_at: string;

  egress_id: string;

  /**
   * The type of event: "call.transcription_stopped" in this case
   */
  type: string;
}

export interface CallUpdatedEvent {
  call_cid: string;

  created_at: string;

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

  created_at: string;

  /**
   * The rating given by the user (1-5)
   */
  rating: number;

  /**
   * Call session ID
   */
  session_id: string;

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

  created_at: string;

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

export interface ChannelConfigWithInfo {
  automod: 'disabled' | 'simple' | 'AI';

  automod_behavior: 'flag' | 'block' | 'shadow_block';

  connect_events: boolean;

  count_messages: boolean;

  created_at: string;

  custom_events: boolean;

  delivery_events: boolean;

  mark_messages_pending: boolean;

  max_message_length: number;

  mutes: boolean;

  name: string;

  polls: boolean;

  push_notifications: boolean;

  quotes: boolean;

  reactions: boolean;

  read_events: boolean;

  reminders: boolean;

  replies: boolean;

  search: boolean;

  shared_locations: boolean;

  skip_last_msg_update_for_system_msgs: boolean;

  typing_events: boolean;

  updated_at: string;

  uploads: boolean;

  url_enrichment: boolean;

  user_message_reminders: boolean;

  commands: Array<Command>;

  blocklist?: string;

  blocklist_behavior?: 'flag' | 'block' | 'shadow_block';

  partition_size?: number;

  partition_ttl?: string;

  push_level?: 'all' | 'all_mentions' | 'mentions' | 'direct_mentions' | 'none';

  allowed_flag_reasons?: Array<string>;

  blocklists?: Array<BlockListOptions>;

  automod_thresholds?: Thresholds;

  chat_preferences?: ChatPreferences;

  grants?: Record<string, Array<string>>;
}

export interface ChannelMemberResponse {
  /**
   * Whether member is banned this channel or not
   */
  banned: boolean;

  /**
   * Role of the member in the channel
   */
  channel_role: string;

  /**
   * Date/time of creation
   */
  created_at: string;

  notifications_muted: boolean;

  /**
   * Whether member is shadow banned in this channel or not
   */
  shadow_banned: boolean;

  /**
   * Date/time of the last update
   */
  updated_at: string;

  custom: Record<string, any>;

  archived_at?: string;

  /**
   * Expiration date of the ban
   */
  ban_expires?: string;

  deleted_at?: string;

  /**
   * Date when invite was accepted
   */
  invite_accepted_at?: string;

  /**
   * Date when invite was rejected
   */
  invite_rejected_at?: string;

  /**
   * Whether member was invited or not
   */
  invited?: boolean;

  /**
   * Whether member is channel moderator or not
   */
  is_moderator?: boolean;

  pinned_at?: string;

  /**
   * Permission level of the member in the channel (DEPRECATED: use channel_role instead). One of: member, moderator, admin, owner
   */
  role?: string;

  status?: string;

  user_id?: string;

  deleted_messages?: Array<string>;

  user?: UserResponse;
}

export interface ChannelMute {
  /**
   * Date/time of creation
   */
  created_at: string;

  /**
   * Date/time of the last update
   */
  updated_at: string;

  /**
   * Date/time of mute expiration
   */
  expires?: string;

  channel?: ChannelResponse;

  user?: UserResponse;
}

export const ChannelOwnCapability = {
  BAN_CHANNEL_MEMBERS: 'ban-channel-members',
  CAST_POLL_VOTE: 'cast-poll-vote',
  CONNECT_EVENTS: 'connect-events',
  CREATE_ATTACHMENT: 'create-attachment',
  CREATE_MENTION: 'create-mention',
  DELETE_ANY_MESSAGE: 'delete-any-message',
  DELETE_CHANNEL: 'delete-channel',
  DELETE_OWN_MESSAGE: 'delete-own-message',
  DELIVERY_EVENTS: 'delivery-events',
  FLAG_MESSAGE: 'flag-message',
  FREEZE_CHANNEL: 'freeze-channel',
  JOIN_CHANNEL: 'join-channel',
  LEAVE_CHANNEL: 'leave-channel',
  MUTE_CHANNEL: 'mute-channel',
  NOTIFY_CHANNEL: 'notify-channel',
  NOTIFY_GROUP: 'notify-group',
  NOTIFY_HERE: 'notify-here',
  NOTIFY_ROLE: 'notify-role',
  PIN_MESSAGE: 'pin-message',
  QUERY_POLL_VOTES: 'query-poll-votes',
  QUOTE_MESSAGE: 'quote-message',
  READ_EVENTS: 'read-events',
  SEARCH_MESSAGES: 'search-messages',
  SEND_CUSTOM_EVENTS: 'send-custom-events',
  SEND_LINKS: 'send-links',
  SEND_MESSAGE: 'send-message',
  SEND_POLL: 'send-poll',
  SEND_REACTION: 'send-reaction',
  SEND_REPLY: 'send-reply',
  SEND_RESTRICTED_VISIBILITY_MESSAGE: 'send-restricted-visibility-message',
  SEND_TYPING_EVENTS: 'send-typing-events',
  SET_CHANNEL_COOLDOWN: 'set-channel-cooldown',
  SHARE_LOCATION: 'share-location',
  SKIP_SLOW_MODE: 'skip-slow-mode',
  SLOW_MODE: 'slow-mode',
  TYPING_EVENTS: 'typing-events',
  UPDATE_ANY_MESSAGE: 'update-any-message',
  UPDATE_CHANNEL: 'update-channel',
  UPDATE_CHANNEL_MEMBERS: 'update-channel-members',
  UPDATE_OWN_MESSAGE: 'update-own-message',
  UPDATE_THREAD: 'update-thread',
  UPLOAD_FILE: 'upload-file',
} as const;

export type ChannelOwnCapability =
  (typeof ChannelOwnCapability)[keyof typeof ChannelOwnCapability];

export interface ChannelPushPreferencesResponse {
  chat_level?: string;

  disabled_until?: string;

  chat_preferences?: ChatPreferencesResponse;
}

export interface ChannelResponse {
  /**
   * Channel CID (<type>:<id>)
   */
  cid: string;

  /**
   * Date/time of creation
   */
  created_at: string;

  disabled: boolean;

  /**
   * Whether channel is frozen or not
   */
  frozen: boolean;

  /**
   * Channel unique ID
   */
  id: string;

  /**
   * Type of the channel
   */
  type: string;

  /**
   * Date/time of the last update
   */
  updated_at: string;

  /**
   * Custom data for this object
   */
  custom: Record<string, any>;

  /**
   * Whether auto translation is enabled or not
   */
  auto_translation_enabled?: boolean;

  /**
   * Language to translate to when auto translation is active
   */
  auto_translation_language?: string;

  /**
   * Whether this channel is blocked by current user or not
   */
  blocked?: boolean;

  /**
   * Cooldown period after sending each message
   */
  cooldown?: number;

  /**
   * Date/time of deletion
   */
  deleted_at?: string;

  /**
   * Whether this channel is hidden by current user or not
   */
  hidden?: boolean;

  /**
   * Date since when the message history is accessible
   */
  hide_messages_before?: string;

  /**
   * Date of the last message sent
   */
  last_message_at?: string;

  /**
   * Number of members in the channel
   */
  member_count?: number;

  /**
   * Number of messages in the channel
   */
  message_count?: number;

  /**
   * Date of mute expiration
   */
  mute_expires_at?: string;

  /**
   * Whether this channel is muted or not
   */
  muted?: boolean;

  /**
   * Team the channel belongs to (multi-tenant only)
   */
  team?: string;

  /**
   * Date of the latest truncation of the channel
   */
  truncated_at?: string;

  /**
   * List of filter tags associated with the channel
   */
  filter_tags?: Array<string>;

  /**
   * List of channel members (max 100)
   */
  members?: Array<ChannelMemberResponse>;

  /**
   * List of channel capabilities of authenticated user
   */
  own_capabilities?: Array<ChannelOwnCapability>;

  config?: ChannelConfigWithInfo;

  created_by?: UserResponse;

  truncated_by?: UserResponse;
}

export interface ChatActivityStatsResponse {
  messages?: MessageStatsResponse;
}

export interface ChatPreferences {
  channel_mentions?: string;

  default_preference?: string;

  direct_mentions?: string;

  distinct_channel_messages?: string;

  group_mentions?: string;

  here_mentions?: string;

  role_mentions?: string;

  thread_replies?: string;
}

export interface ChatPreferencesInput {
  channel_mentions?: 'all' | 'none';

  default_preference?: 'all' | 'none';

  direct_mentions?: 'all' | 'none';

  group_mentions?: 'all' | 'none';

  here_mentions?: 'all' | 'none';

  role_mentions?: 'all' | 'none';

  thread_replies?: 'all' | 'none';
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
  previously_connected_timestamp?: string;

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
  timestamp?: string;

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

  created_at: string;

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

export interface Command {
  /**
   * Arguments help text, shown in commands auto-completion
   */
  args: string;

  /**
   * Description, shown in commands auto-completion
   */
  description: string;

  /**
   * Unique command name
   */
  name: string;

  /**
   * Set name used for grouping commands
   */
  set: string;

  /**
   * Date/time of creation
   */
  created_at?: string;

  /**
   * Date/time of the last update
   */
  updated_at?: string;
}

export interface CompositeRecordingResponse {
  status: string;
}

export interface ConnectUserDetailsRequest {
  id: string;

  image?: string;

  invisible?: boolean;

  language?: string;

  name?: string;

  custom?: Record<string, any>;

  privacy_settings?: PrivacySettingsResponse;
}

export interface ConnectedEvent {
  /**
   * The connection_id for this client
   */
  connection_id: string;

  created_at: string;

  me: OwnUserResponse;

  /**
   * The type of event: "connection.ok" in this case
   */
  type: string;
}

export interface ConnectionErrorEvent {
  connection_id: string;

  created_at: string;

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

  start_ts: string;
}

export interface CreateBlockListRequest {
  /**
   * Block list name
   */
  name: string;

  /**
   * List of words to block
   */
  words: Array<string>;

  is_confusable_folding_enabled?: boolean;

  is_leet_check_enabled?: boolean;

  is_plural_check_enabled?: boolean;

  is_substring_matching_enabled?: boolean;

  owner_user_id?: string;

  team?: string;

  /**
   * Block list type. One of: regex, domain, domain_allowlist, email, email_allowlist, word
   */

  type?:
    | 'regex'
    | 'domain'
    | 'domain_allowlist'
    | 'email'
    | 'email_allowlist'
    | 'word';
}

export interface CreateBlockListResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  blocklist?: BlockListResponse;
}

export interface CreateDeviceRequest {
  /**
   * Device ID
   */
  id: string;

  /**
   * Push provider
   */

  push_provider: 'firebase' | 'apn' | 'huawei' | 'xiaomi';

  /**
   * Stable physical device identifier used to deduplicate pushes across push providers (e.g. APNs VoIP and Firebase on the same iOS device). Distinct from 'id', which is the push token.
   */
  hardware_id?: string;

  /**
   * Push provider name
   */
  push_provider_name?: string;

  /**
   * When true the token is for Apple VoIP push notifications
   */
  voip_token?: boolean;
}

export interface CreateGuestRequest {
  user: UserRequest;
}

export interface CreateGuestResponse {
  /**
   * the access token to authenticate the user
   */
  access_token: string;

  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  user: UserResponse;
}

export interface CreatePollOptionRequest {
  /**
   * Option text
   */
  text: string;

  custom?: Record<string, any>;
}

export interface CreatePollRequest {
  /**
   * The name of the poll
   */
  name: string;

  /**
   * Indicates whether users can suggest user defined answers
   */
  allow_answers?: boolean;

  allow_user_suggested_options?: boolean;

  /**
   * A description of the poll
   */
  description?: string;

  /**
   * Indicates whether users can cast multiple votes
   */
  enforce_unique_vote?: boolean;

  id?: string;

  /**
   * Indicates whether the poll is open for voting
   */
  is_closed?: boolean;

  /**
   * Indicates the maximum amount of votes a user can cast
   */
  max_votes_allowed?: number;

  voting_visibility?: 'anonymous' | 'public';

  options?: Array<PollOptionInput>;

  custom?: Record<string, any>;
}

export interface CreateUserGroupRequest {
  /**
   * The user friendly name of the user group
   */
  name: string;

  /**
   * An optional description for the group
   */
  description?: string;

  /**
   * Optional user group ID. If not provided, a UUID v7 will be generated
   */
  id?: string;

  /**
   * Optional team ID to scope the group to a team
   */
  team_id?: string;

  /**
   * Optional initial list of user IDs to add as members
   */
  member_ids?: Array<string>;
}

export interface CreateUserGroupResponse {
  duration: string;

  user_group?: UserGroupResponse;
}

export interface Credentials {
  token: string;

  ice_servers: Array<ICEServerResponse>;

  server: SFUResponse;
}

export interface CustomVideoEvent {
  call_cid: string;

  created_at: string;

  /**
   * Custom data for this object
   */
  custom: Record<string, any>;

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

export interface DeliveryReceiptsResponse {
  enabled: boolean;
}

export interface DeviceResponse {
  /**
   * Date/time of creation
   */
  created_at: string;

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

export interface DraftPayloadResponse {
  /**
   * Message ID is unique string identifier of the message
   */
  id: string;

  /**
   * Text of the message
   */
  text: string;

  custom: Record<string, any>;

  /**
   * Contains HTML markup of the message
   */
  html?: string;

  /**
   * MML content of the message
   */
  mml?: string;

  /**
   * ID of parent message (thread)
   */
  parent_id?: string;

  /**
   * Identifier of the poll to include in the message
   */
  poll_id?: string;

  quoted_message_id?: string;

  /**
   * Whether thread reply should be shown in the channel as well
   */
  show_in_channel?: boolean;

  /**
   * Whether message is silent or not
   */
  silent?: boolean;

  /**
   * Contains type of the message. One of: regular, system
   */
  type?: string;

  /**
   * Array of message attachments
   */
  attachments?: Array<Attachment>;

  /**
   * List of mentioned users
   */
  mentioned_users?: Array<UserResponse>;
}

export interface DraftResponse {
  channel_cid: string;

  created_at: string;

  message: DraftPayloadResponse;

  parent_id?: string;

  channel?: ChannelResponse;

  parent_message?: MessageResponse;

  quoted_message?: MessageResponse;
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

  started_at: string;

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

export interface EndCallRequest {}

export interface EndCallResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface FeedsPreferences {
  /**
   * Push notification preference for comments on user's activities. One of: all, none
   */

  comment?: 'all' | 'none';

  /**
   * Push notification preference for mentions in comments. One of: all, none
   */

  comment_mention?: 'all' | 'none';

  /**
   * Push notification preference for reactions on comments. One of: all, none
   */

  comment_reaction?: 'all' | 'none';

  /**
   * Push notification preference for replies to comments. One of: all, none
   */

  comment_reply?: 'all' | 'none';

  /**
   * Push notification preference for new followers. One of: all, none
   */

  follow?: 'all' | 'none';

  /**
   * Push notification preference for mentions in activities. One of: all, none
   */

  mention?: 'all' | 'none';

  /**
   * Push notification preference for reactions on user's activities or comments. One of: all, none
   */

  reaction?: 'all' | 'none';

  /**
   * Push notification preferences for custom activity types. Map of activity type to preference (all or none)
   */
  custom_activity_types?: Record<string, string>;
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

export interface Field {
  short: boolean;

  title: string;

  value: string;
}

export interface FileUploadConfig {
  size_limit: number;

  allowed_file_extensions: Array<string>;

  allowed_mime_types: Array<string>;

  blocked_file_extensions: Array<string>;

  blocked_mime_types: Array<string>;
}

export interface FileUploadRequest {
  /**
   * file field
   */
  file?: string;

  user?: OnlyUserID;
}

export interface FileUploadResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  /**
   * URL to the uploaded asset. Should be used to put to `asset_url` attachment field
   */
  file?: string;

  /**
   * URL of the file thumbnail for supported file formats. Should be put to `thumb_url` attachment field
   */
  thumb_url?: string;
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

export interface FullUserResponse {
  banned: boolean;

  created_at: string;

  id: string;

  invisible: boolean;

  language: string;

  online: boolean;

  role: string;

  shadow_banned: boolean;

  total_unread_count: number;

  unread_channels: number;

  unread_count: number;

  unread_threads: number;

  updated_at: string;

  blocked_user_ids: Array<string>;

  channel_mutes: Array<ChannelMute>;

  devices: Array<DeviceResponse>;

  mutes: Array<UserMuteResponse>;

  teams: Array<string>;

  custom: Record<string, any>;

  avg_response_time?: number;

  ban_expires?: string;

  deactivated_at?: string;

  deleted_at?: string;

  image?: string;

  last_active?: string;

  name?: string;

  revoke_tokens_issued_before?: string;

  latest_hidden_channels?: Array<string>;

  privacy_settings?: PrivacySettingsResponse;

  teams_role?: Record<string, string>;
}

export interface GeofenceSettingsRequest {
  names?: Array<string>;
}

export interface GeofenceSettingsResponse {
  names: Array<string>;
}

export interface GetApplicationResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  app: AppResponseFields;
}

export interface GetBlockedUsersResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  /**
   * Array of blocked user object
   */
  blocks: Array<BlockedUserResponse>;
}

export interface GetCallParticipantSessionMetricsResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  is_publisher?: boolean;

  is_subscriber?: boolean;

  joined_at?: string;

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

  session?: CallSessionResponse;
}

export interface GetCallResponse {
  duration: string;

  members: Array<MemberResponse>;

  own_capabilities: Array<OwnCapability>;

  call: CallResponse;

  membership?: MemberResponse;
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

export interface GetOGResponse {
  duration: string;

  custom: Record<string, any>;

  /**
   * URL of detected video or audio
   */
  asset_url?: string;

  author_icon?: string;

  /**
   * og:site
   */
  author_link?: string;

  /**
   * og:site_name
   */
  author_name?: string;

  color?: string;

  fallback?: string;

  footer?: string;

  footer_icon?: string;

  /**
   * URL of detected image
   */
  image_url?: string;

  /**
   * extracted url from the text
   */
  og_scrape_url?: string;

  original_height?: number;

  original_width?: number;

  pretext?: string;

  /**
   * og:description
   */
  text?: string;

  /**
   * URL of detected thumb image
   */
  thumb_url?: string;

  /**
   * og:title
   */
  title?: string;

  /**
   * og:url
   */
  title_link?: string;

  /**
   * Attachment type, could be empty, image, audio or video
   */
  type?: string;

  actions?: Array<Action>;

  fields?: Array<Field>;

  giphy?: Images;
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

  data?: CallRequest;
}

export interface GetOrCreateCallResponse {
  created: boolean;

  duration: string;

  members: Array<MemberResponse>;

  own_capabilities: Array<OwnCapability>;

  call: CallResponse;

  membership?: MemberResponse;
}

export interface GetUserGroupResponse {
  duration: string;

  user_group?: UserGroupResponse;
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

  created_at: string;

  custom: Record<string, any>;

  type: string;

  cid?: string;

  received_at?: string;

  me?: OwnUserResponse;
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

export interface ImageData {
  frames: string;

  height: string;

  size: string;

  url: string;

  width: string;
}

export interface ImageSize {
  /**
   * Crop mode. One of: top, bottom, left, right, center
   */
  crop?: string;

  /**
   * Target image height
   */
  height?: number;

  /**
   * Resize method. One of: clip, crop, scale, fill
   */
  resize?: string;

  /**
   * Target image width
   */
  width?: number;
}

export interface ImageUploadRequest {
  file?: string;

  /**
   * field with JSON-encoded array of image size configurations
   */
  upload_sizes?: Array<ImageSize>;

  user?: OnlyUserID;
}

export interface ImageUploadResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  file?: string;

  thumb_url?: string;

  /**
   * Array of image size configurations
   */
  upload_sizes?: Array<ImageSize>;
}

export interface Images {
  fixed_height: ImageData;

  fixed_height_downsampled: ImageData;

  fixed_height_still: ImageData;

  fixed_width: ImageData;

  fixed_width_downsampled: ImageData;

  fixed_width_still: ImageData;

  original: ImageData;
}

export interface ImportBlockListRequest {
  items: Array<string>;

  chunk_size?: number;
}

export interface ImportBlockListResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  task_id: string;
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

  created_at: string;

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

  created_at: string;

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

  created_at: string;

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

  data?: CallRequest;
}

export interface JoinCallResponse {
  created: boolean;

  duration: string;

  members: Array<MemberResponse>;

  own_capabilities: Array<OwnCapability>;

  call: CallResponse;

  credentials: Credentials;

  stats_options: StatsOptions;

  membership?: MemberResponse;
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

  created_at: string;

  user: UserResponse;

  /**
   * The type of event: "call.kicked_user" in this case
   */
  type: string;

  kicked_by_user?: UserResponse;
}

export interface LabelThresholds {
  /**
   * Threshold for automatic message block
   */
  block?: number;

  /**
   * Threshold for automatic message flag
   */
  flag?: number;
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

export interface ListBlockListResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  blocklists: Array<BlockListResponse>;

  next_cursor?: string;
}

export interface ListDevicesResponse {
  duration: string;

  /**
   * List of devices
   */
  devices: Array<DeviceResponse>;
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

export interface ListUserGroupsResponse {
  duration: string;

  /**
   * List of user groups
   */
  user_groups: Array<UserGroupResponse>;
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
  created_at: string;

  /**
   * Date/time of the last update
   */
  updated_at: string;

  user_id: string;

  /**
   * Custom member response data
   */
  custom: Record<string, any>;

  user: UserResponse;

  /**
   * Date/time of deletion
   */
  deleted_at?: string;

  role?: string;
}

export interface MessageResponse {
  /**
   * Channel unique identifier in <type>:<id> format
   */
  cid: string;

  /**
   * Date/time of creation
   */
  created_at: string;

  deleted_reply_count: number;

  /**
   * Contains HTML markup of the message. Can only be set when using server-side API
   */
  html: string;

  /**
   * Message ID is unique string identifier of the message
   */
  id: string;

  /**
   * Whether the message mentioned the channel tag
   */
  mentioned_channel: boolean;

  /**
   * Whether the message mentioned online users with @here tag
   */
  mentioned_here: boolean;

  /**
   * Whether message is pinned or not
   */
  pinned: boolean;

  /**
   * Number of replies to this message
   */
  reply_count: number;

  /**
   * Whether the message was shadowed or not
   */
  shadowed: boolean;

  /**
   * Whether message is silent or not
   */
  silent: boolean;

  /**
   * Text of the message. Should be empty if `mml` is provided
   */
  text: string;

  /**
   * Contains type of the message. One of: regular, ephemeral, error, reply, system, deleted
   */
  type: string;

  /**
   * Date/time of the last update
   */
  updated_at: string;

  /**
   * Array of message attachments
   */
  attachments: Array<Attachment>;

  /**
   * List of 10 latest reactions to this message
   */
  latest_reactions: Array<ReactionResponse>;

  /**
   * List of mentioned users
   */
  mentioned_users: Array<UserResponse>;

  /**
   * List of 10 latest reactions of authenticated user to this message
   */
  own_reactions: Array<ReactionResponse>;

  /**
   * A list of user ids that have restricted visibility to the message, if the list is not empty, the message is only visible to the users in the list
   */
  restricted_visibility: Array<string>;

  custom: Record<string, any>;

  /**
   * An object containing number of reactions of each type. Key: reaction type (string), value: number of reactions (int)
   */
  reaction_counts: Record<string, number>;

  /**
   * An object containing scores of reactions of each type. Key: reaction type (string), value: total score of reactions (int)
   */
  reaction_scores: Record<string, number>;

  user: UserResponse;

  /**
   * Contains provided slash command
   */
  command?: string;

  /**
   * Date/time of deletion
   */
  deleted_at?: string;

  deleted_for_me?: boolean;

  message_text_updated_at?: string;

  /**
   * Should be empty if `text` is provided. Can only be set when using server-side API
   */
  mml?: string;

  /**
   * ID of parent message (thread)
   */
  parent_id?: string;

  /**
   * Date when pinned message expires
   */
  pin_expires?: string;

  /**
   * Date when message got pinned
   */
  pinned_at?: string;

  /**
   * Identifier of the poll to include in the message
   */
  poll_id?: string;

  quoted_message_id?: string;

  /**
   * Whether thread reply should be shown in the channel as well
   */
  show_in_channel?: boolean;

  /**
   * List of user group IDs mentioned in the message. Group members who are also channel members will receive push notifications based on their push preferences. Max 10 groups
   */
  mentioned_group_ids?: Array<string>;

  /**
   * List of mentioned user group objects.
   */
  mentioned_groups?: Array<UserGroupResponse>;

  /**
   * List of roles mentioned in the message (e.g. admin, channel_moderator, custom roles). Members with matching roles will receive push notifications based on their push preferences. Max 10 roles
   */
  mentioned_roles?: Array<string>;

  /**
   * List of users who participate in thread
   */
  thread_participants?: Array<UserResponse>;

  draft?: DraftResponse;

  /**
   * Object with translations. Key `language` contains the original language key. Other keys contain translations
   */
  i18n?: Record<string, string>;

  /**
   * Contains image moderation information
   */
  image_labels?: Record<string, Array<string>>;

  member?: ChannelMemberResponse;

  moderation?: ModerationV2Response;

  pinned_by?: UserResponse;

  poll?: PollResponseData;

  quoted_message?: MessageResponse;

  reaction_groups?: Record<string, ReactionGroupResponse>;

  reminder?: ReminderResponseData;

  shared_location?: SharedLocationResponseData;
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

export interface ModerationV2Response {
  action: string;

  original_text: string;

  blocklist_matched?: string;

  platform_circumvented?: boolean;

  semantic_filter_matched?: string;

  blocklists_matched?: Array<string>;

  image_harms?: Array<string>;

  text_harms?: Array<string>;
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

export interface OnlyUserID {
  id: string;
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
  banned: boolean;

  created_at: string;

  id: string;

  invisible: boolean;

  language: string;

  online: boolean;

  role: string;

  total_unread_count: number;

  unread_channels: number;

  unread_count: number;

  unread_threads: number;

  updated_at: string;

  channel_mutes: Array<ChannelMute>;

  devices: Array<DeviceResponse>;

  mutes: Array<UserMuteResponse>;

  teams: Array<string>;

  custom: Record<string, any>;

  avg_response_time?: number;

  deactivated_at?: string;

  deleted_at?: string;

  image?: string;

  last_active?: string;

  name?: string;

  revoke_tokens_issued_before?: string;

  blocked_user_ids?: Array<string>;

  latest_hidden_channels?: Array<string>;

  privacy_settings?: PrivacySettingsResponse;

  push_preferences?: PushPreferencesResponse;

  teams_role?: Record<string, string>;

  total_unread_count_by_team?: Record<string, number>;
}

export interface ParticipantCountByMinuteResponse {
  first: number;

  last: number;

  max: number;

  min: number;

  start_ts: string;
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

  since: string;

  step_seconds: number;

  until: string;
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

  joined_at?: string;

  left_at?: string;
}

export interface PerSDKUsageReport {
  total: number;

  by_version: Record<string, number>;
}

export interface PermissionRequestEvent {
  call_cid: string;

  created_at: string;

  /**
   * The list of permissions requested by the user
   */
  permissions: Array<string>;

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

export interface PollOptionInput {
  text?: string;

  custom?: Record<string, any>;
}

export interface PollOptionRequest {
  id: string;

  text?: string;

  custom?: Record<string, any>;
}

export interface PollOptionResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  poll_option: PollOptionResponseData;
}

export interface PollOptionResponseData {
  id: string;

  text: string;

  custom: Record<string, any>;
}

export interface PollResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  poll: PollResponseData;
}

export interface PollResponseData {
  allow_answers: boolean;

  allow_user_suggested_options: boolean;

  answers_count: number;

  created_at: string;

  created_by_id: string;

  description: string;

  enforce_unique_vote: boolean;

  id: string;

  name: string;

  updated_at: string;

  vote_count: number;

  voting_visibility: string;

  latest_answers: Array<PollVoteResponseData>;

  options: Array<PollOptionResponseData>;

  own_votes: Array<PollVoteResponseData>;

  custom: Record<string, any>;

  latest_votes_by_option: Record<string, Array<PollVoteResponseData>>;

  vote_counts_by_option: Record<string, number>;

  is_closed?: boolean;

  max_votes_allowed?: number;

  created_by?: UserResponse;
}

export interface PollVoteResponseData {
  created_at: string;

  id: string;

  option_id: string;

  poll_id: string;

  updated_at: string;

  answer_text?: string;

  is_answer?: boolean;

  user_id?: string;

  user?: UserResponse;
}

export interface PollVotesResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  /**
   * Poll votes
   */
  votes: Array<PollVoteResponseData>;

  next?: string;

  prev?: string;
}

export interface PrivacySettingsResponse {
  delivery_receipts?: DeliveryReceiptsResponse;

  read_receipts?: ReadReceiptsResponse;

  typing_indicators?: TypingIndicatorsResponse;
}

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

export interface PublisherStatsResponse {
  total: number;

  unique: number;

  by_track?: Array<TrackStatsResponse>;
}

export interface PushPreferenceInput {
  /**
   * Set the level of call push notifications for the user. One of: all, none, default
   */

  call_level?: 'all' | 'none' | 'default';

  /**
   * Set the push preferences for a specific channel. If empty it sets the default for the user
   */
  channel_cid?: string;

  /**
   * Set the level of chat push notifications for the user. Note: "mentions" is deprecated in favor of "direct_mentions". One of: all, mentions, direct_mentions, all_mentions, none, default
   */

  chat_level?:
    | 'all'
    | 'mentions'
    | 'direct_mentions'
    | 'all_mentions'
    | 'none'
    | 'default';

  /**
   * Disable push notifications till a certain time
   */
  disabled_until?: string;

  /**
   * Set the level of feeds push notifications for the user. One of: all, none, default
   */

  feeds_level?: 'all' | 'none' | 'default';

  /**
   * Remove the disabled until time. (IE stop snoozing notifications)
   */
  remove_disable?: boolean;

  /**
   * The user id for which to set the push preferences. Required when using server side auths, defaults to current user with client side auth.
   */
  user_id?: string;

  chat_preferences?: ChatPreferencesInput;

  feeds_preferences?: FeedsPreferences;
}

export interface PushPreferencesResponse {
  call_level?: string;

  chat_level?: string;

  disabled_until?: string;

  feeds_level?: string;

  chat_preferences?: ChatPreferencesResponse;

  feeds_preferences?: FeedsPreferencesResponse;
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
  filter_conditions?: Record<string, any>;
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
  filter_conditions?: Record<string, any>;
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

  call: CallResponse;

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

  call_ended_at?: string;

  call_started_at?: string;

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
  filter_conditions?: Record<string, any>;
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

  call_ended_at?: string;

  call_started_at?: string;

  data_source?: string;

  end_time?: string;

  generated_at?: string;

  start_time?: string;

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
  filter_conditions?: Record<string, any>;
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
  filter_conditions?: Record<string, any>;
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

export interface QueryPollVotesRequest {
  limit?: number;

  next?: string;

  prev?: string;

  /**
   * Array of sort parameters
   */
  sort?: Array<SortParamRequest>;

  /**
   * Filter to apply to the query
   */
  filter?: Record<string, any>;
}

export interface QueryPollsRequest {
  limit?: number;

  next?: string;

  prev?: string;

  /**
   * Array of sort parameters
   */
  sort?: Array<SortParamRequest>;

  /**
   * Filter to apply to the query
   */
  filter?: Record<string, any>;
}

export interface QueryPollsResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  /**
   * Polls data returned by the query
   */
  polls: Array<PollResponseData>;

  next?: string;

  prev?: string;
}

export interface QueryUsersPayload {
  /**
   * Filter conditions to apply to the query
   */
  filter_conditions: Record<string, any>;

  include_deactivated_users?: boolean;

  limit?: number;

  offset?: number;

  presence?: boolean;

  /**
   * Array of sort parameters
   */
  sort?: Array<SortParamRequest>;
}

export interface QueryUsersResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  /**
   * Array of users as result of filters applied.
   */
  users: Array<FullUserResponse>;
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

export interface ReactionGroupResponse {
  /**
   * Count is the number of reactions of this type.
   */
  count: number;

  /**
   * FirstReactionAt is the time of the first reaction of this type. This is the same also if all reaction of this type are deleted, because if someone will react again with the same type, will be preserved the sorting.
   */
  first_reaction_at: string;

  /**
   * LastReactionAt is the time of the last reaction of this type.
   */
  last_reaction_at: string;

  /**
   * SumScores is the sum of all scores of reactions of this type. Medium allows you to clap articles more than once and shows the sum of all claps from all users. For example, you can send `clap` x5 using `score: 5`.
   */
  sum_scores: number;

  /**
   * The most recent users who reacted with this type, ordered by most recent first.
   */
  latest_reactions_by: Array<ReactionGroupUserResponse>;
}

export interface ReactionGroupUserResponse {
  /**
   * The time when the user reacted.
   */
  created_at: string;

  /**
   * The ID of the user who reacted.
   */
  user_id: string;

  user?: UserResponse;
}

export interface ReactionResponse {
  /**
   * Date/time of creation
   */
  created_at: string;

  /**
   * Message ID
   */
  message_id: string;

  /**
   * Score of the reaction
   */
  score: number;

  /**
   * Type of reaction
   */
  type: string;

  /**
   * Date/time of the last update
   */
  updated_at: string;

  /**
   * User ID
   */
  user_id: string;

  /**
   * Custom data for this object
   */
  custom: Record<string, any>;

  user: UserResponse;
}

export interface ReadReceiptsResponse {
  enabled: boolean;
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

export interface ReminderResponseData {
  channel_cid: string;

  created_at: string;

  message_id: string;

  updated_at: string;

  user_id: string;

  remind_at?: string;

  channel?: ChannelResponse;

  message?: MessageResponse;

  user?: UserResponse;
}

export interface RemoveUserGroupMembersRequest {
  /**
   * List of user IDs to remove
   */
  member_ids: Array<string>;

  team_id?: string;
}

export interface RemoveUserGroupMembersResponse {
  duration: string;

  user_group?: UserGroupResponse;
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

  challenge?: SIPChallengeRequest;

  /**
   * Optional SIP headers as key-value pairs
   */
  sip_headers?: Record<string, string>;
}

export interface ResolveSipInboundResponse {
  duration: string;

  credentials: SipInboundCredentials;

  sip_routing_rule?: SIPInboundRoutingRuleResponse;

  sip_trunk?: SIPTrunkResponse;
}

export interface Response {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
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
}

export interface RingCallResponse {
  duration: string;

  /**
   * List of members ringing notification was sent to
   */
  members_ids: Array<string>;
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

export interface Role {
  /**
   * Date/time of creation
   */
  created_at: string;

  /**
   * Whether this is a custom role or built-in
   */
  custom: boolean;

  /**
   * Unique role name
   */
  name: string;

  /**
   * Date/time of the last update
   */
  updated_at: string;

  /**
   * List of scopes where this role is currently present. `.app` means that role is present in app-level grants
   */
  scopes: Array<string>;
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

  coordinates: CoordinatesResponse;

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
  created_at: string;

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
  updated_at: string;

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

  call_configs?: SIPCallConfigsResponse;

  caller_configs?: SIPCallerConfigsResponse;

  direct_routing_configs?: SIPDirectRoutingRuleCallConfigsResponse;

  pin_protection_configs?: SIPPinProtectionConfigsResponse;

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
  created_at: string;

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
  updated_at: string;

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

export interface SearchRolesResponse {
  duration: string;

  /**
   * Matching roles, sorted ascending by name
   */
  roles: Array<Role>;
}

export interface SearchUserGroupsResponse {
  duration: string;

  /**
   * List of matching user groups
   */
  user_groups: Array<UserGroupResponse>;
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

  time?: string;
}

export interface SharedLocationResponse {
  /**
   * Channel CID
   */
  channel_cid: string;

  /**
   * Date/time of creation
   */
  created_at: string;

  /**
   * Device ID that created the live location
   */
  created_by_device_id: string;

  duration: string;

  /**
   * Latitude coordinate
   */
  latitude: number;

  /**
   * Longitude coordinate
   */
  longitude: number;

  /**
   * Message ID
   */
  message_id: string;

  /**
   * Date/time of the last update
   */
  updated_at: string;

  /**
   * User ID
   */
  user_id: string;

  /**
   * Time when the live location expires
   */
  end_at?: string;

  channel?: ChannelResponse;

  message?: MessageResponse;
}

export interface SharedLocationResponseData {
  channel_cid: string;

  created_at: string;

  created_by_device_id: string;

  latitude: number;

  longitude: number;

  message_id: string;

  updated_at: string;

  user_id: string;

  end_at?: string;

  channel?: ChannelResponse;

  message?: MessageResponse;
}

export interface SharedLocationsResponse {
  duration: string;

  active_live_locations: Array<SharedLocationResponseData>;
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

export interface TargetResolution {
  height: number;

  width: number;

  bitrate?: number;
}

export interface Thresholds {
  explicit?: LabelThresholds;

  spam?: LabelThresholds;

  toxic?: LabelThresholds;
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

export interface TypingIndicatorsResponse {
  enabled: boolean;
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

export interface UnblockUsersRequest {
  blocked_user_id: string;
}

export interface UnblockUsersResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;
}

export interface UnblockedUserEvent {
  call_cid: string;

  created_at: string;

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

export interface UpdateBlockListRequest {
  is_confusable_folding_enabled?: boolean;

  is_leet_check_enabled?: boolean;

  is_plural_check_enabled?: boolean;

  is_substring_matching_enabled?: boolean;

  owner_user_id?: string;

  team?: string;

  /**
   * List of words to block
   */
  words?: Array<string>;
}

export interface UpdateBlockListResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  blocklist?: BlockListResponse;
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
  starts_at?: string;

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

  call: CallResponse;

  membership?: MemberResponse;
}

export interface UpdateLiveLocationRequest {
  /**
   * Live location ID
   */
  message_id: string;

  /**
   * Time when the live location expires
   */
  end_at?: string;

  /**
   * Latitude coordinate
   */
  latitude?: number;

  /**
   * Longitude coordinate
   */
  longitude?: number;
}

export interface UpdatePollOptionRequest {
  /**
   * Option ID
   */
  id: string;

  /**
   * Option text
   */
  text: string;

  custom?: Record<string, any>;
}

export interface UpdatePollPartialRequest {
  /**
   * Array of field names to unset
   */
  unset?: Array<string>;

  /**
   * Sets new field values
   */
  set?: Record<string, any>;
}

export interface UpdatePollRequest {
  /**
   * Poll ID
   */
  id: string;

  /**
   * Poll name
   */
  name: string;

  /**
   * Allow answers
   */
  allow_answers?: boolean;

  /**
   * Allow user suggested options
   */
  allow_user_suggested_options?: boolean;

  /**
   * Poll description
   */
  description?: string;

  /**
   * Enforce unique vote
   */
  enforce_unique_vote?: boolean;

  /**
   * Is closed
   */
  is_closed?: boolean;

  /**
   * Max votes allowed
   */
  max_votes_allowed?: number;

  /**
   * Voting visibility
   */

  voting_visibility?: 'anonymous' | 'public';

  /**
   * Poll options
   */
  options?: Array<PollOptionRequest>;

  custom?: Record<string, any>;
}

export interface UpdateUserGroupRequest {
  /**
   * The new description for the group
   */
  description?: string;

  /**
   * The new name of the user group
   */
  name?: string;

  team_id?: string;
}

export interface UpdateUserGroupResponse {
  duration: string;

  user_group?: UserGroupResponse;
}

export interface UpdateUserPartialRequest {
  /**
   * User ID to update
   */
  id: string;

  unset?: Array<string>;

  set?: Record<string, any>;
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

export interface UpdateUsersPartialRequest {
  users: Array<UpdateUserPartialRequest>;
}

export interface UpdateUsersRequest {
  /**
   * Object containing users
   */
  users: Record<string, UserRequest>;
}

export interface UpdateUsersResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  membership_deletion_task_id: string;

  /**
   * Object containing users
   */
  users: Record<string, FullUserResponse>;
}

export interface UpdatedCallPermissionsEvent {
  call_cid: string;

  created_at: string;

  /**
   * The capabilities of the current user
   */
  own_capabilities: Array<OwnCapability>;

  user: UserResponse;

  /**
   * The type of event: "call.permissions_updated" in this case
   */
  type: string;
}

export interface UpsertPushPreferencesRequest {
  /**
   * A list of push preferences for channels, calls, or the user.
   */
  preferences: Array<PushPreferenceInput>;
}

export interface UpsertPushPreferencesResponse {
  /**
   * Duration of the request in milliseconds
   */
  duration: string;

  /**
   * The channel specific push notification preferences, only returned for channels you've edited.
   */
  user_channel_preferences: Record<
    string,
    Record<string, ChannelPushPreferencesResponse | null>
  >;

  /**
   * The user preferences, always returned regardless if you edited it
   */
  user_preferences: Record<string, PushPreferencesResponse>;
}

export interface UserBannedEvent {
  /**
   * Date/time of creation
   */
  created_at: string;

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
  expiration?: string;

  /**
   * The reason for the ban
   */
  reason?: string;

  received_at?: string;

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
  created_at: string;

  custom: Record<string, any>;

  user: UserResponseCommonFields;

  /**
   * The type of event: "user.deactivated" in this case
   */
  type: string;

  received_at?: string;

  created_by?: UserResponseCommonFields;
}

export interface UserDeletedEvent {
  /**
   * Date/time of creation
   */
  created_at: string;

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

  received_at?: string;
}

export interface UserFeedbackReport {
  unreported_count: number;

  count_by_rating: Record<string, number>;
}

export interface UserFeedbackReportResponse {
  daily: Array<DailyAggregateUserFeedbackReportResponse>;
}

export interface UserGroupMember {
  app_pk: number;

  created_at: string;

  group_id: string;

  is_admin: boolean;

  user_id: string;
}

export interface UserGroupResponse {
  created_at: string;

  id: string;

  name: string;

  updated_at: string;

  created_by?: string;

  description?: string;

  team_id?: string;

  members?: Array<UserGroupMember>;
}

export interface UserMuteResponse {
  created_at: string;

  updated_at: string;

  expires?: string;

  target?: UserResponse;

  user?: UserResponse;
}

export interface UserPresenceChangedEvent {
  /**
   * Date/time of creation
   */
  created_at: string;

  custom: Record<string, any>;

  user: UserResponseCommonFields;

  /**
   * The type of event: "user.presence.changed" in this case
   */
  type: string;

  received_at?: string;
}

export interface UserRatingReportResponse {
  average: number;

  count: number;
}

export interface UserReactivatedEvent {
  /**
   * Date/time of creation
   */
  created_at: string;

  custom: Record<string, any>;

  user: UserResponseCommonFields;

  /**
   * The type of event: "user.reactivated" in this case
   */
  type: string;

  received_at?: string;

  created_by?: UserResponseCommonFields;
}

export interface UserRequest {
  /**
   * User ID
   */
  id: string;

  /**
   * User's profile image URL
   */
  image?: string;

  invisible?: boolean;

  language?: string;

  /**
   * Optional name of user
   */
  name?: string;

  /**
   * Custom user data
   */
  custom?: Record<string, any>;

  privacy_settings?: PrivacySettingsResponse;
}

export interface UserResponse {
  /**
   * Whether a user is banned or not
   */
  banned: boolean;

  /**
   * Date/time of creation
   */
  created_at: string;

  /**
   * Unique user identifier
   */
  id: string;

  /**
   * Preferred language of a user
   */
  language: string;

  /**
   * Whether a user online or not
   */
  online: boolean;

  /**
   * Determines the set of user permissions
   */
  role: string;

  /**
   * Date/time of the last update
   */
  updated_at: string;

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
  deactivated_at?: string;

  /**
   * Date/time of deletion
   */
  deleted_at?: string;

  image?: string;

  /**
   * Date of last activity
   */
  last_active?: string;

  /**
   * Optional name of user
   */
  name?: string;

  /**
   * Revocation date for tokens
   */
  revoke_tokens_issued_before?: string;

  teams_role?: Record<string, string>;
}

export interface UserResponseCommonFields {
  banned: boolean;

  created_at: string;

  id: string;

  language: string;

  online: boolean;

  role: string;

  updated_at: string;

  blocked_user_ids: Array<string>;

  teams: Array<string>;

  custom: Record<string, any>;

  avg_response_time?: number;

  deactivated_at?: string;

  deleted_at?: string;

  image?: string;

  last_active?: string;

  name?: string;

  revoke_tokens_issued_before?: string;

  teams_role?: Record<string, string>;
}

export interface UserResponsePrivacyFields {
  banned: boolean;

  created_at: string;

  id: string;

  language: string;

  online: boolean;

  role: string;

  updated_at: string;

  blocked_user_ids: Array<string>;

  teams: Array<string>;

  custom: Record<string, any>;

  avg_response_time?: number;

  deactivated_at?: string;

  deleted_at?: string;

  image?: string;

  invisible?: boolean;

  last_active?: string;

  name?: string;

  revoke_tokens_issued_before?: string;

  privacy_settings?: PrivacySettingsResponse;

  teams_role?: Record<string, string>;
}

export interface UserUnbannedEvent {
  /**
   * Date/time of creation
   */
  created_at: string;

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

  received_at?: string;

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
  created_at: string;

  custom: Record<string, any>;

  user: UserResponsePrivacyFields;

  /**
   * The type of event: "user.updated" in this case
   */
  type: string;

  received_at?: string;
}

export interface VideoReactionOverTimeResponse {
  by_minute?: Array<CountByMinuteResponse>;
}

export interface VideoReactionResponse {
  type: string;

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

export interface WHIPIngress {
  /**
   * URL for a new whip input, every time a new link is created
   */
  address: string;
}

export interface WSAuthMessage {
  /**
   * JWT token for authentication
   */
  token: string;

  user_details: ConnectUserDetailsRequest;

  /**
   * List of products to subscribe to. One of: chat, video, feeds
   */
  products?: Array<string>;
}

export type WSCallEvent =
  | ({ type: 'call.dtmf' } & CallDTMFEvent)
  | ({ type: 'ingress.error' } & IngressErrorEvent)
  | ({ type: 'ingress.started' } & IngressStartedEvent)
  | ({ type: 'ingress.stopped' } & IngressStoppedEvent);

export type WSClientEvent =
  | ({ type: 'app.updated' } & AppUpdatedEvent)
  | ({ type: 'health.check' } & HealthCheckEvent)
  | ({ type: 'user.banned' } & UserBannedEvent)
  | ({ type: 'user.deactivated' } & UserDeactivatedEvent)
  | ({ type: 'user.deleted' } & UserDeletedEvent)
  | ({ type: 'user.presence.changed' } & UserPresenceChangedEvent)
  | ({ type: 'user.reactivated' } & UserReactivatedEvent)
  | ({ type: 'user.unbanned' } & UserUnbannedEvent)
  | ({ type: 'user.updated' } & UserUpdatedEvent);

export type WSEvent =
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

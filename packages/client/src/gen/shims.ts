export interface AggregatedStats {
  publisher_aggregate_stats?: PublisherAggregateStats;
  turn?: TURNAggregatedStats;
}

export interface CallEvent {
  category?: string;
  component?: string;
  description: string;
  end_timestamp: number;
  internal: boolean;
  issue_tags?: Array<string>;
  kind: string;
  severity: number;
  timestamp: number;
  type: string;
}

export interface CallTimeline {
  events: Array<CallEvent>;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Count {
  approximate: boolean;
  value: number;
}

export interface FPSStats {
  average_fps: number;
  tracked: number;
}

export interface GeolocationResult {
  accuracy_radius: number;
  city: string;
  continent: string;
  continent_code: string;
  country: string;
  country_iso_code: string;
  latitude: number;
  longitude: number;
  subdivision: string;
  subdivision_iso_code: string;
}

export interface GetCallStatsResponse {
  aggregated?: AggregatedStats;
  average_connection_time?: number;
  call_duration_seconds: number;
  call_status: string;
  call_timeline?: CallTimeline;
  duration: string;
  is_truncated_report: boolean;
  jitter?: TimeStats;
  latency?: TimeStats;
  max_freezes_duration_seconds: number;
  max_participants: number;
  max_total_quality_limitation_duration_seconds: number;
  participant_report: Array<UserStats>;
  publishing_participants: number;
  quality_score: number;
  sfu_count: number;
  sfus: Array<SFULocationResponse>;
}

export interface MediaPubSubHint {
  audio_published: boolean;
  audio_subscribed: boolean;
  video_published: boolean;
  video_subscribed: boolean;
}

export interface PublishedTrackInfo {
  codec_mime_type?: string;
  duration_seconds?: number;
  track_type?: string;
}

export interface PublisherAggregateStats {
  by_track_type?: { [key: string]: Count };
  total?: Count;
}

export interface SFULocationResponse {
  coordinates: Coordinates;
  datacenter: string;
  id: string;
  location: Location;
}

export interface Subsession {
  ended_at: number;
  joined_at: number;
  pub_sub_hint?: MediaPubSubHint;
  sfu_id: string;
}

export interface TimeStats {
  average_seconds: number;
  max_seconds: number;
}

export interface TURNAggregatedStats {
  tcp?: Count;
  total?: Count;
}

export interface UserInfoResponse {
  custom: { [key: string]: any };
  id: string;
  image: string;
  name: string;
  roles: Array<string>;
}

export interface UserSessionStats {
  average_connection_time?: number;
  browser?: string;
  browser_version?: string;
  current_ip?: string;
  current_sfu?: string;
  device_model?: string;
  device_version?: string;
  distance_to_sfu_kilometers?: number;
  fps?: FPSStats;
  freeze_duration_seconds: number;
  geolocation?: GeolocationResult;
  group: string;
  jitter?: TimeStats;
  latency?: TimeStats;
  max_fir_per_second?: number;
  max_freeze_fraction: number;
  max_freezes_duration_seconds: number;
  max_freezes_per_second?: number;
  max_nack_per_second?: number;
  max_pli_per_second?: number;
  max_publishing_video_quality?: VideoQuality;
  max_receiving_video_quality?: VideoQuality;
  min_event_ts: number;
  os?: string;
  os_version?: string;
  packet_loss_fraction: number;
  pub_sub_hints?: MediaPubSubHint;
  published_tracks?: Array<PublishedTrackInfo>;
  publisher_jitter?: TimeStats;
  publisher_latency?: TimeStats;
  publisher_noise_cancellation_seconds?: number;
  publisher_packet_loss_fraction: number;
  publisher_quality_limitation_fraction?: number;
  publisher_video_quality_limitation_duration_seconds?: {
    [key: string]: number;
  };
  publishing_audio_codec?: string;
  publishing_duration_seconds: number;
  publishing_video_codec?: string;
  quality_score: number;
  receiving_audio_codec?: string;
  receiving_duration_seconds: number;
  receiving_video_codec?: string;
  sdk?: string;
  sdk_version?: string;
  session_id: string;
  subscriber_jitter?: TimeStats;
  subscriber_latency?: TimeStats;
  subscriber_video_quality_throttled_duration_seconds?: number;
  subsessions?: Array<Subsession>;
  timeline?: CallTimeline;
  total_pixels_in: number;
  total_pixels_out: number;
  truncated?: boolean;
  webrtc_version?: string;
}

export interface UserStats {
  feedback?: string;
  info: UserInfoResponse;
  min_event_ts: number;
  rating?: number;
  session_stats: Array<UserSessionStats>;
}

export interface VideoQuality {
  resolution?: { width: number; height: number };
  usage_type?: string;
}

// HLS playback stats (`POST /video/call/{type}/{id}/hls_stats`). Hand-written
// until the endpoint ships in the OpenAPI spec (GetStream/chat#20246); replace
// them with the generated models then.

/** `playback` of the join response, with the HLS stats token. */
export interface HLSPlaybackResponseShim {
  /** Sent as `stats_token` on HLS stats reports. Empty when it couldn't be signed. */
  stats_token?: string;
}

/** `stats_options` of the join response, with the HLS stats settings. */
export interface HLSStatsOptionsShim {
  /** Whether to send HLS stats reports. Missing means yes. */
  enable_hls_stats?: boolean;
  /** How often to send HLS stats reports, in milliseconds. */
  reporting_hls_interval_ms?: number;
}

/** Extra fields of the join request. */
export interface JoinCallRequestShim {
  /**
   * Playback modes other than WebRTC that the client can play. One of: hls.
   * When empty, the response always contains SFU credentials.
   */
  playback_capabilities?: Array<string>;
  /** The SDK's session ID for this call, shared by its WebRTC and HLS sessions. */
  unified_session_id?: string;
}

/** A full snapshot of the HLS player's stats. */
export interface HLSPlaybackStats {
  watch_duration_ms: number;
  stall_count: number;
  stall_duration_ms: number;
  max_stall_duration_ms: number;
  dropped_frames?: number;
  bitrate_kbps?: number;
  buffer_length_ms?: number;
  live_latency_ms?: number;
  width?: number;
  height?: number;
}

/** A player event since the previous report. */
export interface HLSPlayerEvent {
  type: string;
  /** Unix time in milliseconds. */
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface ReportHLSStatsRequest {
  stats_token: string;
  call_session_id: string;
  user_session_id: string;
  unified_session_id: string;
  type: 'started' | 'stats' | 'ended';
  /** Unix time in milliseconds. */
  timestamp?: number;
  sdk?: string;
  sdk_version?: string;
  browser?: string;
  browser_version?: string;
  os?: string;
  os_version?: string;
  end_reason?: 'left' | 'error';
  error_code?: string;
  stats?: HLSPlaybackStats;
  /** At most 100. */
  events?: HLSPlayerEvent[];
}

// HLS playback grant: in the generated models on main, not yet on v1.

/** The HLS playback a join response grants instead of SFU credentials. */
export interface PlaybackResponse {
  /** URL of the HLS playlist to play */
  playlist_url: string;
  /** Why this mode was chosen. One of: percentage, hint */
  reason: 'percentage' | 'hint';
  /** Playback mode. One of: hls */
  type: 'hls';
}

/** `JoinCallResponse` with the HLS playback grant. */
export interface JoinCallResponseShim {
  playback?: PlaybackResponse;
}

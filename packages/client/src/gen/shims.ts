import type {
  DeviceResponse,
  PrivacySettingsResponse,
  UserResponse,
} from './coordinator';

export interface Response {
  /** Duration of the request in milliseconds */
  duration: string;
}

export interface UserRequest {
  /** User ID */
  id: string;
  /** User's profile image URL */
  image?: string;
  invisible?: boolean;
  language?: string;
  /** Optional name of user */
  name?: string;
  /** Custom user data */
  custom?: Record<string, any>;
  privacy_settings?: PrivacySettingsResponse;
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

export interface WSAuthMessage {
  /** JWT token for authentication */
  token: string;
  user_details: ConnectUserDetailsRequest;
  /**
   * Channel-member custom keys to project onto message.member for messages
   * this connection receives (opt-in; capped, off by default).
   */
  member_custom_include?: Array<string>;
  /** List of products to subscribe to. One of: chat, video, feeds */
  products?: Array<'chat' | 'video' | 'feeds'>;
}

export interface CreateDeviceRequest {
  /** Device ID */
  id: string;
  /** Push provider */
  push_provider: 'firebase' | 'apn' | 'huawei' | 'xiaomi';
  /**
   * Stable physical device identifier used to deduplicate pushes across push
   * providers (e.g. APNs VoIP and Firebase on the same iOS device). Distinct
   * from 'id', which is the push token.
   */
  hardware_id?: string;
  /** Push provider name */
  push_provider_name?: string;
  /** When true the token is for Apple VoIP push notifications */
  voip_token?: boolean;
}

export interface ListDevicesResponse {
  duration: string;
  /** List of devices */
  devices: Array<DeviceResponse>;
}

export interface CreateGuestRequest {
  /** User request object */
  user: UserRequest;
}

export interface CreateGuestResponse {
  /** the access token to authenticate the user */
  access_token: string;
  /** Duration of the request in milliseconds */
  duration: string;
  /** User response object */
  user: UserResponse;
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

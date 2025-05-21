import { VideoDimension } from './coordinator';

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
  resolution?: VideoDimension;
  usage_type?: string;
}

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
 * @interface APNS
 */
export interface APNS {
  /**
   *
   * @type {string}
   * @memberof APNS
   */
  body: string;
  /**
   *
   * @type {string}
   * @memberof APNS
   */
  title: string;
}
/**
 *
 * @export
 * @interface APNSRequest
 */
export interface APNSRequest {
  /**
   *
   * @type {string}
   * @memberof APNSRequest
   */
  body?: string;
  /**
   *
   * @type {string}
   * @memberof APNSRequest
   */
  title?: string;
}
/**
 *
 * @export
 * @interface AudioSettings
 */
export interface AudioSettings {
  /**
   *
   * @type {boolean}
   * @memberof AudioSettings
   */
  access_request_enabled: boolean;
  /**
   *
   * @type {string}
   * @memberof AudioSettings
   */
  default_device: AudioSettingsDefaultDeviceEnum;
  /**
   *
   * @type {boolean}
   * @memberof AudioSettings
   */
  mic_default_on: boolean;
  /**
   *
   * @type {boolean}
   * @memberof AudioSettings
   */
  opus_dtx_enabled: boolean;
  /**
   *
   * @type {boolean}
   * @memberof AudioSettings
   */
  redundant_coding_enabled: boolean;
  /**
   *
   * @type {boolean}
   * @memberof AudioSettings
   */
  speaker_default_on: boolean;
}

/**
 * @export
 */
export const AudioSettingsDefaultDeviceEnum = {
  SPEAKER: 'speaker',
  EARPIECE: 'earpiece',
} as const;
export type AudioSettingsDefaultDeviceEnum =
  (typeof AudioSettingsDefaultDeviceEnum)[keyof typeof AudioSettingsDefaultDeviceEnum];

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
 * @interface AzureRequest
 */
export interface AzureRequest {
  /**
   *
   * @type {string}
   * @memberof AzureRequest
   */
  abs_account_name: string;
  /**
   *
   * @type {string}
   * @memberof AzureRequest
   */
  abs_client_id: string;
  /**
   *
   * @type {string}
   * @memberof AzureRequest
   */
  abs_client_secret: string;
  /**
   *
   * @type {string}
   * @memberof AzureRequest
   */
  abs_tenant_id: string;
}
/**
 *
 * @export
 * @interface BackstageSettings
 */
export interface BackstageSettings {
  /**
   *
   * @type {boolean}
   * @memberof BackstageSettings
   */
  enabled: boolean;
}
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
}
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
   * Duration of the request in human-readable format
   * @type {string}
   * @memberof BlockUserResponse
   */
  duration: string;
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
 *
 * @export
 * @interface CallRequest
 */
export interface CallRequest {
  /**
   *
   * @type {UserRequest}
   * @memberof CallRequest
   */
  created_by?: UserRequest;
  /**
   *
   * @type {string}
   * @memberof CallRequest
   */
  created_by_id?: string;
  /**
   *
   * @type {object}
   * @memberof CallRequest
   */
  custom?: object;
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
   * @type {object}
   * @memberof CallResponse
   */
  custom: object;
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
   * @type {AudioSettings}
   * @memberof CallSettingsResponse
   */
  audio: AudioSettings;
  /**
   *
   * @type {BackstageSettings}
   * @memberof CallSettingsResponse
   */
  backstage: BackstageSettings;
  /**
   *
   * @type {BroadcastSettingsResponse}
   * @memberof CallSettingsResponse
   */
  broadcasting: BroadcastSettingsResponse;
  /**
   *
   * @type {GeofenceSettings}
   * @memberof CallSettingsResponse
   */
  geofencing: GeofenceSettings;
  /**
   *
   * @type {RecordSettingsResponse}
   * @memberof CallSettingsResponse
   */
  recording: RecordSettingsResponse;
  /**
   *
   * @type {RingSettings}
   * @memberof CallSettingsResponse
   */
  ring: RingSettings;
  /**
   *
   * @type {ScreensharingSettings}
   * @memberof CallSettingsResponse
   */
  screensharing: ScreensharingSettings;
  /**
   *
   * @type {ThumbnailsSettings}
   * @memberof CallSettingsResponse
   */
  thumbnails: ThumbnailsSettings;
  /**
   *
   * @type {TranscriptionSettings}
   * @memberof CallSettingsResponse
   */
  transcription: TranscriptionSettings;
  /**
   *
   * @type {VideoSettings}
   * @memberof CallSettingsResponse
   */
  video: VideoSettings;
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
 * @interface CallTypeResponse
 */
export interface CallTypeResponse {
  /**
   *
   * @type {string}
   * @memberof CallTypeResponse
   */
  created_at: string;
  /**
   *
   * @type {{ [key: string]: Array<string>; }}
   * @memberof CallTypeResponse
   */
  grants: { [key: string]: Array<string> };
  /**
   *
   * @type {string}
   * @memberof CallTypeResponse
   */
  name: string;
  /**
   *
   * @type {NotificationSettings}
   * @memberof CallTypeResponse
   */
  notification_settings: NotificationSettings;
  /**
   *
   * @type {CallSettingsResponse}
   * @memberof CallTypeResponse
   */
  settings: CallSettingsResponse;
  /**
   *
   * @type {string}
   * @memberof CallTypeResponse
   */
  updated_at: string;
}
/**
 *
 * @export
 * @interface CheckExternalStorageResponse
 */
export interface CheckExternalStorageResponse {
  /**
   * Duration of the request in human-readable format
   * @type {string}
   * @memberof CheckExternalStorageResponse
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
   * @type {object}
   * @memberof ConnectUserDetailsRequest
   */
  custom?: object;
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
}
/**
 *
 * @export
 * @interface CreateCallTypeRequest
 */
export interface CreateCallTypeRequest {
  /**
   *
   * @type {{ [key: string]: Array<string>; }}
   * @memberof CreateCallTypeRequest
   */
  grants?: { [key: string]: Array<string> };
  /**
   *
   * @type {string}
   * @memberof CreateCallTypeRequest
   */
  name: string;
  /**
   *
   * @type {NotificationSettingsRequest}
   * @memberof CreateCallTypeRequest
   */
  notification_settings?: NotificationSettingsRequest;
  /**
   *
   * @type {CallSettingsRequest}
   * @memberof CreateCallTypeRequest
   */
  settings?: CallSettingsRequest;
}
/**
 *
 * @export
 * @interface CreateCallTypeResponse
 */
export interface CreateCallTypeResponse {
  /**
   *
   * @type {string}
   * @memberof CreateCallTypeResponse
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof CreateCallTypeResponse
   */
  duration: string;
  /**
   *
   * @type {{ [key: string]: Array<string>; }}
   * @memberof CreateCallTypeResponse
   */
  grants: { [key: string]: Array<string> };
  /**
   *
   * @type {string}
   * @memberof CreateCallTypeResponse
   */
  name: string;
  /**
   *
   * @type {NotificationSettings}
   * @memberof CreateCallTypeResponse
   */
  notification_settings: NotificationSettings;
  /**
   *
   * @type {CallSettingsResponse}
   * @memberof CreateCallTypeResponse
   */
  settings: CallSettingsResponse;
  /**
   *
   * @type {string}
   * @memberof CreateCallTypeResponse
   */
  updated_at: string;
}
/**
 *
 * @export
 * @interface CreateDeviceRequest
 */
export interface CreateDeviceRequest {
  /**
   *
   * @type {string}
   * @memberof CreateDeviceRequest
   */
  id?: string;
  /**
   *
   * @type {string}
   * @memberof CreateDeviceRequest
   */
  push_provider?: CreateDeviceRequestPushProviderEnum;
  /**
   *
   * @type {string}
   * @memberof CreateDeviceRequest
   */
  push_provider_name?: string;
  /**
   *
   * @type {UserRequest}
   * @memberof CreateDeviceRequest
   */
  user?: UserRequest;
  /**
   *
   * @type {string}
   * @memberof CreateDeviceRequest
   */
  user_id?: string;
  /**
   *
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
 * @interface CreateExternalStorageRequest
 */
export interface CreateExternalStorageRequest {
  /**
   *
   * @type {S3Request}
   * @memberof CreateExternalStorageRequest
   */
  aws_s3?: S3Request;
  /**
   *
   * @type {AzureRequest}
   * @memberof CreateExternalStorageRequest
   */
  azure_blob?: AzureRequest;
  /**
   *
   * @type {string}
   * @memberof CreateExternalStorageRequest
   */
  bucket: string;
  /**
   *
   * @type {string}
   * @memberof CreateExternalStorageRequest
   */
  gcs_credentials?: string;
  /**
   *
   * @type {string}
   * @memberof CreateExternalStorageRequest
   */
  name: string;
  /**
   *
   * @type {string}
   * @memberof CreateExternalStorageRequest
   */
  path?: string;
  /**
   *
   * @type {string}
   * @memberof CreateExternalStorageRequest
   */
  storage_type: string;
}
/**
 *
 * @export
 * @interface CreateExternalStorageResponse
 */
export interface CreateExternalStorageResponse {
  /**
   * Duration of the request in human-readable format
   * @type {string}
   * @memberof CreateExternalStorageResponse
   */
  duration: string;
}
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
   *
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
 * @interface DeleteExternalStorageResponse
 */
export interface DeleteExternalStorageResponse {
  /**
   * Duration of the request in human-readable format
   * @type {string}
   * @memberof DeleteExternalStorageResponse
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
   *
   * @type {string}
   * @memberof Device
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof Device
   */
  push_provider: string;
  /**
   *
   * @type {string}
   * @memberof Device
   */
  push_provider_name?: string;
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
 * @interface EventNotificationSettings
 */
export interface EventNotificationSettings {
  /**
   *
   * @type {APNS}
   * @memberof EventNotificationSettings
   */
  apns: APNS;
  /**
   *
   * @type {boolean}
   * @memberof EventNotificationSettings
   */
  enabled: boolean;
}
/**
 *
 * @export
 * @interface EventNotificationSettingsRequest
 */
export interface EventNotificationSettingsRequest {
  /**
   *
   * @type {APNSRequest}
   * @memberof EventNotificationSettingsRequest
   */
  apns?: APNSRequest;
  /**
   *
   * @type {boolean}
   * @memberof EventNotificationSettingsRequest
   */
  enabled?: boolean;
}
/**
 *
 * @export
 * @interface ExternalStorageResponse
 */
export interface ExternalStorageResponse {
  /**
   *
   * @type {string}
   * @memberof ExternalStorageResponse
   */
  bucket: string;
  /**
   *
   * @type {string}
   * @memberof ExternalStorageResponse
   */
  name: string;
  /**
   *
   * @type {string}
   * @memberof ExternalStorageResponse
   */
  path: string;
  /**
   *
   * @type {string}
   * @memberof ExternalStorageResponse
   */
  type: string;
}
/**
 *
 * @export
 * @interface GeofenceSettings
 */
export interface GeofenceSettings {
  /**
   *
   * @type {Array<string>}
   * @memberof GeofenceSettings
   */
  names: Array<string>;
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
 * @interface GetCallTypeResponse
 */
export interface GetCallTypeResponse {
  /**
   *
   * @type {string}
   * @memberof GetCallTypeResponse
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof GetCallTypeResponse
   */
  duration: string;
  /**
   *
   * @type {{ [key: string]: Array<string>; }}
   * @memberof GetCallTypeResponse
   */
  grants: { [key: string]: Array<string> };
  /**
   *
   * @type {string}
   * @memberof GetCallTypeResponse
   */
  name: string;
  /**
   *
   * @type {NotificationSettings}
   * @memberof GetCallTypeResponse
   */
  notification_settings: NotificationSettings;
  /**
   *
   * @type {CallSettingsResponse}
   * @memberof GetCallTypeResponse
   */
  settings: CallSettingsResponse;
  /**
   *
   * @type {string}
   * @memberof GetCallTypeResponse
   */
  updated_at: string;
}
/**
 *
 * @export
 * @interface GetEdgesResponse
 */
export interface GetEdgesResponse {
  /**
   * Duration of the request in human-readable format
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
   * Duration of the request in human-readable format
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
   * @type {LayoutSettingsRequest}
   * @memberof HLSSettingsRequest
   */
  layout?: LayoutSettingsRequest;
  /**
   *
   * @type {Array<string>}
   * @memberof HLSSettingsRequest
   */
  quality_tracks?: Array<string>;
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
   * @type {LayoutSettings}
   * @memberof HLSSettingsResponse
   */
  layout: LayoutSettings;
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
 * @interface LayoutSettings
 */
export interface LayoutSettings {
  /**
   *
   * @type {string}
   * @memberof LayoutSettings
   */
  external_app_url: string;
  /**
   *
   * @type {string}
   * @memberof LayoutSettings
   */
  external_css_url: string;
  /**
   *
   * @type {string}
   * @memberof LayoutSettings
   */
  name: LayoutSettingsNameEnum;
  /**
   *
   * @type {object}
   * @memberof LayoutSettings
   */
  options?: object;
}

/**
 * @export
 */
export const LayoutSettingsNameEnum = {
  SPOTLIGHT: 'spotlight',
  GRID: 'grid',
  SINGLE_PARTICIPANT: 'single-participant',
  MOBILE: 'mobile',
  CUSTOM: 'custom',
} as const;
export type LayoutSettingsNameEnum =
  (typeof LayoutSettingsNameEnum)[keyof typeof LayoutSettingsNameEnum];

/**
 *
 * @export
 * @interface LayoutSettingsRequest
 */
export interface LayoutSettingsRequest {
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
   * @type {object}
   * @memberof LayoutSettingsRequest
   */
  options?: object;
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
 * @interface ListCallTypeResponse
 */
export interface ListCallTypeResponse {
  /**
   *
   * @type {{ [key: string]: CallTypeResponse; }}
   * @memberof ListCallTypeResponse
   */
  call_types: { [key: string]: CallTypeResponse };
  /**
   *
   * @type {string}
   * @memberof ListCallTypeResponse
   */
  duration: string;
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
 * @interface ListExternalStorageResponse
 */
export interface ListExternalStorageResponse {
  /**
   * Duration of the request in human-readable format
   * @type {string}
   * @memberof ListExternalStorageResponse
   */
  duration: string;
  /**
   *
   * @type {{ [key: string]: ExternalStorageResponse; }}
   * @memberof ListExternalStorageResponse
   */
  external_storages: { [key: string]: ExternalStorageResponse };
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
 * @interface MemberRequest
 */
export interface MemberRequest {
  /**
   * Custom data for this object
   * @type {object}
   * @memberof MemberRequest
   */
  custom?: object;
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
   * @type {object}
   * @memberof MemberResponse
   */
  custom: object;
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
   * Duration of the request in human-readable format
   * @type {string}
   * @memberof MuteUsersResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface NotificationSettings
 */
export interface NotificationSettings {
  /**
   *
   * @type {EventNotificationSettings}
   * @memberof NotificationSettings
   */
  call_live_started: EventNotificationSettings;
  /**
   *
   * @type {EventNotificationSettings}
   * @memberof NotificationSettings
   */
  call_notification: EventNotificationSettings;
  /**
   *
   * @type {EventNotificationSettings}
   * @memberof NotificationSettings
   */
  call_ring: EventNotificationSettings;
  /**
   *
   * @type {boolean}
   * @memberof NotificationSettings
   */
  enabled: boolean;
  /**
   *
   * @type {EventNotificationSettings}
   * @memberof NotificationSettings
   */
  session_started: EventNotificationSettings;
}
/**
 *
 * @export
 * @interface NotificationSettingsRequest
 */
export interface NotificationSettingsRequest {
  /**
   *
   * @type {EventNotificationSettingsRequest}
   * @memberof NotificationSettingsRequest
   */
  call_live_started?: EventNotificationSettingsRequest;
  /**
   *
   * @type {EventNotificationSettingsRequest}
   * @memberof NotificationSettingsRequest
   */
  call_notification?: EventNotificationSettingsRequest;
  /**
   *
   * @type {EventNotificationSettingsRequest}
   * @memberof NotificationSettingsRequest
   */
  call_ring?: EventNotificationSettingsRequest;
  /**
   *
   * @type {boolean}
   * @memberof NotificationSettingsRequest
   */
  enabled?: boolean;
  /**
   *
   * @type {EventNotificationSettingsRequest}
   * @memberof NotificationSettingsRequest
   */
  session_started?: EventNotificationSettingsRequest;
}

/**
 * All possibility of string to use
 * @export
 */
export const OwnCapability = {
  BLOCK_USERS: 'block-users',
  CREATE_CALL: 'create-call',
  CREATE_REACTION: 'create-reaction',
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
 * @interface PinRequest
 */
export interface PinRequest {
  /**
   *
   * @type {string}
   * @memberof PinRequest
   */
  session_id: string;
  /**
   *
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
   * Duration of the request in human-readable format
   * @type {string}
   * @memberof PinResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface QueryCallsRequest
 */
export interface QueryCallsRequest {
  /**
   *
   * @type {object}
   * @memberof QueryCallsRequest
   */
  filter_conditions?: object;
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
   *
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
 *
 * @export
 * @interface QueryMembersRequest
 */
export interface QueryMembersRequest {
  /**
   *
   * @type {object}
   * @memberof QueryMembersRequest
   */
  filter_conditions?: object;
  /**
   *
   * @type {string}
   * @memberof QueryMembersRequest
   */
  id: string;
  /**
   *
   * @type {number}
   * @memberof QueryMembersRequest
   */
  limit?: number;
  /**
   *
   * @type {string}
   * @memberof QueryMembersRequest
   */
  next?: string;
  /**
   *
   * @type {string}
   * @memberof QueryMembersRequest
   */
  prev?: string;
  /**
   *
   * @type {Array<SortParamRequest>}
   * @memberof QueryMembersRequest
   */
  sort?: Array<SortParamRequest>;
  /**
   *
   * @type {string}
   * @memberof QueryMembersRequest
   */
  type: string;
}
/**
 *
 * @export
 * @interface QueryMembersResponse
 */
export interface QueryMembersResponse {
  /**
   * Duration of the request in human-readable format
   * @type {string}
   * @memberof QueryMembersResponse
   */
  duration: string;
  /**
   *
   * @type {Array<MemberResponse>}
   * @memberof QueryMembersResponse
   */
  members: Array<MemberResponse>;
  /**
   *
   * @type {string}
   * @memberof QueryMembersResponse
   */
  next?: string;
  /**
   *
   * @type {string}
   * @memberof QueryMembersResponse
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
   * @type {LayoutSettingsRequest}
   * @memberof RecordSettingsRequest
   */
  layout?: LayoutSettingsRequest;
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
   * @type {LayoutSettings}
   * @memberof RecordSettingsResponse
   */
  layout: LayoutSettings;
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
 * @interface Response
 */
export interface Response {
  /**
   * Duration of the request in human-readable format
   * @type {string}
   * @memberof Response
   */
  duration: string;
}
/**
 *
 * @export
 * @interface RingSettings
 */
export interface RingSettings {
  /**
   *
   * @type {number}
   * @memberof RingSettings
   */
  auto_cancel_timeout_ms: number;
  /**
   *
   * @type {number}
   * @memberof RingSettings
   */
  incoming_call_timeout_ms: number;
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
  auto_cancel_timeout_ms?: number;
  /**
   *
   * @type {number}
   * @memberof RingSettingsRequest
   */
  incoming_call_timeout_ms?: number;
}
/**
 *
 * @export
 * @interface S3Request
 */
export interface S3Request {
  /**
   *
   * @type {string}
   * @memberof S3Request
   */
  s3_api_key?: string;
  /**
   *
   * @type {string}
   * @memberof S3Request
   */
  s3_region: string;
  /**
   *
   * @type {string}
   * @memberof S3Request
   */
  s3_secret?: string;
}
/**
 *
 * @export
 * @interface ScreensharingSettings
 */
export interface ScreensharingSettings {
  /**
   *
   * @type {boolean}
   * @memberof ScreensharingSettings
   */
  access_request_enabled: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ScreensharingSettings
   */
  enabled: boolean;
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
}
/**
 *
 * @export
 * @interface SendEventRequest
 */
export interface SendEventRequest {
  /**
   *
   * @type {object}
   * @memberof SendEventRequest
   */
  custom?: object;
}
/**
 *
 * @export
 * @interface SendEventResponse
 */
export interface SendEventResponse {
  /**
   *
   * @type {string}
   * @memberof SendEventResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface SortParamRequest
 */
export interface SortParamRequest {
  /**
   * Direction of sorting, -1 for descending, 1 for ascending
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
   * Duration of the request in human-readable format
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
 * @interface StopHLSBroadcastingResponse
 */
export interface StopHLSBroadcastingResponse {
  /**
   * Duration of the request in human-readable format
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
   * Duration of the request in human-readable format
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
   * Duration of the request in human-readable format
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
   * Duration of the request in human-readable format
   * @type {string}
   * @memberof StopTranscriptionResponse
   */
  duration: string;
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
  bitrate: number;
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
 * @interface TargetResolutionRequest
 */
export interface TargetResolutionRequest {
  /**
   *
   * @type {number}
   * @memberof TargetResolutionRequest
   */
  bitrate?: number;
  /**
   *
   * @type {number}
   * @memberof TargetResolutionRequest
   */
  height?: number;
  /**
   *
   * @type {number}
   * @memberof TargetResolutionRequest
   */
  width?: number;
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
 * @interface ThumbnailsSettings
 */
export interface ThumbnailsSettings {
  /**
   *
   * @type {boolean}
   * @memberof ThumbnailsSettings
   */
  enabled: boolean;
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
 * @interface TranscriptionSettings
 */
export interface TranscriptionSettings {
  /**
   *
   * @type {string}
   * @memberof TranscriptionSettings
   */
  closed_caption_mode: string;
  /**
   *
   * @type {string}
   * @memberof TranscriptionSettings
   */
  mode: TranscriptionSettingsModeEnum;
}

/**
 * @export
 */
export const TranscriptionSettingsModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type TranscriptionSettingsModeEnum =
  (typeof TranscriptionSettingsModeEnum)[keyof typeof TranscriptionSettingsModeEnum];

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
   * @type {string}
   * @memberof TranscriptionSettingsRequest
   */
  mode?: TranscriptionSettingsRequestModeEnum;
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
   * Duration of the request in human-readable format
   * @type {string}
   * @memberof UnblockUserResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface UnpinRequest
 */
export interface UnpinRequest {
  /**
   *
   * @type {string}
   * @memberof UnpinRequest
   */
  session_id: string;
  /**
   *
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
   * Duration of the request in human-readable format
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
   * Duration of the request in human-readable format
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
   * @type {object}
   * @memberof UpdateCallRequest
   */
  custom?: object;
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
 * @interface UpdateCallTypeRequest
 */
export interface UpdateCallTypeRequest {
  /**
   *
   * @type {{ [key: string]: Array<string>; }}
   * @memberof UpdateCallTypeRequest
   */
  grants?: { [key: string]: Array<string> };
  /**
   *
   * @type {NotificationSettingsRequest}
   * @memberof UpdateCallTypeRequest
   */
  notification_settings?: NotificationSettingsRequest;
  /**
   *
   * @type {CallSettingsRequest}
   * @memberof UpdateCallTypeRequest
   */
  settings?: CallSettingsRequest;
}
/**
 *
 * @export
 * @interface UpdateCallTypeResponse
 */
export interface UpdateCallTypeResponse {
  /**
   *
   * @type {string}
   * @memberof UpdateCallTypeResponse
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof UpdateCallTypeResponse
   */
  duration: string;
  /**
   *
   * @type {{ [key: string]: Array<string>; }}
   * @memberof UpdateCallTypeResponse
   */
  grants: { [key: string]: Array<string> };
  /**
   *
   * @type {string}
   * @memberof UpdateCallTypeResponse
   */
  name: string;
  /**
   *
   * @type {NotificationSettings}
   * @memberof UpdateCallTypeResponse
   */
  notification_settings: NotificationSettings;
  /**
   *
   * @type {CallSettingsResponse}
   * @memberof UpdateCallTypeResponse
   */
  settings: CallSettingsResponse;
  /**
   *
   * @type {string}
   * @memberof UpdateCallTypeResponse
   */
  updated_at: string;
}
/**
 *
 * @export
 * @interface UpdateExternalStorageRequest
 */
export interface UpdateExternalStorageRequest {
  /**
   *
   * @type {S3Request}
   * @memberof UpdateExternalStorageRequest
   */
  aws_s3?: S3Request;
  /**
   *
   * @type {AzureRequest}
   * @memberof UpdateExternalStorageRequest
   */
  azure_blob?: AzureRequest;
  /**
   *
   * @type {string}
   * @memberof UpdateExternalStorageRequest
   */
  bucket: string;
  /**
   *
   * @type {string}
   * @memberof UpdateExternalStorageRequest
   */
  gcs_credentials?: string;
  /**
   *
   * @type {string}
   * @memberof UpdateExternalStorageRequest
   */
  path?: string;
  /**
   *
   * @type {string}
   * @memberof UpdateExternalStorageRequest
   */
  storage_type: string;
}
/**
 *
 * @export
 * @interface UpdateExternalStorageResponse
 */
export interface UpdateExternalStorageResponse {
  /**
   *
   * @type {string}
   * @memberof UpdateExternalStorageResponse
   */
  bucket: string;
  /**
   * Duration of the request in human-readable format
   * @type {string}
   * @memberof UpdateExternalStorageResponse
   */
  duration: string;
  /**
   *
   * @type {string}
   * @memberof UpdateExternalStorageResponse
   */
  name: string;
  /**
   *
   * @type {string}
   * @memberof UpdateExternalStorageResponse
   */
  path: string;
  /**
   *
   * @type {string}
   * @memberof UpdateExternalStorageResponse
   */
  type: string;
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
   * Duration of the request in human-readable format
   * @type {string}
   * @memberof UpdateUserPermissionsResponse
   */
  duration: string;
}
/**
 *
 * @export
 * @interface UserRequest
 */
export interface UserRequest {
  /**
   *
   * @type {object}
   * @memberof UserRequest
   */
  custom?: object;
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
   * @type {string}
   * @memberof UserRequest
   */
  role?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof UserRequest
   */
  teams?: Array<string>;
}
/**
 *
 * @export
 * @interface UserResponse
 */
export interface UserResponse {
  /**
   * Date/time of creation
   * @type {string}
   * @memberof UserResponse
   */
  created_at: string;
  /**
   *
   * @type {object}
   * @memberof UserResponse
   */
  custom: object;
  /**
   * Date/time of deletion
   * @type {string}
   * @memberof UserResponse
   */
  deleted_at?: string;
  /**
   *
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
   *
   * @type {string}
   * @memberof UserResponse
   */
  language: string;
  /**
   *
   * @type {string}
   * @memberof UserResponse
   */
  name?: string;
  /**
   *
   * @type {string}
   * @memberof UserResponse
   */
  role: string;
  /**
   *
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
 * @interface VideoSettings
 */
export interface VideoSettings {
  /**
   *
   * @type {boolean}
   * @memberof VideoSettings
   */
  access_request_enabled: boolean;
  /**
   *
   * @type {boolean}
   * @memberof VideoSettings
   */
  camera_default_on: boolean;
  /**
   *
   * @type {string}
   * @memberof VideoSettings
   */
  camera_facing: VideoSettingsCameraFacingEnum;
  /**
   *
   * @type {boolean}
   * @memberof VideoSettings
   */
  enabled: boolean;
  /**
   *
   * @type {TargetResolution}
   * @memberof VideoSettings
   */
  target_resolution: TargetResolution;
}

/**
 * @export
 */
export const VideoSettingsCameraFacingEnum = {
  FRONT: 'front',
  BACK: 'back',
  EXTERNAL: 'external',
} as const;
export type VideoSettingsCameraFacingEnum =
  (typeof VideoSettingsCameraFacingEnum)[keyof typeof VideoSettingsCameraFacingEnum];

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
   * @type {TargetResolutionRequest}
   * @memberof VideoSettingsRequest
   */
  target_resolution?: TargetResolutionRequest;
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
 * @interface WSAuthMessageRequest
 */
export interface WSAuthMessageRequest {
  /**
   *
   * @type {string}
   * @memberof WSAuthMessageRequest
   */
  token: string;
  /**
   *
   * @type {ConnectUserDetailsRequest}
   * @memberof WSAuthMessageRequest
   */
  user_details: ConnectUserDetailsRequest;
}

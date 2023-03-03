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
 * @interface AnyEvent
 */
export interface AnyEvent {
  /**
   *
   * @type {string}
   * @memberof AnyEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof AnyEvent
   */
  type: string;
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
 * @interface BlockedUserEvent
 */
export interface BlockedUserEvent {
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
   *
   * @type {string}
   * @memberof BlockedUserEvent
   */
  type: string;
  /**
   *
   * @type {string}
   * @memberof BlockedUserEvent
   */
  user_id: string;
}
/**
 *
 * @export
 * @interface BroadcastSettings
 */
export interface BroadcastSettings {
  /**
   *
   * @type {boolean}
   * @memberof BroadcastSettings
   */
  enabled: boolean;
  /**
   *
   * @type {HLSSettings}
   * @memberof BroadcastSettings
   */
  hls: HLSSettings;
}
/**
 *
 * @export
 * @interface CallAcceptedEvent
 */
export interface CallAcceptedEvent {
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
   *
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
 *
 * @export
 * @interface CallCancelledEvent
 */
export interface CallCancelledEvent {
  /**
   *
   * @type {string}
   * @memberof CallCancelledEvent
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallCancelledEvent
   */
  created_at: string;
  /**
   *
   * @type {string}
   * @memberof CallCancelledEvent
   */
  type: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CallCancelledEvent
   */
  user: UserResponse;
}
/**
 *
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
  created_at: string;
  /**
   *
   * @type {Array<MemberResponse>}
   * @memberof CallCreatedEvent
   */
  members: Array<MemberResponse>;
  /**
   *
   * @type {boolean}
   * @memberof CallCreatedEvent
   */
  ringing: boolean;
  /**
   *
   * @type {string}
   * @memberof CallCreatedEvent
   */
  type: string;
}
/**
 *
 * @export
 * @interface CallEndedEvent
 */
export interface CallEndedEvent {
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
   *
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
   *
   * @type {string}
   * @memberof CallReactionEvent
   */
  type: string;
}
/**
 *
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
  type: string;
}
/**
 *
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
  type: string;
}
/**
 *
 * @export
 * @interface CallRejectedEvent
 */
export interface CallRejectedEvent {
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
   * @type {string}
   * @memberof CallResponse
   */
  broadcast_egress: string;
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
   * Custom data for this object
   * @type {{ [key: string]: any; }}
   * @memberof CallResponse
   */
  custom: { [key: string]: any };
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
   * The capabilities of the current user
   * @type {Array<string>}
   * @memberof CallResponse
   */
  own_capabilities: Array<string>;
  /**
   *
   * @type {string}
   * @memberof CallResponse
   */
  record_egress: string;
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
  team: string;
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
 * @interface CallSettingsRequest
 */
export interface CallSettingsRequest {
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
   * @type {ScreensharingSettingsRequest}
   * @memberof CallSettingsRequest
   */
  screensharing?: ScreensharingSettingsRequest;
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
   * @type {BroadcastSettings}
   * @memberof CallSettingsResponse
   */
  broadcasting: BroadcastSettings;
  /**
   *
   * @type {GeofenceSettings}
   * @memberof CallSettingsResponse
   */
  geofencing: GeofenceSettings;
  /**
   *
   * @type {RecordSettings}
   * @memberof CallSettingsResponse
   */
  recording: RecordSettings;
  /**
   *
   * @type {ScreensharingSettings}
   * @memberof CallSettingsResponse
   */
  screensharing: ScreensharingSettings;
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
   * @type {Array<UserResponse>}
   * @memberof CallStateResponseFields
   */
  blocked_users: Array<UserResponse>;
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
}
/**
 *
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
   *
   * @type {string}
   * @memberof CallUpdatedEvent
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
 *
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
   *
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
 * @interface DatacenterResponse
 */
export interface DatacenterResponse {
  /**
   *
   * @type {Coordinates}
   * @memberof DatacenterResponse
   */
  coordinates: Coordinates;
  /**
   *
   * @type {string}
   * @memberof DatacenterResponse
   */
  latency_url: string;
  /**
   *
   * @type {string}
   * @memberof DatacenterResponse
   */
  name: string;
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
   *
   * @type {string}
   * @memberof Device
   */
  user_id: string;
}
/**
 *
 * @export
 * @interface EdgeResponse
 */
export interface EdgeResponse {
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
   * @type {number}
   * @memberof EdgeResponse
   */
  yellow: number;
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
 * @interface GetCallEdgeServerRequest
 */
export interface GetCallEdgeServerRequest {
  /**
   *
   * @type {{ [key: string]: Array<number>; }}
   * @memberof GetCallEdgeServerRequest
   */
  latency_measurements: { [key: string]: Array<number> };
}
/**
 *
 * @export
 * @interface GetCallEdgeServerResponse
 */
export interface GetCallEdgeServerResponse {
  /**
   *
   * @type {Array<UserResponse>}
   * @memberof GetCallEdgeServerResponse
   */
  blocked_users: Array<UserResponse>;
  /**
   *
   * @type {CallResponse}
   * @memberof GetCallEdgeServerResponse
   */
  call: CallResponse;
  /**
   *
   * @type {Credentials}
   * @memberof GetCallEdgeServerResponse
   */
  credentials: Credentials;
  /**
   * Duration of the request in human-readable format
   * @type {string}
   * @memberof GetCallEdgeServerResponse
   */
  duration: string;
  /**
   *
   * @type {Array<MemberResponse>}
   * @memberof GetCallEdgeServerResponse
   */
  members: Array<MemberResponse>;
  /**
   *
   * @type {MemberResponse}
   * @memberof GetCallEdgeServerResponse
   */
  membership?: MemberResponse;
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
   * @type {PaginationParamsRequest}
   * @memberof GetOrCreateCallRequest
   */
  members?: PaginationParamsRequest;
  /**
   *
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
   * @type {Array<UserResponse>}
   * @memberof GetOrCreateCallResponse
   */
  blocked_users: Array<UserResponse>;
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
 * @interface HLSSettings
 */
export interface HLSSettings {
  /**
   *
   * @type {boolean}
   * @memberof HLSSettings
   */
  auto_on: boolean;
  /**
   *
   * @type {boolean}
   * @memberof HLSSettings
   */
  enabled: boolean;
  /**
   *
   * @type {Array<string>}
   * @memberof HLSSettings
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
   * The unique identifier for a call (<type>:<id>)
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
   * @type {OwnUserResponse}
   * @memberof HealthCheckEvent
   */
  me?: OwnUserResponse;
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
   *
   * @type {string}
   * @memberof JoinCallRequest
   */
  connection_id?: string;
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
  datacenter_hinted_id?: string;
  /**
   *
   * @type {PaginationParamsRequest}
   * @memberof JoinCallRequest
   */
  members?: PaginationParamsRequest;
  /**
   *
   * @type {boolean}
   * @memberof JoinCallRequest
   */
  ring?: boolean;
}
/**
 *
 * @export
 * @interface JoinCallResponse
 */
export interface JoinCallResponse {
  /**
   *
   * @type {Array<UserResponse>}
   * @memberof JoinCallResponse
   */
  blocked_users: Array<UserResponse>;
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
   * @type {string}
   * @memberof JoinCallResponse
   */
  duration: string;
  /**
   *
   * @type {Array<DatacenterResponse>}
   * @memberof JoinCallResponse
   */
  edges: Array<DatacenterResponse>;
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
  duration: string;
  /**
   *
   * @type {string}
   * @memberof MemberResponse
   */
  role: string;
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
 * @interface OwnUserResponse
 */
export interface OwnUserResponse {
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
   * @type {string}
   * @memberof OwnUserResponse
   */
  name?: string;
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
  teams?: Array<string>;
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
 * @interface PaginationParamsRequest
 */
export interface PaginationParamsRequest {
  /**
   *
   * @type {number}
   * @memberof PaginationParamsRequest
   */
  id_gt?: number;
  /**
   *
   * @type {number}
   * @memberof PaginationParamsRequest
   */
  id_gte?: number;
  /**
   *
   * @type {number}
   * @memberof PaginationParamsRequest
   */
  id_lt?: number;
  /**
   *
   * @type {number}
   * @memberof PaginationParamsRequest
   */
  id_lte?: number;
  /**
   *
   * @type {number}
   * @memberof PaginationParamsRequest
   */
  limit?: number;
  /**
   *
   * @type {number}
   * @memberof PaginationParamsRequest
   */
  offset?: number;
}
/**
 *
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
   *
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
  sort: Array<SortParamRequest>;
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
   * @type {{ [key: string]: any; }}
   * @memberof QueryMembersRequest
   */
  filter_conditions: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof QueryMembersRequest
   */
  id?: string;
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
  custom: { [key: string]: any };
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
 * @interface RecordSettings
 */
export interface RecordSettings {
  /**
   *
   * @type {boolean}
   * @memberof RecordSettings
   */
  audio_only: boolean;
  /**
   *
   * @type {string}
   * @memberof RecordSettings
   */
  mode: string;
  /**
   *
   * @type {string}
   * @memberof RecordSettings
   */
  quality: string;
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
  mode?: string;
  /**
   *
   * @type {string}
   * @memberof RecordSettingsRequest
   */
  quality?: string;
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
   * @type {{ [key: string]: any; }}
   * @memberof SendEventRequest
   */
  custom?: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof SendEventRequest
   */
  type: string;
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
   * Duration of the request in human-readable format
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
   *
   * @type {number}
   * @memberof SortParamRequest
   */
  direction?: number;
  /**
   *
   * @type {string}
   * @memberof SortParamRequest
   */
  field?: string;
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
   *
   * @type {string}
   * @memberof UnblockedUserEvent
   */
  type: string;
  /**
   *
   * @type {string}
   * @memberof UnblockedUserEvent
   */
  user_id: string;
}
/**
 *
 * @export
 * @interface UpdateCallRequest
 */
export interface UpdateCallRequest {
  /**
   * call custom data
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
   * The updated list of capabilities the user has in the call
   * @type {Array<string>}
   * @memberof UpdatedCallPermissionsEvent
   */
  own_capabilities: Array<string>;
  /**
   *
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
   * @type {{ [key: string]: any; }}
   * @memberof UserResponse
   */
  custom: { [key: string]: any };
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
  teams?: Array<string>;
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
  enabled: boolean;
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
  enabled?: boolean;
}

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
  StatusCode?: number;
  /**
   * API error code
   * @type {number}
   * @memberof APIError
   */
  code?: number;
  /**
   * Additional error-specific information
   * @type {Array<number>}
   * @memberof APIError
   */
  details?: Array<number>;
  /**
   * Request duration
   * @type {string}
   * @memberof APIError
   */
  duration?: string;
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
  message?: string;
  /**
   * URL with additional information
   * @type {string}
   * @memberof APIError
   */
  more_info?: string;
}
/**
 *
 * @export
 * @interface Any
 */
export interface Any {
  /**
   *
   * @type {string}
   * @memberof Any
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof Any
   */
  type: string;
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
  enabled?: boolean;
}
/**
 *
 * @export
 * @interface CallAccepted
 */
export interface CallAccepted {
  /**
   *
   * @type {string}
   * @memberof CallAccepted
   */
  call_cid?: string;
  /**
   *
   * @type {string}
   * @memberof CallAccepted
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof CallAccepted
   */
  type: string;
}
/**
 *
 * @export
 * @interface CallCancelled
 */
export interface CallCancelled {
  /**
   *
   * @type {string}
   * @memberof CallCancelled
   */
  call_cid?: string;
  /**
   *
   * @type {string}
   * @memberof CallCancelled
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof CallCancelled
   */
  type: string;
}
/**
 *
 * @export
 * @interface CallCreated
 */
export interface CallCreated {
  /**
   *
   * @type {CallResponse}
   * @memberof CallCreated
   */
  call?: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallCreated
   */
  created_at?: string;
  /**
   *
   * @type {Array<CallMemberResponse>}
   * @memberof CallCreated
   */
  members?: Array<CallMemberResponse>;
  /**
   *
   * @type {boolean}
   * @memberof CallCreated
   */
  ringing?: boolean;
  /**
   *
   * @type {string}
   * @memberof CallCreated
   */
  type: string;
}
/**
 *
 * @export
 * @interface CallMemberRequest
 */
export interface CallMemberRequest {
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof CallMemberRequest
   */
  custom?: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof CallMemberRequest
   */
  role?: string;
  /**
   *
   * @type {UserObjectRequest}
   * @memberof CallMemberRequest
   */
  user?: UserObjectRequest;
  /**
   *
   * @type {string}
   * @memberof CallMemberRequest
   */
  user_id?: string;
}
/**
 *
 * @export
 * @interface CallMemberResponse
 */
export interface CallMemberResponse {
  /**
   * Date/time of creation
   * @type {string}
   * @memberof CallMemberResponse
   */
  created_at?: string;
  /**
   * Date/time of deletion
   * @type {string}
   * @memberof CallMemberResponse
   */
  deleted_at?: string;
  /**
   *
   * @type {string}
   * @memberof CallMemberResponse
   */
  duration?: string;
  /**
   *
   * @type {string}
   * @memberof CallMemberResponse
   */
  role?: string;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof CallMemberResponse
   */
  updated_at?: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CallMemberResponse
   */
  user?: UserResponse;
  /**
   *
   * @type {string}
   * @memberof CallMemberResponse
   */
  user_id?: string;
}
/**
 *
 * @export
 * @interface CallRejected
 */
export interface CallRejected {
  /**
   *
   * @type {string}
   * @memberof CallRejected
   */
  call_cid?: string;
  /**
   *
   * @type {string}
   * @memberof CallRejected
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof CallRejected
   */
  type: string;
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
   * @type {Array<CallMemberRequest>}
   * @memberof CallRequest
   */
  members?: Array<CallMemberRequest>;
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
   * @type {string}
   * @memberof CallResponse
   */
  broadcast_egress?: string;
  /**
   * The unique identifier for a call (<type>:<id>)
   * @type {string}
   * @memberof CallResponse
   */
  cid?: string;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof CallResponse
   */
  created_at?: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CallResponse
   */
  created_by?: UserResponse;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof CallResponse
   */
  custom?: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof CallResponse
   */
  ended_at?: string;
  /**
   * Call ID
   * @type {string}
   * @memberof CallResponse
   */
  id?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof CallResponse
   */
  own_capabilities?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof CallResponse
   */
  record_egress?: string;
  /**
   *
   * @type {CallSettingsResponse}
   * @memberof CallResponse
   */
  settings?: CallSettingsResponse;
  /**
   *
   * @type {string}
   * @memberof CallResponse
   */
  team?: string;
  /**
   * The type of call
   * @type {string}
   * @memberof CallResponse
   */
  type?: string;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof CallResponse
   */
  updated_at?: string;
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
   * @type {BroadcastSettings}
   * @memberof CallSettingsResponse
   */
  broadcasting?: BroadcastSettings;
  /**
   *
   * @type {GeofenceSettings}
   * @memberof CallSettingsResponse
   */
  geofencing?: GeofenceSettings;
  /**
   *
   * @type {RecordSettings}
   * @memberof CallSettingsResponse
   */
  recording?: RecordSettings;
  /**
   *
   * @type {ScreensharingSettings}
   * @memberof CallSettingsResponse
   */
  screensharing?: ScreensharingSettings;
  /**
   *
   * @type {VideoSettings}
   * @memberof CallSettingsResponse
   */
  video?: VideoSettings;
}
/**
 *
 * @export
 * @interface ConnectRequest
 */
export interface ConnectRequest {
  /**
   *
   * @type {DeviceFields}
   * @memberof ConnectRequest
   */
  device?: DeviceFields;
  /**
   *
   * @type {UserObject}
   * @memberof ConnectRequest
   */
  user_details: UserObject;
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
  latitude?: number;
  /**
   *
   * @type {number}
   * @memberof Coordinates
   */
  longitude?: number;
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
  ice_servers?: Array<ICEServer>;
  /**
   *
   * @type {SFUResponse}
   * @memberof Credentials
   */
  server?: SFUResponse;
  /**
   *
   * @type {string}
   * @memberof Credentials
   */
  token?: string;
}
/**
 *
 * @export
 * @interface Custom
 */
export interface Custom {
  /**
   *
   * @type {string}
   * @memberof Custom
   */
  call_cid?: string;
  /**
   *
   * @type {string}
   * @memberof Custom
   */
  created_at?: string;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof Custom
   */
  custom?: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof Custom
   */
  type: string;
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
  coordinates?: Coordinates;
  /**
   *
   * @type {string}
   * @memberof DatacenterResponse
   */
  latency_url?: string;
  /**
   *
   * @type {string}
   * @memberof DatacenterResponse
   */
  name?: string;
}
/**
 *
 * @export
 * @interface DeviceFields
 */
export interface DeviceFields {
  /**
   * Device ID
   * @type {string}
   * @memberof DeviceFields
   */
  id?: string;
  /**
   *
   * @type {string}
   * @memberof DeviceFields
   */
  push_provider?: DeviceFieldsPushProviderEnum;
  /**
   * Name of the push provider configuration
   * @type {string}
   * @memberof DeviceFields
   */
  push_provider_name?: string;
}

/**
 * @export
 */
export const DeviceFieldsPushProviderEnum = {
  firebase: 'firebase',
  apn: 'apn',
  huawei: 'huawei',
  xiaomi: 'xiaomi',
} as const;
export type DeviceFieldsPushProviderEnum =
  (typeof DeviceFieldsPushProviderEnum)[keyof typeof DeviceFieldsPushProviderEnum];

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
  names?: Array<string>;
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
  latency_measurements?: { [key: string]: Array<number> };
}
/**
 *
 * @export
 * @interface GetCallEdgeServerResponse
 */
export interface GetCallEdgeServerResponse {
  /**
   *
   * @type {CallResponse}
   * @memberof GetCallEdgeServerResponse
   */
  call?: CallResponse;
  /**
   *
   * @type {Credentials}
   * @memberof GetCallEdgeServerResponse
   */
  credentials?: Credentials;
  /**
   * Duration of the request in human-readable format
   * @type {string}
   * @memberof GetCallEdgeServerResponse
   */
  duration?: string;
  /**
   *
   * @type {Array<CallMemberResponse>}
   * @memberof GetCallEdgeServerResponse
   */
  members?: Array<CallMemberResponse>;
  /**
   *
   * @type {CallMemberResponse}
   * @memberof GetCallEdgeServerResponse
   */
  membership?: CallMemberResponse;
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
   * @type {CallResponse}
   * @memberof GetOrCreateCallResponse
   */
  call?: CallResponse;
  /**
   *
   * @type {boolean}
   * @memberof GetOrCreateCallResponse
   */
  created?: boolean;
  /**
   *
   * @type {string}
   * @memberof GetOrCreateCallResponse
   */
  duration?: string;
  /**
   *
   * @type {Array<CallMemberResponse>}
   * @memberof GetOrCreateCallResponse
   */
  members?: Array<CallMemberResponse>;
  /**
   *
   * @type {CallMemberResponse}
   * @memberof GetOrCreateCallResponse
   */
  membership?: CallMemberResponse;
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
  password?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof ICEServer
   */
  urls?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof ICEServer
   */
  username?: string;
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
  call?: CallResponse;
  /**
   *
   * @type {boolean}
   * @memberof JoinCallResponse
   */
  created?: boolean;
  /**
   *
   * @type {string}
   * @memberof JoinCallResponse
   */
  duration?: string;
  /**
   *
   * @type {Array<DatacenterResponse>}
   * @memberof JoinCallResponse
   */
  edges?: Array<DatacenterResponse>;
  /**
   *
   * @type {Array<CallMemberResponse>}
   * @memberof JoinCallResponse
   */
  members?: Array<CallMemberResponse>;
  /**
   *
   * @type {CallMemberResponse}
   * @memberof JoinCallResponse
   */
  membership?: CallMemberResponse;
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
 * @interface PushNotificationSettingsRequest
 */
export interface PushNotificationSettingsRequest {
  /**
   *
   * @type {boolean}
   * @memberof PushNotificationSettingsRequest
   */
  disabled?: boolean;
  /**
   *
   * @type {string}
   * @memberof PushNotificationSettingsRequest
   */
  disabled_until?: string;
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
  enabled?: boolean;
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
  edge_name?: string;
  /**
   *
   * @type {string}
   * @memberof SFUResponse
   */
  url?: string;
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
  enabled?: boolean;
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
  event_type?: string;
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
  duration?: string;
}
/**
 * Represents chat user
 * @export
 * @interface UserObject
 */
export interface UserObject {
  [key: string]: any | any;
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
  banned?: boolean;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof UserObject
   */
  readonly created_at?: string;
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
  readonly online?: boolean;
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
  role?: string;
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
 * Represents chat user
 * @export
 * @interface UserObjectRequest
 */
export interface UserObjectRequest {
  [key: string]: any | any;
  /**
   * Expiration date of the ban
   * @type {string}
   * @memberof UserObjectRequest
   */
  ban_expires?: string;
  /**
   * Whether a user is banned or not
   * @type {boolean}
   * @memberof UserObjectRequest
   */
  banned?: boolean;
  /**
   * Unique user identifier
   * @type {string}
   * @memberof UserObjectRequest
   */
  id: string;
  /**
   *
   * @type {boolean}
   * @memberof UserObjectRequest
   */
  invisible?: boolean;
  /**
   * Preferred language of a user
   * @type {string}
   * @memberof UserObjectRequest
   */
  language?: string;
  /**
   *
   * @type {PushNotificationSettingsRequest}
   * @memberof UserObjectRequest
   */
  push_notifications?: PushNotificationSettingsRequest;
  /**
   * Revocation date for tokens
   * @type {string}
   * @memberof UserObjectRequest
   */
  revoke_tokens_issued_before?: string;
  /**
   * Determines the set of user permissions
   * @type {string}
   * @memberof UserObjectRequest
   */
  role?: string;
  /**
   * List of teams user is a part of
   * @type {Array<string>}
   * @memberof UserObjectRequest
   */
  teams?: Array<string>;
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
  id?: string;
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
  created_at?: string;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof UserResponse
   */
  custom?: { [key: string]: any };
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
  id?: string;
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
  role?: string;
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
  updated_at?: string;
}
/**
 *
 * @export
 * @interface UserUpdated
 */
export interface UserUpdated {
  /**
   *
   * @type {string}
   * @memberof UserUpdated
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof UserUpdated
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserUpdated
   */
  user?: UserObject;
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
  enabled?: boolean;
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
  enabled?: boolean;
}

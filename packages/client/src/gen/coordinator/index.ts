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
   * Date/time of creation
   * @type {string}
   * @memberof Any
   */
  created_at?: string;
  /**
   * Event Type
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
   * Call CID
   * @type {string}
   * @memberof CallAccepted
   */
  call_cid: string;
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
  /**
   *
   * @type {UserResponse}
   * @memberof CallAccepted
   */
  user?: UserResponse;
}
/**
 *
 * @export
 * @interface CallCancelled
 */
export interface CallCancelled {
  /**
   * Call CID
   * @type {string}
   * @memberof CallCancelled
   */
  call_cid: string;
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
  /**
   *
   * @type {UserResponse}
   * @memberof CallCancelled
   */
  user?: UserResponse;
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
  call: CallResponse;
  /**
   *
   * @type {string}
   * @memberof CallCreated
   */
  created_at?: string;
  /**
   *
   * @type {Array<MemberResponse>}
   * @memberof CallCreated
   */
  members?: Array<MemberResponse>;
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
 * @interface CallEnded
 */
export interface CallEnded {
  /**
   * Call CID
   * @type {string}
   * @memberof CallEnded
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallEnded
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof CallEnded
   */
  type: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CallEnded
   */
  user?: UserResponse;
}
/**
 *
 * @export
 * @interface CallPermissionRequest
 */
export interface CallPermissionRequest {
  /**
   * Call CID
   * @type {string}
   * @memberof CallPermissionRequest
   */
  call_cid: string;
  /**
   *
   * @type {string}
   * @memberof CallPermissionRequest
   */
  created_at?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof CallPermissionRequest
   */
  permissions?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof CallPermissionRequest
   */
  type: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CallPermissionRequest
   */
  user?: UserResponse;
}
/**
 *
 * @export
 * @interface CallPermissionsUpdated
 */
export interface CallPermissionsUpdated {
  /**
   * Call CID
   * @type {string}
   * @memberof CallPermissionsUpdated
   */
  call_cid?: string;
  /**
   *
   * @type {string}
   * @memberof CallPermissionsUpdated
   */
  created_at?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof CallPermissionsUpdated
   */
  own_capabilities?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof CallPermissionsUpdated
   */
  type: string;
}
/**
 *
 * @export
 * @interface CallRejected
 */
export interface CallRejected {
  /**
   * Call CID
   * @type {string}
   * @memberof CallRejected
   */
  call_cid: string;
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
  /**
   *
   * @type {UserResponse}
   * @memberof CallRejected
   */
  user?: UserResponse;
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
  members: Array<MemberRequest>;
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
  created_at: string;
  /**
   *
   * @type {UserResponse}
   * @memberof CallResponse
   */
  created_by: UserResponse;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof CallResponse
   */
  custom?: { [key: string]: any };
  /**
   * Date/time of end
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
  settings: CallSettingsResponse;
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
   * @type {CallResponse}
   * @memberof CallStateResponseFields
   */
  call: CallResponse;
  /**
   * List of call members
   * @type {Array<MemberResponse>}
   * @memberof CallStateResponseFields
   */
  members?: Array<MemberResponse>;
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
 * @interface CallUpdated
 */
export interface CallUpdated {
  /**
   *
   * @type {CallResponse}
   * @memberof CallUpdated
   */
  call: CallResponse;
  /**
   *
   * @type {{ [key: string]: Array<string>; }}
   * @memberof CallUpdated
   */
  capabilities_by_role?: { [key: string]: Array<string> };
  /**
   *
   * @type {string}
   * @memberof CallUpdated
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof CallUpdated
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
   * Call CID
   * @type {string}
   * @memberof Custom
   */
  call_cid: string;
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
  /**
   *
   * @type {UserResponse}
   * @memberof Custom
   */
  user?: UserResponse;
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
 * @interface DeviceFieldsRequest
 */
export interface DeviceFieldsRequest {
  /**
   * Device ID
   * @type {string}
   * @memberof DeviceFieldsRequest
   */
  id?: string;
  /**
   *
   * @type {string}
   * @memberof DeviceFieldsRequest
   */
  push_provider?: DeviceFieldsRequestPushProviderEnum;
  /**
   * Name of the push provider configuration
   * @type {string}
   * @memberof DeviceFieldsRequest
   */
  push_provider_name?: string;
}

/**
 * @export
 */
export const DeviceFieldsRequestPushProviderEnum = {
  firebase: 'firebase',
  apn: 'apn',
  huawei: 'huawei',
  xiaomi: 'xiaomi',
} as const;
export type DeviceFieldsRequestPushProviderEnum =
  (typeof DeviceFieldsRequestPushProviderEnum)[keyof typeof DeviceFieldsRequestPushProviderEnum];

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
  duration?: string;
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
  duration?: string;
  /**
   *
   * @type {Array<MemberResponse>}
   * @memberof GetCallEdgeServerResponse
   */
  members?: Array<MemberResponse>;
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
  call: CallResponse;
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
   * @type {Array<MemberResponse>}
   * @memberof GetOrCreateCallResponse
   */
  members?: Array<MemberResponse>;
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
   * @type {CallResponse}
   * @memberof JoinCallResponse
   */
  call: CallResponse;
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
   * @type {Array<MemberResponse>}
   * @memberof JoinCallResponse
   */
  members?: Array<MemberResponse>;
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
 * @interface MemberRequest
 */
export interface MemberRequest {
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof MemberRequest
   */
  custom?: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof MemberRequest
   */
  role: string;
  /**
   *
   * @type {UserObjectRequest}
   * @memberof MemberRequest
   */
  user?: UserObjectRequest;
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
  custom?: { [key: string]: any };
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
  duration?: string;
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
   * User ID
   * @type {string}
   * @memberof MemberResponse
   */
  user_id?: string;
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
 * @interface QueryCallRequest
 */
export interface QueryCallRequest {
  /**
   *
   * @type {string}
   * @memberof QueryCallRequest
   */
  client_id: string;
  /**
   *
   * @type {string}
   * @memberof QueryCallRequest
   */
  connection_id: string;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof QueryCallRequest
   */
  custom?: { [key: string]: any };
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof QueryCallRequest
   */
  filter_conditions?: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof QueryCallRequest
   */
  id: string;
  /**
   *
   * @type {string}
   * @memberof QueryCallRequest
   */
  image?: string;
  /**
   *
   * @type {number}
   * @memberof QueryCallRequest
   */
  limit?: number;
  /**
   *
   * @type {number}
   * @memberof QueryCallRequest
   */
  member_limit?: number;
  /**
   *
   * @type {number}
   * @memberof QueryCallRequest
   */
  message_limit?: number;
  /**
   *
   * @type {string}
   * @memberof QueryCallRequest
   */
  name?: string;
  /**
   *
   * @type {string}
   * @memberof QueryCallRequest
   */
  next?: string;
  /**
   *
   * @type {string}
   * @memberof QueryCallRequest
   */
  prev?: string;
  /**
   *
   * @type {string}
   * @memberof QueryCallRequest
   */
  role: string;
  /**
   *
   * @type {Array<SortParamRequest>}
   * @memberof QueryCallRequest
   */
  sort: Array<SortParamRequest>;
  /**
   *
   * @type {Array<string>}
   * @memberof QueryCallRequest
   */
  teams?: Array<string>;
  /**
   *
   * @type {boolean}
   * @memberof QueryCallRequest
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
  calls?: Array<CallStateResponseFields>;
  /**
   *
   * @type {string}
   * @memberof QueryCallsResponse
   */
  duration?: string;
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
   * Websocket connection ID to interact with. You can pass it as body or URL parameter
   * @type {string}
   * @memberof QueryMembersRequest
   */
  connection_id: string;
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
  /**
   *
   * @type {string}
   * @memberof QueryMembersRequest
   */
  user_id?: string;
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
  duration?: string;
  /**
   *
   * @type {Array<MemberResponse>}
   * @memberof QueryMembersResponse
   */
  members?: Array<MemberResponse>;
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
 * @interface RequestPermissionRequest
 */
export interface RequestPermissionRequest {
  /**
   *
   * @type {Array<string>}
   * @memberof RequestPermissionRequest
   */
  permissions: RequestPermissionRequestPermissionsEnum;
}

/**
 * @export
 */
export const RequestPermissionRequestPermissionsEnum = {} as const;
export type RequestPermissionRequestPermissionsEnum =
  (typeof RequestPermissionRequestPermissionsEnum)[keyof typeof RequestPermissionRequestPermissionsEnum];

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
  duration?: string;
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
  access_request_enabled?: boolean;
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
  event_type: string;
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
  duration?: string;
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
  grant_permissions?: UpdateUserPermissionsRequestGrantPermissionsEnum;
  /**
   *
   * @type {Array<string>}
   * @memberof UpdateUserPermissionsRequest
   */
  revoke_permissions?: UpdateUserPermissionsRequestRevokePermissionsEnum;
  /**
   *
   * @type {string}
   * @memberof UpdateUserPermissionsRequest
   */
  user_id: string;
}

/**
 * @export
 */
export const UpdateUserPermissionsRequestGrantPermissionsEnum = {} as const;
export type UpdateUserPermissionsRequestGrantPermissionsEnum =
  (typeof UpdateUserPermissionsRequestGrantPermissionsEnum)[keyof typeof UpdateUserPermissionsRequestGrantPermissionsEnum];

/**
 * @export
 */
export const UpdateUserPermissionsRequestRevokePermissionsEnum = {} as const;
export type UpdateUserPermissionsRequestRevokePermissionsEnum =
  (typeof UpdateUserPermissionsRequestRevokePermissionsEnum)[keyof typeof UpdateUserPermissionsRequestRevokePermissionsEnum];

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
  role: string;
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
  updated_at: string;
}
/**
 *
 * @export
 * @interface UserUpdated
 */
export interface UserUpdated {
  /**
   * Date/time of creation
   * @type {string}
   * @memberof UserUpdated
   */
  created_at?: string;
  /**
   * Event Type
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
/**
 *
 * @export
 * @interface VideoWSAuthMessageRequest
 */
export interface VideoWSAuthMessageRequest {
  /**
   *
   * @type {DeviceFieldsRequest}
   * @memberof VideoWSAuthMessageRequest
   */
  device?: DeviceFieldsRequest;
  /**
   * Token string
   * @type {string}
   * @memberof VideoWSAuthMessageRequest
   */
  token: string;
  /**
   *
   * @type {UserObjectRequest}
   * @memberof VideoWSAuthMessageRequest
   */
  user_details: UserObjectRequest;
}

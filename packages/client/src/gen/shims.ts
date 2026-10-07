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

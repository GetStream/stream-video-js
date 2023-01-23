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
 * @interface Action
 */
export interface Action {
  /**
   *
   * @type {string}
   * @memberof Action
   */
  name?: string;
  /**
   *
   * @type {string}
   * @memberof Action
   */
  style?: string;
  /**
   *
   * @type {string}
   * @memberof Action
   */
  text?: string;
  /**
   *
   * @type {string}
   * @memberof Action
   */
  type?: string;
  /**
   *
   * @type {string}
   * @memberof Action
   */
  value?: string;
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
 * @interface Attachment
 */
export interface Attachment {
  [key: string]: any | any;
  /**
   *
   * @type {Array<Action>}
   * @memberof Attachment
   */
  actions?: Array<Action>;
  /**
   *
   * @type {string}
   * @memberof Attachment
   */
  asset_url?: string;
  /**
   *
   * @type {string}
   * @memberof Attachment
   */
  author_icon?: string;
  /**
   *
   * @type {string}
   * @memberof Attachment
   */
  author_link?: string;
  /**
   *
   * @type {string}
   * @memberof Attachment
   */
  author_name?: string;
  /**
   *
   * @type {string}
   * @memberof Attachment
   */
  color?: string;
  /**
   *
   * @type {string}
   * @memberof Attachment
   */
  fallback?: string;
  /**
   *
   * @type {Array<Field>}
   * @memberof Attachment
   */
  fields?: Array<Field>;
  /**
   *
   * @type {string}
   * @memberof Attachment
   */
  footer?: string;
  /**
   *
   * @type {string}
   * @memberof Attachment
   */
  footer_icon?: string;
  /**
   *
   * @type {Images}
   * @memberof Attachment
   */
  giphy?: Images;
  /**
   *
   * @type {string}
   * @memberof Attachment
   */
  image_url?: string;
  /**
   *
   * @type {string}
   * @memberof Attachment
   */
  og_scrape_url?: string;
  /**
   *
   * @type {number}
   * @memberof Attachment
   */
  original_height?: number;
  /**
   *
   * @type {number}
   * @memberof Attachment
   */
  original_width?: number;
  /**
   *
   * @type {string}
   * @memberof Attachment
   */
  pretext?: string;
  /**
   *
   * @type {string}
   * @memberof Attachment
   */
  text?: string;
  /**
   *
   * @type {string}
   * @memberof Attachment
   */
  thumb_url?: string;
  /**
   *
   * @type {string}
   * @memberof Attachment
   */
  title?: string;
  /**
   *
   * @type {string}
   * @memberof Attachment
   */
  title_link?: string;
  /**
   * Attachment type (e.g. image, video, url)
   * @type {string}
   * @memberof Attachment
   */
  type?: string;
}
/**
 *
 * @export
 * @interface AutomodDetails
 */
export interface AutomodDetails {
  /**
   *
   * @type {string}
   * @memberof AutomodDetails
   */
  action?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof AutomodDetails
   */
  image_labels?: Array<string>;
  /**
   *
   * @type {FlagMessageDetails}
   * @memberof AutomodDetails
   */
  message_details?: FlagMessageDetails;
  /**
   *
   * @type {string}
   * @memberof AutomodDetails
   */
  original_message_type?: string;
  /**
   *
   * @type {MessageModerationResult}
   * @memberof AutomodDetails
   */
  result?: MessageModerationResult;
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
 * @interface CallMember
 */
export interface CallMember {
  /**
   *
   * @type {string}
   * @memberof CallMember
   */
  created_at?: string;
  /**
   *
   * @type {{ [key: string]: any; }}
   * @memberof CallMember
   */
  custom?: { [key: string]: any };
  /**
   *
   * @type {string}
   * @memberof CallMember
   */
  deleted_at?: string;
  /**
   *
   * @type {string}
   * @memberof CallMember
   */
  role?: string;
  /**
   *
   * @type {string}
   * @memberof CallMember
   */
  updated_at?: string;
  /**
   *
   * @type {UserObject}
   * @memberof CallMember
   */
  user?: UserObject;
  /**
   *
   * @type {string}
   * @memberof CallMember
   */
  user_id?: string;
}
/**
 *
 * @export
 * @interface CallMemberRequest
 */
export interface CallMemberRequest {
  /**
   *
   * @type {string}
   * @memberof CallMemberRequest
   */
  created_at?: string;
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
  deleted_at?: string;
  /**
   *
   * @type {string}
   * @memberof CallMemberRequest
   */
  role?: string;
  /**
   *
   * @type {string}
   * @memberof CallMemberRequest
   */
  updated_at?: string;
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
 * @interface CallRequest
 */
export interface CallRequest {
  /**
   *
   * @type {UserObjectRequest}
   * @memberof CallRequest
   */
  created_by?: UserObjectRequest;
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
   * @type {UserObject}
   * @memberof CallResponse
   */
  created_by?: UserObject;
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
   * @type {CallSettings}
   * @memberof CallResponse
   */
  settings?: CallSettings;
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
 * @interface CallSettings
 */
export interface CallSettings {
  /**
   *
   * @type {BroadcastSettings}
   * @memberof CallSettings
   */
  broadcasting?: BroadcastSettings;
  /**
   *
   * @type {GeofenceSettings}
   * @memberof CallSettings
   */
  geofencing?: GeofenceSettings;
  /**
   *
   * @type {RecordSettings}
   * @memberof CallSettings
   */
  recording?: RecordSettings;
  /**
   *
   * @type {ScreensharingSettings}
   * @memberof CallSettings
   */
  screensharing?: ScreensharingSettings;
  /**
   *
   * @type {VideoSettings}
   * @memberof CallSettings
   */
  video?: VideoSettings;
}
/**
 *
 * @export
 * @interface ChannelConfigWithInfo
 */
export interface ChannelConfigWithInfo {
  /**
   *
   * @type {string}
   * @memberof ChannelConfigWithInfo
   */
  automod: ChannelConfigWithInfoAutomodEnum;
  /**
   *
   * @type {string}
   * @memberof ChannelConfigWithInfo
   */
  automod_behavior?: ChannelConfigWithInfoAutomodBehaviorEnum;
  /**
   *
   * @type {Thresholds}
   * @memberof ChannelConfigWithInfo
   */
  automod_thresholds?: Thresholds;
  /**
   *
   * @type {string}
   * @memberof ChannelConfigWithInfo
   */
  blocklist?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelConfigWithInfo
   */
  blocklist_behavior?: ChannelConfigWithInfoBlocklistBehaviorEnum;
  /**
   *
   * @type {Array<Command>}
   * @memberof ChannelConfigWithInfo
   */
  commands?: Array<Command>;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  connect_events?: boolean;
  /**
   *
   * @type {string}
   * @memberof ChannelConfigWithInfo
   */
  created_at?: string;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  custom_events?: boolean;
  /**
   *
   * @type {{ [key: string]: Array<string>; }}
   * @memberof ChannelConfigWithInfo
   */
  grants?: { [key: string]: Array<string> };
  /**
   *
   * @type {number}
   * @memberof ChannelConfigWithInfo
   */
  max_message_length?: number;
  /**
   *
   * @type {string}
   * @memberof ChannelConfigWithInfo
   */
  message_retention?: string;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  mutes?: boolean;
  /**
   *
   * @type {string}
   * @memberof ChannelConfigWithInfo
   */
  name?: string;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  push_notifications?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  quotes?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  reactions?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  read_events?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  reminders?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  replies?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  search?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  typing_events?: boolean;
  /**
   *
   * @type {string}
   * @memberof ChannelConfigWithInfo
   */
  updated_at?: string;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  uploads?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ChannelConfigWithInfo
   */
  url_enrichment?: boolean;
}

/**
 * @export
 */
export const ChannelConfigWithInfoAutomodEnum = {
  disabled: 'disabled',
  simple: 'simple',
  AI: 'AI',
} as const;
export type ChannelConfigWithInfoAutomodEnum =
  (typeof ChannelConfigWithInfoAutomodEnum)[keyof typeof ChannelConfigWithInfoAutomodEnum];

/**
 * @export
 */
export const ChannelConfigWithInfoAutomodBehaviorEnum = {
  flag: 'flag',
  block: 'block',
} as const;
export type ChannelConfigWithInfoAutomodBehaviorEnum =
  (typeof ChannelConfigWithInfoAutomodBehaviorEnum)[keyof typeof ChannelConfigWithInfoAutomodBehaviorEnum];

/**
 * @export
 */
export const ChannelConfigWithInfoBlocklistBehaviorEnum = {
  flag: 'flag',
  block: 'block',
} as const;
export type ChannelConfigWithInfoBlocklistBehaviorEnum =
  (typeof ChannelConfigWithInfoBlocklistBehaviorEnum)[keyof typeof ChannelConfigWithInfoBlocklistBehaviorEnum];

/**
 *
 * @export
 * @interface ChannelCreated
 */
export interface ChannelCreated {
  /**
   *
   * @type {string}
   * @memberof ChannelCreated
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelCreated
   */
  type: string;
}
/**
 *
 * @export
 * @interface ChannelDeleted
 */
export interface ChannelDeleted {
  /**
   *
   * @type {ChannelResponse}
   * @memberof ChannelDeleted
   */
  channel?: ChannelResponse;
  /**
   *
   * @type {string}
   * @memberof ChannelDeleted
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelDeleted
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelDeleted
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelDeleted
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelDeleted
   */
  team?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelDeleted
   */
  type: string;
}
/**
 *
 * @export
 * @interface ChannelFrozen
 */
export interface ChannelFrozen {
  /**
   *
   * @type {string}
   * @memberof ChannelFrozen
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelFrozen
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelFrozen
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelFrozen
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelFrozen
   */
  type: string;
}
/**
 *
 * @export
 * @interface ChannelHidden
 */
export interface ChannelHidden {
  /**
   *
   * @type {ChannelResponse}
   * @memberof ChannelHidden
   */
  channel?: ChannelResponse;
  /**
   *
   * @type {string}
   * @memberof ChannelHidden
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelHidden
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelHidden
   */
  cid?: string;
  /**
   *
   * @type {boolean}
   * @memberof ChannelHidden
   */
  clear_history?: boolean;
  /**
   *
   * @type {string}
   * @memberof ChannelHidden
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelHidden
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof ChannelHidden
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface ChannelKicked
 */
export interface ChannelKicked {
  /**
   *
   * @type {ChannelResponse}
   * @memberof ChannelKicked
   */
  channel?: ChannelResponse;
  /**
   *
   * @type {string}
   * @memberof ChannelKicked
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelKicked
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelKicked
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelKicked
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelKicked
   */
  type: string;
}
/**
 *
 * @export
 * @interface ChannelMember
 */
export interface ChannelMember {
  /**
   * Expiration date of the ban
   * @type {string}
   * @memberof ChannelMember
   */
  ban_expires?: string;
  /**
   * Whether member is banned this channel or not
   * @type {boolean}
   * @memberof ChannelMember
   */
  banned?: boolean;
  /**
   * Role of the member in the channel
   * @type {string}
   * @memberof ChannelMember
   */
  channel_role?: string;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof ChannelMember
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelMember
   */
  deleted_at?: string;
  /**
   * Date when invite was accepted
   * @type {string}
   * @memberof ChannelMember
   */
  invite_accepted_at?: string;
  /**
   * Date when invite was rejected
   * @type {string}
   * @memberof ChannelMember
   */
  invite_rejected_at?: string;
  /**
   * Whether member was invited or not
   * @type {boolean}
   * @memberof ChannelMember
   */
  invited?: boolean;
  /**
   * Whether member is channel moderator or not
   * @type {boolean}
   * @memberof ChannelMember
   */
  is_moderator?: boolean;
  /**
   * Permission level of the member in the channel (DEPRECATED: use channel_role instead)
   * @type {string}
   * @memberof ChannelMember
   */
  role?: ChannelMemberRoleEnum;
  /**
   * Whether member is shadow banned in this channel or not
   * @type {boolean}
   * @memberof ChannelMember
   */
  shadow_banned?: boolean;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof ChannelMember
   */
  updated_at?: string;
  /**
   *
   * @type {UserObject}
   * @memberof ChannelMember
   */
  user?: UserObject;
  /**
   *
   * @type {string}
   * @memberof ChannelMember
   */
  user_id?: string;
}

/**
 * @export
 */
export const ChannelMemberRoleEnum = {
  member: 'member',
  moderator: 'moderator',
  admin: 'admin',
  owner: 'owner',
} as const;
export type ChannelMemberRoleEnum =
  (typeof ChannelMemberRoleEnum)[keyof typeof ChannelMemberRoleEnum];

/**
 *
 * @export
 * @interface ChannelMessages
 */
export interface ChannelMessages {
  /**
   *
   * @type {ChannelResponse}
   * @memberof ChannelMessages
   */
  channel?: ChannelResponse;
  /**
   *
   * @type {Array<Message>}
   * @memberof ChannelMessages
   */
  messages?: Array<Message>;
}
/**
 *
 * @export
 * @interface ChannelMute
 */
export interface ChannelMute {
  /**
   *
   * @type {ChannelResponse}
   * @memberof ChannelMute
   */
  channel?: ChannelResponse;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof ChannelMute
   */
  created_at?: string;
  /**
   * Date/time of mute expiration
   * @type {string}
   * @memberof ChannelMute
   */
  expires?: string;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof ChannelMute
   */
  updated_at?: string;
  /**
   *
   * @type {UserObject}
   * @memberof ChannelMute
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface ChannelMuted
 */
export interface ChannelMuted {
  /**
   *
   * @type {string}
   * @memberof ChannelMuted
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelMuted
   */
  type: string;
}
/**
 * Represents channel in chat
 * @export
 * @interface ChannelResponse
 */
export interface ChannelResponse {
  [key: string]: any | any;
  /**
   * Whether auto translation is enabled or not
   * @type {boolean}
   * @memberof ChannelResponse
   */
  auto_translation_enabled?: boolean;
  /**
   * Language to translate to when auto translation is active
   * @type {string}
   * @memberof ChannelResponse
   */
  auto_translation_language?: string;
  /**
   * Channel CID (<type>:<id>)
   * @type {string}
   * @memberof ChannelResponse
   */
  cid?: string;
  /**
   *
   * @type {ChannelConfigWithInfo}
   * @memberof ChannelResponse
   */
  config?: ChannelConfigWithInfo;
  /**
   * Cooldown period after sending each message
   * @type {number}
   * @memberof ChannelResponse
   */
  cooldown?: number;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof ChannelResponse
   */
  created_at?: string;
  /**
   *
   * @type {UserObject}
   * @memberof ChannelResponse
   */
  created_by?: UserObject;
  /**
   * Date/time of deletion
   * @type {string}
   * @memberof ChannelResponse
   */
  deleted_at?: string;
  /**
   *
   * @type {boolean}
   * @memberof ChannelResponse
   */
  disabled?: boolean;
  /**
   * Whether channel is frozen or not
   * @type {boolean}
   * @memberof ChannelResponse
   */
  frozen?: boolean;
  /**
   * Whether this channel is hidden by current user or not
   * @type {boolean}
   * @memberof ChannelResponse
   */
  hidden?: boolean;
  /**
   * Date since when the message history is accessible
   * @type {string}
   * @memberof ChannelResponse
   */
  hide_messages_before?: string;
  /**
   * Channel unique ID
   * @type {string}
   * @memberof ChannelResponse
   */
  id?: string;
  /**
   * Date of the last message sent
   * @type {string}
   * @memberof ChannelResponse
   */
  last_message_at?: string;
  /**
   * Number of members in the channel
   * @type {number}
   * @memberof ChannelResponse
   */
  member_count?: number;
  /**
   * List of channel members (max 100)
   * @type {Array<ChannelMember>}
   * @memberof ChannelResponse
   */
  members?: Array<ChannelMember>;
  /**
   * Date of mute expiration
   * @type {string}
   * @memberof ChannelResponse
   */
  mute_expires_at?: string;
  /**
   * Whether this channel is muted or not
   * @type {boolean}
   * @memberof ChannelResponse
   */
  muted?: boolean;
  /**
   * List of channel capabilities of authenticated user
   * @type {Array<string>}
   * @memberof ChannelResponse
   */
  own_capabilities?: Array<string>;
  /**
   * Team the channel belongs to (multi-tenant only)
   * @type {string}
   * @memberof ChannelResponse
   */
  team?: string;
  /**
   * Date of the latest truncation of the channel
   * @type {string}
   * @memberof ChannelResponse
   */
  truncated_at?: string;
  /**
   *
   * @type {UserObject}
   * @memberof ChannelResponse
   */
  truncated_by?: UserObject;
  /**
   * Type of the channel
   * @type {string}
   * @memberof ChannelResponse
   */
  type?: string;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof ChannelResponse
   */
  updated_at?: string;
}
/**
 *
 * @export
 * @interface ChannelTruncated
 */
export interface ChannelTruncated {
  /**
   *
   * @type {ChannelResponse}
   * @memberof ChannelTruncated
   */
  channel?: ChannelResponse;
  /**
   *
   * @type {string}
   * @memberof ChannelTruncated
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelTruncated
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelTruncated
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelTruncated
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelTruncated
   */
  type: string;
}
/**
 *
 * @export
 * @interface ChannelUnfrozen
 */
export interface ChannelUnfrozen {
  /**
   *
   * @type {string}
   * @memberof ChannelUnfrozen
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelUnfrozen
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelUnfrozen
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelUnfrozen
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelUnfrozen
   */
  type: string;
}
/**
 *
 * @export
 * @interface ChannelUnmuted
 */
export interface ChannelUnmuted {
  /**
   *
   * @type {string}
   * @memberof ChannelUnmuted
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelUnmuted
   */
  type: string;
}
/**
 *
 * @export
 * @interface ChannelUpdated
 */
export interface ChannelUpdated {
  /**
   *
   * @type {ChannelResponse}
   * @memberof ChannelUpdated
   */
  channel?: ChannelResponse;
  /**
   *
   * @type {string}
   * @memberof ChannelUpdated
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelUpdated
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelUpdated
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelUpdated
   */
  created_at?: string;
  /**
   *
   * @type {Message}
   * @memberof ChannelUpdated
   */
  message?: Message;
  /**
   *
   * @type {string}
   * @memberof ChannelUpdated
   */
  team?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelUpdated
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof ChannelUpdated
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface ChannelVisible
 */
export interface ChannelVisible {
  /**
   *
   * @type {string}
   * @memberof ChannelVisible
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelVisible
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelVisible
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelVisible
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof ChannelVisible
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof ChannelVisible
   */
  user?: UserObject;
}
/**
 * Represents custom chat command
 * @export
 * @interface Command
 */
export interface Command {
  /**
   * Arguments help text, shown in commands auto-completion
   * @type {string}
   * @memberof Command
   */
  args?: string;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof Command
   */
  readonly created_at?: string;
  /**
   * Description, shown in commands auto-completion
   * @type {string}
   * @memberof Command
   */
  description?: string;
  /**
   * Unique command name
   * @type {string}
   * @memberof Command
   */
  name?: string;
  /**
   * Set name used for grouping commands
   * @type {string}
   * @memberof Command
   */
  set?: string;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof Command
   */
  readonly updated_at?: string;
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
  created_at?: string;
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
 * @interface Device
 */
export interface Device {
  /**
   * Date/time of creation
   * @type {string}
   * @memberof Device
   */
  created_at?: string;
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
  id?: string;
  /**
   *
   * @type {string}
   * @memberof Device
   */
  push_provider?: string;
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
  user_id?: string;
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
 * @interface Field
 */
export interface Field {
  /**
   *
   * @type {boolean}
   * @memberof Field
   */
  _short?: boolean;
  /**
   *
   * @type {string}
   * @memberof Field
   */
  title?: string;
  /**
   *
   * @type {string}
   * @memberof Field
   */
  value?: string;
}
/**
 * Contains information about flagged user or message
 * @export
 * @interface Flag
 */
export interface Flag {
  /**
   * Date of the approval
   * @type {string}
   * @memberof Flag
   */
  approved_at?: string;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof Flag
   */
  created_at?: string;
  /**
   *
   * @type {boolean}
   * @memberof Flag
   */
  created_by_automod?: boolean;
  /**
   *
   * @type {FlagDetails}
   * @memberof Flag
   */
  details?: FlagDetails;
  /**
   * Date of the rejection
   * @type {string}
   * @memberof Flag
   */
  rejected_at?: string;
  /**
   * Date of the review
   * @type {string}
   * @memberof Flag
   */
  reviewed_at?: string;
  /**
   *
   * @type {Message}
   * @memberof Flag
   */
  target_message?: Message;
  /**
   * ID of flagged message
   * @type {string}
   * @memberof Flag
   */
  target_message_id?: string;
  /**
   *
   * @type {UserObject}
   * @memberof Flag
   */
  target_user?: UserObject;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof Flag
   */
  updated_at?: string;
  /**
   *
   * @type {UserObject}
   * @memberof Flag
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface FlagDetails
 */
export interface FlagDetails {
  [key: string]: any | any;
  /**
   *
   * @type {AutomodDetails}
   * @memberof FlagDetails
   */
  automod?: AutomodDetails;
}
/**
 *
 * @export
 * @interface FlagMessageDetails
 */
export interface FlagMessageDetails {
  /**
   *
   * @type {boolean}
   * @memberof FlagMessageDetails
   */
  pin_changed?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof FlagMessageDetails
   */
  should_enrich?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof FlagMessageDetails
   */
  skip_push?: boolean;
  /**
   *
   * @type {string}
   * @memberof FlagMessageDetails
   */
  updated_by_id?: string;
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
   * @type {Array<CallMember>}
   * @memberof GetCallEdgeServerResponse
   */
  members?: Array<CallMember>;
  /**
   *
   * @type {CallMember}
   * @memberof GetCallEdgeServerResponse
   */
  membership?: CallMember | null;
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
   * @type {Array<CallMember>}
   * @memberof GetOrCreateCallResponse
   */
  members?: Array<CallMember>;
  /**
   *
   * @type {CallMember}
   * @memberof GetOrCreateCallResponse
   */
  membership?: CallMember | null;
}
/**
 *
 * @export
 * @interface HealthCheck
 */
export interface HealthCheck {
  /**
   *
   * @type {string}
   * @memberof HealthCheck
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof HealthCheck
   */
  created_at?: string;
  /**
   *
   * @type {OwnUser}
   * @memberof HealthCheck
   */
  me?: OwnUser;
  /**
   *
   * @type {string}
   * @memberof HealthCheck
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
 * @interface ImageData
 */
export interface ImageData {
  /**
   *
   * @type {string}
   * @memberof ImageData
   */
  frames?: string;
  /**
   *
   * @type {string}
   * @memberof ImageData
   */
  height?: string;
  /**
   *
   * @type {string}
   * @memberof ImageData
   */
  size?: string;
  /**
   *
   * @type {string}
   * @memberof ImageData
   */
  url?: string;
  /**
   *
   * @type {string}
   * @memberof ImageData
   */
  width?: string;
}
/**
 *
 * @export
 * @interface Images
 */
export interface Images {
  /**
   *
   * @type {ImageData}
   * @memberof Images
   */
  fixed_height?: ImageData;
  /**
   *
   * @type {ImageData}
   * @memberof Images
   */
  fixed_height_downsampled?: ImageData;
  /**
   *
   * @type {ImageData}
   * @memberof Images
   */
  fixed_height_still?: ImageData;
  /**
   *
   * @type {ImageData}
   * @memberof Images
   */
  fixed_width?: ImageData;
  /**
   *
   * @type {ImageData}
   * @memberof Images
   */
  fixed_width_downsampled?: ImageData;
  /**
   *
   * @type {ImageData}
   * @memberof Images
   */
  fixed_width_still?: ImageData;
  /**
   *
   * @type {ImageData}
   * @memberof Images
   */
  original?: ImageData;
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
   * @type {Array<CallMember>}
   * @memberof JoinCallResponse
   */
  members?: Array<CallMember>;
  /**
   *
   * @type {CallMember}
   * @memberof JoinCallResponse
   */
  membership?: CallMember | null;
}
/**
 *
 * @export
 * @interface LabelThresholds
 */
export interface LabelThresholds {
  /**
   * Threshold for automatic message block
   * @type {number}
   * @memberof LabelThresholds
   */
  block?: number;
  /**
   * Threshold for automatic message flag
   * @type {number}
   * @memberof LabelThresholds
   */
  flag?: number;
}
/**
 *
 * @export
 * @interface MemberAdded
 */
export interface MemberAdded {
  /**
   *
   * @type {string}
   * @memberof MemberAdded
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof MemberAdded
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof MemberAdded
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof MemberAdded
   */
  created_at?: string;
  /**
   *
   * @type {ChannelMember}
   * @memberof MemberAdded
   */
  member?: ChannelMember | null;
  /**
   *
   * @type {string}
   * @memberof MemberAdded
   */
  team?: string;
  /**
   *
   * @type {string}
   * @memberof MemberAdded
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof MemberAdded
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface MemberRemoved
 */
export interface MemberRemoved {
  /**
   *
   * @type {string}
   * @memberof MemberRemoved
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof MemberRemoved
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof MemberRemoved
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof MemberRemoved
   */
  created_at?: string;
  /**
   *
   * @type {ChannelMember}
   * @memberof MemberRemoved
   */
  member?: ChannelMember | null;
  /**
   *
   * @type {string}
   * @memberof MemberRemoved
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof MemberRemoved
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface MemberUpdated
 */
export interface MemberUpdated {
  /**
   *
   * @type {string}
   * @memberof MemberUpdated
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof MemberUpdated
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof MemberUpdated
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof MemberUpdated
   */
  created_at?: string;
  /**
   *
   * @type {ChannelMember}
   * @memberof MemberUpdated
   */
  member?: ChannelMember | null;
  /**
   *
   * @type {string}
   * @memberof MemberUpdated
   */
  team?: string;
  /**
   *
   * @type {string}
   * @memberof MemberUpdated
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof MemberUpdated
   */
  user?: UserObject;
}
/**
 * Represents any chat message
 * @export
 * @interface Message
 */
export interface Message {
  [key: string]: any | any;
  /**
   * Array of message attachments
   * @type {Array<Attachment>}
   * @memberof Message
   */
  attachments?: Array<Attachment>;
  /**
   * Whether `before_message_send webhook` failed or not. Field is only accessible in push webhook
   * @type {boolean}
   * @memberof Message
   */
  before_message_send_failed?: boolean;
  /**
   * Channel unique identifier in <type>:<id> format
   * @type {string}
   * @memberof Message
   */
  cid?: string;
  /**
   * Contains provided slash command
   * @type {string}
   * @memberof Message
   */
  command?: string;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof Message
   */
  created_at?: string;
  /**
   * Date/time of deletion
   * @type {string}
   * @memberof Message
   */
  deleted_at?: string;
  /**
   * Contains HTML markup of the message. Can only be set when using server-side API
   * @type {string}
   * @memberof Message
   */
  html?: string;
  /**
   * Object with translations. Key `language` contains the original language key. Other keys contain translations
   * @type {{ [key: string]: string; }}
   * @memberof Message
   */
  i18n?: { [key: string]: string };
  /**
   * Message ID is unique string identifier of the message
   * @type {string}
   * @memberof Message
   */
  id?: string;
  /**
   * Contains image moderation information
   * @type {{ [key: string]: Array<string>; }}
   * @memberof Message
   */
  image_labels?: { [key: string]: Array<string> };
  /**
   * List of 10 latest reactions to this message
   * @type {Array<Reaction>}
   * @memberof Message
   */
  latest_reactions?: Array<Reaction>;
  /**
   * List of mentioned users
   * @type {Array<UserObject>}
   * @memberof Message
   */
  mentioned_users?: Array<UserObject>;
  /**
   * Should be empty if `text` is provided. Can only be set when using server-side API
   * @type {string}
   * @memberof Message
   */
  mml: string;
  /**
   * List of 10 latest reactions of authenticated user to this message
   * @type {Array<Reaction>}
   * @memberof Message
   */
  own_reactions?: Array<Reaction>;
  /**
   * ID of parent message (thread)
   * @type {string}
   * @memberof Message
   */
  parent_id?: string;
  /**
   * Date when pinned message expires
   * @type {string}
   * @memberof Message
   */
  pin_expires?: string;
  /**
   * Whether message is pinned or not
   * @type {boolean}
   * @memberof Message
   */
  pinned?: boolean;
  /**
   * Date when message got pinned
   * @type {string}
   * @memberof Message
   */
  pinned_at?: string;
  /**
   *
   * @type {UserObject}
   * @memberof Message
   */
  pinned_by?: UserObject;
  /**
   *
   * @type {Message}
   * @memberof Message
   */
  quoted_message?: Message;
  /**
   *
   * @type {string}
   * @memberof Message
   */
  quoted_message_id?: string;
  /**
   * An object containing number of reactions of each type. Key: reaction type (string), value: number of reactions (int)
   * @type {{ [key: string]: number; }}
   * @memberof Message
   */
  reaction_counts?: { [key: string]: number };
  /**
   * An object containing scores of reactions of each type. Key: reaction type (string), value: total score of reactions (int)
   * @type {{ [key: string]: number; }}
   * @memberof Message
   */
  reaction_scores?: { [key: string]: number };
  /**
   * Number of replies to this message
   * @type {number}
   * @memberof Message
   */
  reply_count?: number;
  /**
   * Whether the message was shadowed or not
   * @type {boolean}
   * @memberof Message
   */
  shadowed?: boolean;
  /**
   * Whether thread reply should be shown in the channel as well
   * @type {boolean}
   * @memberof Message
   */
  show_in_channel?: boolean;
  /**
   * Whether message is silent or not
   * @type {boolean}
   * @memberof Message
   */
  silent?: boolean;
  /**
   * Text of the message. Should be empty if `mml` is provided
   * @type {string}
   * @memberof Message
   */
  text: string;
  /**
   * List of users who participate in thread
   * @type {Array<UserObject>}
   * @memberof Message
   */
  thread_participants?: Array<UserObject>;
  /**
   * Contains type of the message
   * @type {string}
   * @memberof Message
   */
  type?: MessageTypeEnum;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof Message
   */
  updated_at?: string;
  /**
   *
   * @type {UserObject}
   * @memberof Message
   */
  user?: UserObject;
}

/**
 * @export
 */
export const MessageTypeEnum = {
  regular: 'regular',
  ephemeral: 'ephemeral',
  error: 'error',
  reply: 'reply',
  system: 'system',
  deleted: 'deleted',
} as const;
export type MessageTypeEnum =
  (typeof MessageTypeEnum)[keyof typeof MessageTypeEnum];

/**
 *
 * @export
 * @interface MessageDeleted
 */
export interface MessageDeleted {
  /**
   *
   * @type {string}
   * @memberof MessageDeleted
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof MessageDeleted
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof MessageDeleted
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof MessageDeleted
   */
  created_at?: string;
  /**
   *
   * @type {boolean}
   * @memberof MessageDeleted
   */
  hard_delete?: boolean;
  /**
   *
   * @type {Message}
   * @memberof MessageDeleted
   */
  message?: Message;
  /**
   *
   * @type {string}
   * @memberof MessageDeleted
   */
  team?: string;
  /**
   *
   * @type {Array<UserObject>}
   * @memberof MessageDeleted
   */
  thread_participants?: Array<UserObject>;
  /**
   *
   * @type {string}
   * @memberof MessageDeleted
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof MessageDeleted
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface MessageFlagged
 */
export interface MessageFlagged {
  /**
   *
   * @type {string}
   * @memberof MessageFlagged
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof MessageFlagged
   */
  created_at?: string;
  /**
   *
   * @type {Flag}
   * @memberof MessageFlagged
   */
  flag?: Flag;
  /**
   *
   * @type {Message}
   * @memberof MessageFlagged
   */
  message?: Message;
  /**
   *
   * @type {Array<UserObject>}
   * @memberof MessageFlagged
   */
  thread_participants?: Array<UserObject>;
  /**
   *
   * @type {string}
   * @memberof MessageFlagged
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof MessageFlagged
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface MessageModerationResult
 */
export interface MessageModerationResult {
  /**
   *
   * @type {string}
   * @memberof MessageModerationResult
   */
  action?: string;
  /**
   *
   * @type {ModerationResponse}
   * @memberof MessageModerationResult
   */
  ai_moderation_response?: ModerationResponse;
  /**
   *
   * @type {string}
   * @memberof MessageModerationResult
   */
  blocked_word?: string;
  /**
   *
   * @type {string}
   * @memberof MessageModerationResult
   */
  blocklist_name?: string;
  /**
   *
   * @type {string}
   * @memberof MessageModerationResult
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof MessageModerationResult
   */
  message_id?: string;
  /**
   *
   * @type {string}
   * @memberof MessageModerationResult
   */
  moderated_by?: string;
  /**
   *
   * @type {Thresholds}
   * @memberof MessageModerationResult
   */
  moderation_thresholds?: Thresholds;
  /**
   *
   * @type {string}
   * @memberof MessageModerationResult
   */
  updated_at?: string;
  /**
   *
   * @type {boolean}
   * @memberof MessageModerationResult
   */
  user_bad_karma?: boolean;
  /**
   *
   * @type {number}
   * @memberof MessageModerationResult
   */
  user_karma?: number;
}
/**
 *
 * @export
 * @interface MessageNew
 */
export interface MessageNew {
  /**
   *
   * @type {string}
   * @memberof MessageNew
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof MessageNew
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof MessageNew
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof MessageNew
   */
  created_at?: string;
  /**
   *
   * @type {Message}
   * @memberof MessageNew
   */
  message?: Message;
  /**
   *
   * @type {string}
   * @memberof MessageNew
   */
  team?: string;
  /**
   *
   * @type {Array<UserObject>}
   * @memberof MessageNew
   */
  thread_participants?: Array<UserObject>;
  /**
   *
   * @type {string}
   * @memberof MessageNew
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof MessageNew
   */
  user?: UserObject;
  /**
   *
   * @type {number}
   * @memberof MessageNew
   */
  watcher_count?: number;
}
/**
 *
 * @export
 * @interface MessageRead
 */
export interface MessageRead {
  /**
   *
   * @type {string}
   * @memberof MessageRead
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof MessageRead
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof MessageRead
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof MessageRead
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof MessageRead
   */
  team?: string;
  /**
   *
   * @type {string}
   * @memberof MessageRead
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof MessageRead
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface MessageUnblocked
 */
export interface MessageUnblocked {
  /**
   *
   * @type {string}
   * @memberof MessageUnblocked
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof MessageUnblocked
   */
  created_at?: string;
  /**
   *
   * @type {Message}
   * @memberof MessageUnblocked
   */
  message?: Message;
  /**
   *
   * @type {Array<UserObject>}
   * @memberof MessageUnblocked
   */
  thread_participants?: Array<UserObject>;
  /**
   *
   * @type {string}
   * @memberof MessageUnblocked
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof MessageUnblocked
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface MessageUpdated
 */
export interface MessageUpdated {
  /**
   *
   * @type {string}
   * @memberof MessageUpdated
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof MessageUpdated
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof MessageUpdated
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof MessageUpdated
   */
  created_at?: string;
  /**
   *
   * @type {Message}
   * @memberof MessageUpdated
   */
  message?: Message;
  /**
   *
   * @type {string}
   * @memberof MessageUpdated
   */
  team?: string;
  /**
   *
   * @type {Array<UserObject>}
   * @memberof MessageUpdated
   */
  thread_participants?: Array<UserObject>;
  /**
   *
   * @type {string}
   * @memberof MessageUpdated
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof MessageUpdated
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface ModerationResponse
 */
export interface ModerationResponse {
  /**
   *
   * @type {string}
   * @memberof ModerationResponse
   */
  action?: string;
  /**
   *
   * @type {number}
   * @memberof ModerationResponse
   */
  explicit?: number;
  /**
   *
   * @type {number}
   * @memberof ModerationResponse
   */
  spam?: number;
  /**
   *
   * @type {number}
   * @memberof ModerationResponse
   */
  toxic?: number;
}
/**
 *
 * @export
 * @interface NotificationAddedToChannel
 */
export interface NotificationAddedToChannel {
  /**
   *
   * @type {ChannelResponse}
   * @memberof NotificationAddedToChannel
   */
  channel?: ChannelResponse;
  /**
   *
   * @type {string}
   * @memberof NotificationAddedToChannel
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationAddedToChannel
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationAddedToChannel
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationAddedToChannel
   */
  created_at?: string;
  /**
   *
   * @type {ChannelMember}
   * @memberof NotificationAddedToChannel
   */
  member?: ChannelMember | null;
  /**
   *
   * @type {string}
   * @memberof NotificationAddedToChannel
   */
  type: string;
}
/**
 *
 * @export
 * @interface NotificationChannelDeleted
 */
export interface NotificationChannelDeleted {
  /**
   *
   * @type {ChannelResponse}
   * @memberof NotificationChannelDeleted
   */
  channel?: ChannelResponse;
  /**
   *
   * @type {string}
   * @memberof NotificationChannelDeleted
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationChannelDeleted
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationChannelDeleted
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationChannelDeleted
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationChannelDeleted
   */
  team?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationChannelDeleted
   */
  type: string;
}
/**
 *
 * @export
 * @interface NotificationChannelMutesUpdated
 */
export interface NotificationChannelMutesUpdated {
  /**
   *
   * @type {string}
   * @memberof NotificationChannelMutesUpdated
   */
  created_at?: string;
  /**
   *
   * @type {OwnUser}
   * @memberof NotificationChannelMutesUpdated
   */
  me?: OwnUser;
  /**
   *
   * @type {string}
   * @memberof NotificationChannelMutesUpdated
   */
  type: string;
}
/**
 *
 * @export
 * @interface NotificationChannelTruncated
 */
export interface NotificationChannelTruncated {
  /**
   *
   * @type {ChannelResponse}
   * @memberof NotificationChannelTruncated
   */
  channel?: ChannelResponse;
  /**
   *
   * @type {string}
   * @memberof NotificationChannelTruncated
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationChannelTruncated
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationChannelTruncated
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationChannelTruncated
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationChannelTruncated
   */
  type: string;
}
/**
 *
 * @export
 * @interface NotificationInviteAccepted
 */
export interface NotificationInviteAccepted {
  /**
   *
   * @type {ChannelResponse}
   * @memberof NotificationInviteAccepted
   */
  channel?: ChannelResponse;
  /**
   *
   * @type {string}
   * @memberof NotificationInviteAccepted
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationInviteAccepted
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationInviteAccepted
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationInviteAccepted
   */
  created_at?: string;
  /**
   *
   * @type {ChannelMember}
   * @memberof NotificationInviteAccepted
   */
  member?: ChannelMember | null;
  /**
   *
   * @type {string}
   * @memberof NotificationInviteAccepted
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof NotificationInviteAccepted
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface NotificationInviteRejected
 */
export interface NotificationInviteRejected {
  /**
   *
   * @type {ChannelResponse}
   * @memberof NotificationInviteRejected
   */
  channel?: ChannelResponse;
  /**
   *
   * @type {string}
   * @memberof NotificationInviteRejected
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationInviteRejected
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationInviteRejected
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationInviteRejected
   */
  created_at?: string;
  /**
   *
   * @type {ChannelMember}
   * @memberof NotificationInviteRejected
   */
  member?: ChannelMember | null;
  /**
   *
   * @type {string}
   * @memberof NotificationInviteRejected
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof NotificationInviteRejected
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface NotificationInvited
 */
export interface NotificationInvited {
  /**
   *
   * @type {ChannelResponse}
   * @memberof NotificationInvited
   */
  channel?: ChannelResponse;
  /**
   *
   * @type {string}
   * @memberof NotificationInvited
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationInvited
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationInvited
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationInvited
   */
  created_at?: string;
  /**
   *
   * @type {ChannelMember}
   * @memberof NotificationInvited
   */
  member?: ChannelMember | null;
  /**
   *
   * @type {string}
   * @memberof NotificationInvited
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof NotificationInvited
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface NotificationMarkRead
 */
export interface NotificationMarkRead {
  /**
   *
   * @type {ChannelResponse}
   * @memberof NotificationMarkRead
   */
  channel?: ChannelResponse;
  /**
   *
   * @type {string}
   * @memberof NotificationMarkRead
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationMarkRead
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationMarkRead
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationMarkRead
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationMarkRead
   */
  team?: string;
  /**
   *
   * @type {number}
   * @memberof NotificationMarkRead
   */
  total_unread_count?: number;
  /**
   *
   * @type {string}
   * @memberof NotificationMarkRead
   */
  type: string;
  /**
   *
   * @type {number}
   * @memberof NotificationMarkRead
   */
  unread_channels?: number;
  /**
   *
   * @type {number}
   * @memberof NotificationMarkRead
   */
  unread_count?: number;
  /**
   *
   * @type {UserObject}
   * @memberof NotificationMarkRead
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface NotificationMarkUnread
 */
export interface NotificationMarkUnread {
  /**
   *
   * @type {ChannelResponse}
   * @memberof NotificationMarkUnread
   */
  channel?: ChannelResponse;
  /**
   *
   * @type {string}
   * @memberof NotificationMarkUnread
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationMarkUnread
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationMarkUnread
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationMarkUnread
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationMarkUnread
   */
  team?: string;
  /**
   *
   * @type {number}
   * @memberof NotificationMarkUnread
   */
  total_unread_count?: number;
  /**
   *
   * @type {string}
   * @memberof NotificationMarkUnread
   */
  type: string;
  /**
   *
   * @type {number}
   * @memberof NotificationMarkUnread
   */
  unread_channels?: number;
  /**
   *
   * @type {number}
   * @memberof NotificationMarkUnread
   */
  unread_count?: number;
  /**
   *
   * @type {UserObject}
   * @memberof NotificationMarkUnread
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface NotificationMessageNew
 */
export interface NotificationMessageNew {
  /**
   *
   * @type {ChannelResponse}
   * @memberof NotificationMessageNew
   */
  channel?: ChannelResponse;
  /**
   *
   * @type {string}
   * @memberof NotificationMessageNew
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationMessageNew
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationMessageNew
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationMessageNew
   */
  created_at?: string;
  /**
   *
   * @type {Message}
   * @memberof NotificationMessageNew
   */
  message?: Message;
  /**
   *
   * @type {string}
   * @memberof NotificationMessageNew
   */
  team?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationMessageNew
   */
  type: string;
}
/**
 *
 * @export
 * @interface NotificationMutesUpdated
 */
export interface NotificationMutesUpdated {
  /**
   *
   * @type {string}
   * @memberof NotificationMutesUpdated
   */
  created_at?: string;
  /**
   *
   * @type {OwnUser}
   * @memberof NotificationMutesUpdated
   */
  me?: OwnUser;
  /**
   *
   * @type {string}
   * @memberof NotificationMutesUpdated
   */
  type: string;
}
/**
 *
 * @export
 * @interface NotificationRemovedFromChannel
 */
export interface NotificationRemovedFromChannel {
  /**
   *
   * @type {ChannelResponse}
   * @memberof NotificationRemovedFromChannel
   */
  channel?: ChannelResponse;
  /**
   *
   * @type {string}
   * @memberof NotificationRemovedFromChannel
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationRemovedFromChannel
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationRemovedFromChannel
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof NotificationRemovedFromChannel
   */
  created_at?: string;
  /**
   *
   * @type {ChannelMember}
   * @memberof NotificationRemovedFromChannel
   */
  member?: ChannelMember | null;
  /**
   *
   * @type {string}
   * @memberof NotificationRemovedFromChannel
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof NotificationRemovedFromChannel
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface OwnUser
 */
export interface OwnUser {
  [key: string]: any | any;
  /**
   *
   * @type {boolean}
   * @memberof OwnUser
   */
  banned?: boolean;
  /**
   *
   * @type {Array<ChannelMute>}
   * @memberof OwnUser
   */
  channel_mutes?: Array<ChannelMute>;
  /**
   *
   * @type {string}
   * @memberof OwnUser
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof OwnUser
   */
  deactivated_at?: string;
  /**
   *
   * @type {string}
   * @memberof OwnUser
   */
  deleted_at?: string;
  /**
   *
   * @type {Array<Device>}
   * @memberof OwnUser
   */
  devices?: Array<Device>;
  /**
   *
   * @type {string}
   * @memberof OwnUser
   */
  id?: string;
  /**
   *
   * @type {boolean}
   * @memberof OwnUser
   */
  invisible?: boolean;
  /**
   *
   * @type {string}
   * @memberof OwnUser
   */
  language?: string;
  /**
   *
   * @type {string}
   * @memberof OwnUser
   */
  last_active?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof OwnUser
   */
  latest_hidden_channels?: Array<string>;
  /**
   *
   * @type {Array<UserMute>}
   * @memberof OwnUser
   */
  mutes?: Array<UserMute>;
  /**
   *
   * @type {boolean}
   * @memberof OwnUser
   */
  online?: boolean;
  /**
   *
   * @type {PushNotificationSettings}
   * @memberof OwnUser
   */
  push_notifications?: PushNotificationSettings;
  /**
   *
   * @type {string}
   * @memberof OwnUser
   */
  role?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof OwnUser
   */
  teams?: Array<string>;
  /**
   *
   * @type {number}
   * @memberof OwnUser
   */
  total_unread_count?: number;
  /**
   *
   * @type {number}
   * @memberof OwnUser
   */
  unread_channels?: number;
  /**
   *
   * @type {number}
   * @memberof OwnUser
   */
  unread_count?: number;
  /**
   *
   * @type {string}
   * @memberof OwnUser
   */
  updated_at?: string;
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
 * Represents user reaction to a message
 * @export
 * @interface Reaction
 */
export interface Reaction {
  [key: string]: any | any;
  /**
   * Date/time of creation
   * @type {string}
   * @memberof Reaction
   */
  readonly created_at?: string;
  /**
   * ID of a message user reacted to
   * @type {string}
   * @memberof Reaction
   */
  message_id?: string;
  /**
   * Reaction score. If not specified reaction has score of 1
   * @type {number}
   * @memberof Reaction
   */
  score?: number;
  /**
   * The type of reaction (e.g. 'like', 'laugh', 'wow')
   * @type {string}
   * @memberof Reaction
   */
  type: string;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof Reaction
   */
  readonly updated_at?: string;
  /**
   *
   * @type {UserObject}
   * @memberof Reaction
   */
  user?: UserObject;
  /**
   * ID of a user who reacted to a message
   * @type {string}
   * @memberof Reaction
   */
  user_id?: string;
}
/**
 *
 * @export
 * @interface ReactionDeleted
 */
export interface ReactionDeleted {
  /**
   *
   * @type {string}
   * @memberof ReactionDeleted
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof ReactionDeleted
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof ReactionDeleted
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof ReactionDeleted
   */
  created_at?: string;
  /**
   *
   * @type {Message}
   * @memberof ReactionDeleted
   */
  message?: Message;
  /**
   *
   * @type {Reaction}
   * @memberof ReactionDeleted
   */
  reaction?: Reaction | null;
  /**
   *
   * @type {string}
   * @memberof ReactionDeleted
   */
  team?: string;
  /**
   *
   * @type {Array<UserObject>}
   * @memberof ReactionDeleted
   */
  thread_participants?: Array<UserObject>;
  /**
   *
   * @type {string}
   * @memberof ReactionDeleted
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof ReactionDeleted
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface ReactionNew
 */
export interface ReactionNew {
  /**
   *
   * @type {string}
   * @memberof ReactionNew
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof ReactionNew
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof ReactionNew
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof ReactionNew
   */
  created_at?: string;
  /**
   *
   * @type {Message}
   * @memberof ReactionNew
   */
  message?: Message;
  /**
   *
   * @type {Reaction}
   * @memberof ReactionNew
   */
  reaction?: Reaction | null;
  /**
   *
   * @type {string}
   * @memberof ReactionNew
   */
  team?: string;
  /**
   *
   * @type {Array<UserObject>}
   * @memberof ReactionNew
   */
  thread_participants?: Array<UserObject>;
  /**
   *
   * @type {string}
   * @memberof ReactionNew
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof ReactionNew
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface ReactionUpdated
 */
export interface ReactionUpdated {
  /**
   *
   * @type {string}
   * @memberof ReactionUpdated
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof ReactionUpdated
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof ReactionUpdated
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof ReactionUpdated
   */
  created_at?: string;
  /**
   *
   * @type {Message}
   * @memberof ReactionUpdated
   */
  message?: Message;
  /**
   *
   * @type {Reaction}
   * @memberof ReactionUpdated
   */
  reaction?: Reaction | null;
  /**
   *
   * @type {string}
   * @memberof ReactionUpdated
   */
  team?: string;
  /**
   *
   * @type {string}
   * @memberof ReactionUpdated
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof ReactionUpdated
   */
  user?: UserObject;
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
 * Sets thresholds for AI moderation
 * @export
 * @interface Thresholds
 */
export interface Thresholds {
  /**
   *
   * @type {LabelThresholds}
   * @memberof Thresholds
   */
  explicit?: LabelThresholds;
  /**
   *
   * @type {LabelThresholds}
   * @memberof Thresholds
   */
  spam?: LabelThresholds;
  /**
   *
   * @type {LabelThresholds}
   * @memberof Thresholds
   */
  toxic?: LabelThresholds;
}
/**
 *
 * @export
 * @interface TypingStart
 */
export interface TypingStart {
  /**
   *
   * @type {string}
   * @memberof TypingStart
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof TypingStart
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof TypingStart
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof TypingStart
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof TypingStart
   */
  parent_id?: string;
  /**
   *
   * @type {string}
   * @memberof TypingStart
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof TypingStart
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface TypingStop
 */
export interface TypingStop {
  /**
   *
   * @type {string}
   * @memberof TypingStop
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof TypingStop
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof TypingStop
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof TypingStop
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof TypingStop
   */
  parent_id?: string;
  /**
   *
   * @type {string}
   * @memberof TypingStop
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof TypingStop
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface UserBanned
 */
export interface UserBanned {
  /**
   *
   * @type {string}
   * @memberof UserBanned
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof UserBanned
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof UserBanned
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof UserBanned
   */
  created_at?: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserBanned
   */
  created_by?: UserObject;
  /**
   *
   * @type {string}
   * @memberof UserBanned
   */
  expiration?: string;
  /**
   *
   * @type {string}
   * @memberof UserBanned
   */
  reason?: string;
  /**
   *
   * @type {boolean}
   * @memberof UserBanned
   */
  shadow?: boolean;
  /**
   *
   * @type {string}
   * @memberof UserBanned
   */
  team?: string;
  /**
   *
   * @type {string}
   * @memberof UserBanned
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserBanned
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface UserDeactivated
 */
export interface UserDeactivated {
  /**
   *
   * @type {string}
   * @memberof UserDeactivated
   */
  created_at?: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserDeactivated
   */
  created_by?: UserObject;
  /**
   *
   * @type {string}
   * @memberof UserDeactivated
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserDeactivated
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface UserDeleted
 */
export interface UserDeleted {
  /**
   *
   * @type {string}
   * @memberof UserDeleted
   */
  created_at?: string;
  /**
   *
   * @type {boolean}
   * @memberof UserDeleted
   */
  delete_conversation_channels?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof UserDeleted
   */
  hard_delete?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof UserDeleted
   */
  mark_messages_deleted?: boolean;
  /**
   *
   * @type {string}
   * @memberof UserDeleted
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserDeleted
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface UserFlagged
 */
export interface UserFlagged {
  /**
   *
   * @type {string}
   * @memberof UserFlagged
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof UserFlagged
   */
  target_user?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof UserFlagged
   */
  target_users?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof UserFlagged
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserFlagged
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface UserMute
 */
export interface UserMute {
  /**
   * Date/time of creation
   * @type {string}
   * @memberof UserMute
   */
  created_at?: string;
  /**
   * Date/time of mute expiration
   * @type {string}
   * @memberof UserMute
   */
  expires?: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserMute
   */
  target?: UserObject;
  /**
   * Date/time of the last update
   * @type {string}
   * @memberof UserMute
   */
  updated_at?: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserMute
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface UserMuted
 */
export interface UserMuted {
  /**
   *
   * @type {string}
   * @memberof UserMuted
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof UserMuted
   */
  target_user?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof UserMuted
   */
  target_users?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof UserMuted
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserMuted
   */
  user?: UserObject;
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
 * @interface UserPresenceChanged
 */
export interface UserPresenceChanged {
  /**
   *
   * @type {string}
   * @memberof UserPresenceChanged
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof UserPresenceChanged
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserPresenceChanged
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface UserReactivated
 */
export interface UserReactivated {
  /**
   *
   * @type {string}
   * @memberof UserReactivated
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof UserReactivated
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserReactivated
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface UserUnbanned
 */
export interface UserUnbanned {
  /**
   *
   * @type {string}
   * @memberof UserUnbanned
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof UserUnbanned
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof UserUnbanned
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof UserUnbanned
   */
  created_at?: string;
  /**
   *
   * @type {boolean}
   * @memberof UserUnbanned
   */
  shadow?: boolean;
  /**
   *
   * @type {string}
   * @memberof UserUnbanned
   */
  team?: string;
  /**
   *
   * @type {string}
   * @memberof UserUnbanned
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserUnbanned
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface UserUnmuted
 */
export interface UserUnmuted {
  /**
   *
   * @type {string}
   * @memberof UserUnmuted
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof UserUnmuted
   */
  target_user?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof UserUnmuted
   */
  target_users?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof UserUnmuted
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserUnmuted
   */
  user?: UserObject;
}
/**
 *
 * @export
 * @interface UserUnreadMessageReminder
 */
export interface UserUnreadMessageReminder {
  /**
   *
   * @type {{ [key: string]: ChannelMessages; }}
   * @memberof UserUnreadMessageReminder
   */
  channels?: { [key: string]: ChannelMessages };
  /**
   *
   * @type {string}
   * @memberof UserUnreadMessageReminder
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof UserUnreadMessageReminder
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserUnreadMessageReminder
   */
  user?: UserObject;
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
 * @interface UserWatchingStart
 */
export interface UserWatchingStart {
  /**
   *
   * @type {string}
   * @memberof UserWatchingStart
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof UserWatchingStart
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof UserWatchingStart
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof UserWatchingStart
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof UserWatchingStart
   */
  team?: string;
  /**
   *
   * @type {string}
   * @memberof UserWatchingStart
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserWatchingStart
   */
  user?: UserObject;
  /**
   *
   * @type {number}
   * @memberof UserWatchingStart
   */
  watcher_count?: number;
}
/**
 *
 * @export
 * @interface UserWatchingStop
 */
export interface UserWatchingStop {
  /**
   *
   * @type {string}
   * @memberof UserWatchingStop
   */
  channel_id?: string;
  /**
   *
   * @type {string}
   * @memberof UserWatchingStop
   */
  channel_type?: string;
  /**
   *
   * @type {string}
   * @memberof UserWatchingStop
   */
  cid?: string;
  /**
   *
   * @type {string}
   * @memberof UserWatchingStop
   */
  created_at?: string;
  /**
   *
   * @type {string}
   * @memberof UserWatchingStop
   */
  type: string;
  /**
   *
   * @type {UserObject}
   * @memberof UserWatchingStop
   */
  user?: UserObject;
  /**
   *
   * @type {number}
   * @memberof UserWatchingStop
   */
  watcher_count?: number;
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
